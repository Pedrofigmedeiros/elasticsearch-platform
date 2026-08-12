import { Injectable, Logger } from '@nestjs/common';
import { Alias, aliases } from 'libs/elastic';

import { Processor } from './processor';
import { WriteStats } from './writer';

@Injectable()
export class Runner {
  private readonly logger = new Logger(Runner.name);

  constructor(private readonly processor: Processor) {}

  async run({
    csvPath,
    alias,
    bulkSize,
  }: {
    csvPath: string;
    alias: Alias;
    bulkSize?: number;
  }): Promise<WriteStats> {
    if (!aliases[alias]) {
      throw new Error(`Unknown alias '${alias}'`);
    }

    this.logger.log(`Starting bulk run: ${csvPath} → ${alias}`);
    const startTime = Date.now();

    const stats = await this.processor.process({
      csvPath,
      indexName: alias,
      bulkSize,
    });

    const elapsedTimeMs = Date.now() - startTime;
    this.logger.log(
      `Bulk run finished in ${elapsedTimeMs}ms: ${stats.successful} successful, ${stats.failed} failed, ${stats.total} total`,
    );

    return stats;
  }
}
