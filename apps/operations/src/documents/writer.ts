import { Client, estypes } from '@elastic/elasticsearch';
import { Injectable, Logger } from '@nestjs/common';
import { bufferAsyncIterator } from '@app/typescript';

export type Document = {
  job_link: string;
  last_processed_time: string;
  first_seen: string;
  got_summary: boolean;
  got_ner: boolean;
  is_being_worked: boolean;
  job_title: string;
  company: string;
  job_location: string;
  search_city: string;
  search_country: string;
  search_position: string;
  job_level: string;
  job_type: string;
};

export type WriteStats = {
  successful: number;
  failed: number;
  total: number;
  elapsedTimeMs: number;
};

@Injectable()
export class Writer {
  private readonly logger = new Logger(Writer.name);
  constructor(
    private readonly elastic: Client,
  ) {}

  async write(
    indexName: string,
    iterator: AsyncGenerator<Document>,
    options?: { bulkSize?: number; sliceId?: number },
  ): Promise<WriteStats> {
    const startTime = Date.now();

    const bulkSize = options?.bulkSize ?? 1000;
    const sliceId = options?.sliceId ?? 0;

    let countSuccess = 0;
    let countFailed = 0;
    let countTotal = 0;

    const buffer = bufferAsyncIterator(iterator, bulkSize);

    for await (const docs of buffer) {
      const bulkStart = Date.now();
      const response = await this.elastic.bulk(
        {
          refresh: false,
          operations: docs.reduce((acc: unknown[], doc) => {
            acc.push(
              { index: { _index: indexName, _id: doc.job_link } },
              doc,
            );
            return acc;
          }, []),
        },
        {
          maxRetries: 3,
          retryOnTimeout: true,
          requestTimeout: 30_000,
        },
      );

      const bulkEnd = Date.now();

      const operations = response.items.flatMap((item) => Object.values(item));
      const { successes, failures } = operations.reduce(
        (acc, operation) => {
          const success = operation.status >= 200 && operation.status < 400;
          const failure = operation.status >= 400 && operation.status < 600;
          const notFound = operation.status === 404;

          if (success || notFound) {
            acc.successes.push(operation);
          } else if (failure) {
            acc.failures.push(operation);
          }

          return acc;
        },
        {
          successes: [] as estypes.BulkResponseItem[],
          failures: [] as estypes.BulkResponseItem[],
        },
      );

      this.logger.log(
        `Wrote ${successes.length} docs (${countTotal} so far) for slice ${sliceId}, ${failures.length} failed, in ${bulkEnd - bulkStart}ms`,
      );

      if (failures.length > 0) {
        this.logger.error(
          `Got ${failures.length} failures writing to Elasticsearch`,
        );
        failures.slice(0, 3).forEach((failure, index) => {
          this.logger.error(`Error ${index + 1}:`, JSON.stringify(failure.error, null, 2));
        });
      }

      countSuccess += successes.length;
      countFailed += failures.length;
      countTotal += docs.length;
    }

    const endTime = Date.now();

    return {
      successful: countSuccess,
      failed: countFailed,
      total: countSuccess + countFailed,
      elapsedTimeMs: endTime - startTime,
    };
  }
}