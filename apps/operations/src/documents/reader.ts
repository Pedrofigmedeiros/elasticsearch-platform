import { createReadStream } from 'node:fs';
import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse';


export type Row = {
  job_link: string;
  last_processed_time: string;
  first_seen: string;
  got_summary: string;
  got_ner: string;
  is_being_worked: string;
  job_title: string;
  company: string;
  job_location: string;
  search_city: string;
  search_country: string;
  search_position: string;
  job_level: string;
  job_type: string;
};

@Injectable()
export class Reader {
  private readonly logger = new Logger(Reader.name);

  constructor() {}

  async *read(csvPath: string): AsyncGenerator<Row> {
    this.logger.log(`Starting to read CSV: ${csvPath}`);

    const parser = createReadStream(csvPath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }),
    );

    let count = 0;

    for await (const row of parser) {
      count++;
      yield row as Row;
    }

    this.logger.log(`Finished reading CSV: ${count} rows`);
  }
}
