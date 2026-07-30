import { INestApplicationContext, Logger } from '@nestjs/common';
import { ElasticsearchService, aliases, Alias } from 'libs/elastic';

const logger = new Logger('CreateIndex');

export async function createIndex(
  app: INestApplicationContext,
  alias: Alias,
): Promise<string | null> {

  const elasticsearchService = app.get(ElasticsearchService);
  const client = elasticsearchService.getClient();

  const definition = aliases[alias];
  if (!definition) {
    throw new Error(`Index '${alias}' not found in registry`);
  }

  const indexName = `${alias}-v1`;

  const indicesWithAlias = await client.cat.aliases({
    name: alias,
    format: "json",
  });
  if (indicesWithAlias.length > 0) {
    return null;
  }

  const indexMapping = definition.build();

  await client.indices.create({
    index: indexName,
    ...indexMapping,
  });

  await client.indices.putAlias({
    index: indexName,
    name: alias,
  });

  return indexName;
}