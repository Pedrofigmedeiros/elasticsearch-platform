import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createIndex } from './indices/create-index';
import { Alias } from 'libs/elastic';
import { Logger } from '@nestjs/common';
import {inspect} from "node:util";

const logger = new Logger('IndicesCreate');

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const alias = Alias.jobs;
  const indexName = await createIndex(app, alias);

  if (indexName) {
    logger.log(`Created alias '${alias}' on index '${indexName}'`);
  } else {
    logger.log(`Alias '${alias}' already exists`);
  }
}

main().catch((e: unknown) => {
  // eslint-disable-next-line no-console
  console.log(inspect(e, false, null));
  process.exit(1);
});