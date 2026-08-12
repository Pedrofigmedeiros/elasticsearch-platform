import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { Reader, Row } from "./reader";

let reader: Reader;
let csvPath: string;

beforeEach(() => {
  reader = new Reader();
  csvPath = join(__dirname, "test-data.csv");
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

const readRows = async (result: AsyncGenerator<Row>) => {
  const rows: Row[] = [];
  for await (const row of result) {
    rows.push(row);
  }
  return rows;
};

test("multiple rows", async () => {
  writeCsv(
    `job_link,last_processed_time,first_seen,got_summary,got_ner,is_being_worked,job_title,company,job_location,search_city,search_country,search_position,job_level,job_type
https://example.com/1,2024-01-19 13:15:10+00,2024-01-18 10:00:00+00,t,f,f,Software Engineer,Tech Corp,San Francisco,SF,USA,Engineer,Senior,Full-time
https://example.com/2,2024-01-20 14:20:30+00,2024-01-19 11:00:00+00,f,t,t,Data Scientist,Data Inc,New York,NY,USA,Scientist,Mid,Part-time`,
  );

  expect(await readRows(reader.read(csvPath))).toMatchObject([
    { job_link: "https://example.com/1", job_title: "Software Engineer" },
    { job_link: "https://example.com/2", job_title: "Data Scientist" },
  ]);
});

test("empty lines", async () => {
  writeCsv(
    `job_link,last_processed_time,first_seen,got_summary,got_ner,is_being_worked,job_title,company,job_location,search_city,search_country,search_position,job_level,job_type
https://example.com/1,2024-01-19 13:15:10+00,2024-01-18 10:00:00+00,t,f,f,Software Engineer,Tech Corp,San Francisco,SF,USA,Engineer,Senior,Full-time

https://example.com/2,2024-01-20 14:20:30+00,2024-01-19 11:00:00+00,f,t,t,Data Scientist,Data Inc,New York,NY,USA,Scientist,Mid,Part-time`,
  );

  expect(await readRows(reader.read(csvPath))).toHaveLength(2);
});

test("trim", async () => {
  writeCsv(
    `job_link,last_processed_time,first_seen,got_summary,got_ner,is_being_worked,job_title,company,job_location,search_city,search_country,search_position,job_level,job_type
https://example.com/1,  2024-01-19 13:15:10+00  ,2024-01-18 10:00:00+00,t,f,f,  Software Engineer  ,Tech Corp,San Francisco,SF,USA,Engineer,Senior,Full-time`,
  );

  const rows = await readRows(reader.read(csvPath));

  expect(rows[0].job_title).toBe("Software Engineer");
});

test("no rows", async () => {
  writeCsv(
    `job_link,last_processed_time,first_seen,got_summary,got_ner,is_being_worked,job_title,company,job_location,search_city,search_country,search_position,job_level,job_type`,
  );

  expect(await readRows(reader.read(csvPath))).toEqual([]);
});
