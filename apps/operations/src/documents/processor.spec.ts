import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@elastic/elasticsearch";
import { Processor } from "./processor";
import { Reader } from "./reader";
import { Transformer } from "./transformer";
import { Writer } from "./writer";

let elastic: jest.Mocked<Client>;
let reader: Reader;
let transformer: Transformer;
let writer: Writer;
let processor: Processor;
let csvPath: string;

beforeEach(() => {
  elastic = { bulk: jest.fn() } as unknown as jest.Mocked<Client>;
  reader = new Reader();
  transformer = new Transformer();
  writer = new Writer(elastic);
  processor = new Processor(reader, transformer, writer);
  csvPath = join(__dirname, "test-processor.csv");
});

afterEach(() => {
  try {
    unlinkSync(csvPath);
  } catch (error) {
    // ignore if file does not exist
  }
});

const writeCsv = (content: string): void => {
  writeFileSync(csvPath, content);
};

test("reads, transforms and writes", async () => {
  writeCsv(
    `job_link,last_processed_time,first_seen,got_summary,got_ner,is_being_worked,job_title,company,job_location,search_city,search_country,search_position,job_level,job_type
https://example.com/1,2024-01-19 13:15:10.497029+00,2024-01-18 10:00:00+00,t,f,f,Software Engineer,Tech Corp,San Francisco,SF,USA,Engineer,Senior,Full-time
https://example.com/2,2024-01-20 14:20:30.123456+00,2024-01-19 11:00:00+00,f,t,t,Data Scientist,Data Inc,New York,NY,USA,Scientist,Mid,Part-time`,
  );

  elastic.bulk.mockResolvedValue({
    items: [
      { index: { status: 200, _id: "id1" } },
      { index: { status: 200, _id: "id2" } },
    ],
  } as any);

  const stats = await processor.process({
    csvPath,
    indexName: "jobs-test",
    bulkSize: 10,
  });

  expect(stats).toMatchObject({ successful: 2, failed: 0, total: 2 });
  expect(elastic.bulk).toHaveBeenCalledTimes(1);

  const operations = elastic.bulk.mock.calls[0][0].operations as any[];
  expect(operations[0]).toMatchObject({
    index: { _index: "jobs-test", _id: "https://example.com/1" },
  });
  expect(operations[1]).toMatchObject({
    last_processed_time: "2024-01-19T13:15:10Z",
    got_summary: true,
    got_ner: false,
    is_being_worked: false,
  });
  expect(operations[2]).toMatchObject({
    index: { _index: "jobs-test", _id: "https://example.com/2" },
  });
  expect(operations[3]).toMatchObject({
    last_processed_time: "2024-01-20T14:20:30Z",
    got_summary: false,
    got_ner: true,
    is_being_worked: true,
  });
});

test("multiple batches", async () => {
  const headers =
    "job_link,last_processed_time,first_seen,got_summary,got_ner,is_being_worked,job_title,company,job_location,search_city,search_country,search_position,job_level,job_type";
  const rows = Array.from(
    { length: 25 },
    (_, i) =>
      `https://example.com/${i},2024-01-19 13:15:10+00,2024-01-18 10:00:00+00,t,f,f,Job ${i},Company,Location,City,Country,Position,Level,Type`,
  );
  writeCsv([headers, ...rows].join("\n"));

  elastic.bulk.mockImplementation((params: any) => {
    const count = params.operations.length / 2;
    return Promise.resolve({
      items: Array(count).fill({ index: { status: 200, _id: "test-id" } }),
    } as any);
  });

  const stats = await processor.process({
    csvPath,
    indexName: "jobs-test",
    bulkSize: 10,
  });

  expect(stats).toMatchObject({ successful: 25, failed: 0 });
  expect(elastic.bulk).toHaveBeenCalledTimes(3); // 10 + 10 + 5
});

test("failures", async () => {
  writeCsv(
    `job_link,last_processed_time,first_seen,got_summary,got_ner,is_being_worked,job_title,company,job_location,search_city,search_country,search_position,job_level,job_type
https://example.com/1,2024-01-19 13:15:10+00,2024-01-18 10:00:00+00,t,f,f,Job 1,Company,Location,City,Country,Position,Level,Type
https://example.com/2,2024-01-19 13:15:10+00,2024-01-18 10:00:00+00,t,f,f,Job 2,Company,Location,City,Country,Position,Level,Type
https://example.com/3,2024-01-19 13:15:10+00,2024-01-18 10:00:00+00,t,f,f,Job 3,Company,Location,City,Country,Position,Level,Type`,
  );

  elastic.bulk.mockResolvedValue({
    items: [
      { index: { status: 200, _id: "id1" } },
      { index: { status: 500, error: { reason: "Internal error" } } },
      { index: { status: 200, _id: "id3" } },
    ],
  } as any);

  const stats = await processor.process({
    csvPath,
    indexName: "jobs-test",
    bulkSize: 10,
  });

  expect(stats).toMatchObject({ successful: 2, failed: 1, total: 3 });
});

test("missing csv file", async () => {
  await expect(
    processor.process({
      csvPath: "/path/que/nao/existe.csv",
      indexName: "jobs-test",
    }),
  ).rejects.toThrow(/ENOENT|no such file/);
});

test("empty csv", async () => {
  writeCsv(
    "job_link,last_processed_time,first_seen,got_summary,got_ner,is_being_worked,job_title,company,job_location,search_city,search_country,search_position,job_level,job_type",
  );

  const stats = await processor.process({
    csvPath,
    indexName: "jobs-test",
  });

  expect(stats).toMatchObject({ successful: 0, failed: 0, total: 0 });
  expect(elastic.bulk).not.toHaveBeenCalled();
});
