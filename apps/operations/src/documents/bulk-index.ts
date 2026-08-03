import { ElasticsearchService, Alias } from 'libs/elastic';
import { INestApplicationContext, Logger } from '@nestjs/common';

export async function bulkIndex(
  app: INestApplicationContext,
  alias: Alias,
  documents: Record<string, unknown>[],
  idField: string = 'job_link',
): Promise<{ indexed: number; errors: number }> {

  const elasticsearchService = app.get(ElasticsearchService);
  const client = elasticsearchService.getClient();

  if (documents.length === 0) {
    return { indexed: 0, errors: 0 };
  }

  const operations = documents.flatMap((doc) => [
    { index: { _index: alias, _id: doc[idField] as string } },
    doc,
  ]);

  const response = await client.bulk({
    operations,
    refresh: false,
  });

  const errors = response.items.filter((item) => item.index?.error).length;

  return {
    indexed: documents.length - errors,
    errors,
  };
}
