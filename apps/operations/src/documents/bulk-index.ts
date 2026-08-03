import { Client } from '@elastic/elasticsearch';
import { Alias } from 'libs/elastic';

export async function bulkIndex(
  client: Client,
  alias: Alias,
  documents: Record<string, unknown>[],
  idField: string = 'job_link',
): Promise<{ indexed: number; errors: number }> {
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
