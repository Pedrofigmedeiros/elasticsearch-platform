import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createIndex } from './indices/create-index';
import { Alias, ElasticsearchService } from 'libs/elastic';
import { Logger } from '@nestjs/common';
import { inspect } from "node:util";

const logger = new Logger('IndicesCreate');

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const esService = app.get(ElasticsearchService);
  const client = esService.getClient();

  const alias = Alias.jobPostings;
  const indexName = await createIndex(client, alias);

  if (indexName) {
    logger.log(`Created alias '${alias}' on index '${indexName}'`);
  } else {
    logger.log(`Alias '${alias}' already exists`);
  }

  await app.close();
}

main().catch((e: unknown) => {
  // eslint-disable-next-line no-console
  console.log(inspect(e, false, null));
  process.exit(1);
});
