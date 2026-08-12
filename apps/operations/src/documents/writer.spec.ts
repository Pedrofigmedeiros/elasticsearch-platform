import { Client } from "@elastic/elasticsearch";
import { Writer, Document } from "./writer";

let elastic: jest.Mocked<Client>;
let writer: Writer;

beforeEach(() => {
  elastic = { bulk: jest.fn() } as unknown as jest.Mocked<Client>;
  writer = new Writer(elastic);
});

const makeDocs = (count: number): Document[] =>
  Array.from({ length: count }, (_, i) => ({
    job_link: `https://example.com/job/${i}`,
    last_processed_time: "2024-01-19T13:15:10Z",
    first_seen: "2024-01-18T10:00:00Z",
    got_summary: true,
    got_ner: false,
    is_being_worked: false,
    job_title: `Job ${i}`,
    company: `Company ${i}`,
    job_location: "Location",
    search_city: "City",
    search_country: "Country",
    search_position: "Position",
    job_level: "Level",
    job_type: "Type",
  }));

async function* toIterator<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item;
  }
}

test("successful write", async () => {
  const docs = makeDocs(5);
  elastic.bulk.mockResolvedValue({
    items: docs.map(() => ({ index: { status: 200, _id: "test-id" } })),
  } as any);

  const stats = await writer.write("test-index", toIterator(docs), {
    bulkSize: 10,
  });

  expect(stats).toMatchObject({ successful: 5, failed: 0, total: 5 });
  expect(elastic.bulk).toHaveBeenCalledTimes(1);
});

test("bulkSize splits into multiple batches", async () => {
  const docs = makeDocs(25);
  elastic.bulk.mockImplementation((params: any) => {
    const count = params.operations.length / 2;
    return Promise.resolve({
      items: Array(count).fill({ index: { status: 200, _id: "test-id" } }),
    } as any);
  });

  const stats = await writer.write("test-index", toIterator(docs), {
    bulkSize: 10,
  });

  expect(stats).toMatchObject({ successful: 25, failed: 0 });
  expect(elastic.bulk).toHaveBeenCalledTimes(3); // 10 + 10 + 5
});

test("default bulkSize", async () => {
  const docs = makeDocs(5);
  elastic.bulk.mockResolvedValue({
    items: docs.map(() => ({ index: { status: 200, _id: "test-id" } })),
  } as any);

  await writer.write("test-index", toIterator(docs));

  const operations = elastic.bulk.mock.calls[0][0].operations as unknown[];
  expect(operations).toHaveLength(10); // 5 docs = 10 bulk items (index + doc)
});

test("failures", async () => {
  const docs = makeDocs(5);
  elastic.bulk.mockResolvedValue({
    items: [
      { index: { status: 200, _id: "id1" } },
      { index: { status: 200, _id: "id2" } },
      { index: { status: 500, error: { reason: "Internal error" } } },
      { index: { status: 200, _id: "id4" } },
      { index: { status: 400, error: { reason: "Bad request" } } },
    ],
  } as any);

  const stats = await writer.write("test-index", toIterator(docs), {
    bulkSize: 10,
  });

  expect(stats).toMatchObject({ successful: 3, failed: 2, total: 5 });
});

test("404 counts as success", async () => {
  const docs = makeDocs(3);
  elastic.bulk.mockResolvedValue({
    items: [
      { index: { status: 200, _id: "id1" } },
      { index: { status: 404, error: { reason: "Not found" } } },
      { index: { status: 200, _id: "id3" } },
    ],
  } as any);

  const stats = await writer.write("test-index", toIterator(docs), {
    bulkSize: 10,
  });

  expect(stats).toMatchObject({ successful: 3, failed: 0 });
});

test("uses job_link as _id", async () => {
  const docs = makeDocs(2);
  elastic.bulk.mockResolvedValue({
    items: docs.map(() => ({ index: { status: 200, _id: "test-id" } })),
  } as any);

  await writer.write("test-index", toIterator(docs), { bulkSize: 10 });

  const operations = elastic.bulk.mock.calls[0][0].operations as any[];
  expect(operations[0]).toMatchObject({
    index: { _index: "test-index", _id: "https://example.com/job/0" },
  });
  expect(operations[2]).toMatchObject({
    index: { _index: "test-index", _id: "https://example.com/job/1" },
  });
});

test("retry and timeout options", async () => {
  const docs = makeDocs(1);
  elastic.bulk.mockResolvedValue({
    items: [{ index: { status: 200, _id: "id1" } }],
  } as any);

  await writer.write("test-index", toIterator(docs), { bulkSize: 10 });

  expect(elastic.bulk).toHaveBeenCalledWith(expect.any(Object), {
    maxRetries: 3,
    retryOnTimeout: true,
    requestTimeout: 30_000,
  });
});
