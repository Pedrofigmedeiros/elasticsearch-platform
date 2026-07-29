import { INestApplicationContext, Logger } from '@nestjs/common';
import { ElasticsearchService } from 'libs/elasticsearch';
import { indexRegistry } from './registry';

const logger = new Logger('CreateIndex');

export async function createIndex(
  app: INestApplicationContext,
  alias: string,
): Promise<string | null> {

  const elasticsearchService = app.get(ElasticsearchService);
  const client = elasticsearchService.getClient();

  const definition = indexRegistry[alias];
  if (!definition) {
    throw new Error(`Index '${alias}' not found in registry`);
  }

  const indexName = `${alias}-v1`;

  const indicesWithAlias = await client.cat.aliases({
    name: alias,
    format: "json",
  });
  if (indicesWithAlias.length > 0) {
    return;
  }

  await client.indices.create({
    index: indexName,
    mappings: definition.mapping.mappings,
    settings: definition.settings,
  });

  await client.indices.putAlias({
    index: indexName,
    name: alias,
  });

  return indexName;
}