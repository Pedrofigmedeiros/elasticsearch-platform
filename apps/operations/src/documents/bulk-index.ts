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

  const normalizeDates = (doc: Record<string, unknown>) => {
    const normalized = {...doc };

    const dateFields = ['last_processed_time', 'first_seen', '@timestamp'];

    dateFields.forEach(field => {
      if (normalized[field] && typeof normalized[field] === 'string') {
        const value = normalized[field] as string;

        normalized[field] = value
          .replace(' ', 'T')           // space → T
          .replace('+00', 'Z')         // +00 → Z
          .replace(/\.\d{6}/, '');      // remove extra microseconds
      }
    });

    return normalized;
  };

  const operations = documents.flatMap((doc) => [
    { index: { _index: alias, _id: doc[idField] as string } },
    normalizeDates(doc),
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
