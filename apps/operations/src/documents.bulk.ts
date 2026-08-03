import { createReadStream } from 'node:fs';
import { inspect } from 'node:util';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { parse } from 'csv-parse';
import { Alias} from 'libs/elastic';

import { AppModule } from './app.module';
import { bulkIndex } from './documents/bulk-index';

const logger = new Logger('DocumentsBulk');

const BATCH_SIZE = 1000;

async function main() {
  const csvPath = process.argv[2];
  const alias = (process.argv[3] as Alias) ?? Alias.jobs;

  if (!csvPath) {
    logger.error('Usage: npm run op:documents:bulk -- <path-to-csv> [alias]');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);

  let batch: Record<string, unknown>[] = [];
  let totalIndexed = 0;
  let totalErrors = 0;
  let totalRead = 0;

  const parser = createReadStream(csvPath).pipe(
    parse({ columns: true, skip_empty_lines: true, trim: true }),
  );

  logger.log(`Starting bulk indexing from '${csvPath}' into alias '${alias}'`);

  for await (const row of parser) {
    batch.push(row);
    totalRead += 1;

    if (batch.length >= BATCH_SIZE) {
      const { indexed, errors } = await bulkIndex(app, alias, batch);
      totalIndexed += indexed;
      totalErrors += errors;
      logger.log(
        `Progress: ${totalRead} read | ${totalIndexed} indexed | ${totalErrors} errors`,
      );
      batch = [];
    }
  }

  // Processa o último batch (pode ter menos que BATCH_SIZE)
  if (batch.length > 0) {
    const { indexed, errors } = await bulkIndex(app, alias, batch);
    totalIndexed += indexed;
    totalErrors += errors;
  }

  logger.log(
    `Done. Total read: ${totalRead} | Indexed: ${totalIndexed} | Errors: ${totalErrors}`,
  );

  await app.close();
}

main().catch((e: unknown) => {
  // eslint-disable-next-line no-console
  console.log(inspect(e, false, null));
  process.exit(1);
});
