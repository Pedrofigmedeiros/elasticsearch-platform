import { inspect } from 'node:util';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Alias } from 'libs/elastic';

import { AppModule } from './app.module';
import { Runner } from './documents/runner';

const logger = new Logger('DocumentsBulk');

async function main() {
  const csvPath = process.argv[2];
  const alias = (process.argv[3] as Alias) ?? Alias.jobPostings;

  if (!csvPath) {
    logger.error('Usage: npm run op:documents:bulk -- <path-to-csv> [alias]');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const runner = app.get(Runner);

  await runner.run({ csvPath, alias });

  await app.close();
}

main().catch((e: unknown) => {
  // eslint-disable-next-line no-console
  console.log(inspect(e, false, null));
  process.exit(1);
});
