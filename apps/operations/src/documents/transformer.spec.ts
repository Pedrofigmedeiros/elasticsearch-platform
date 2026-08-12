import { Transformer } from './transformer';

let transformer: Transformer;

beforeEach(() => {
  transformer = new Transformer();
});

test("dates", async () => {
  const result = await transformer.transform({
    job_link: "https://example.com/job/123",
    last_processed_time: "2024-01-19 13:15:10.497029+00",
    first_seen: "2024-01-18 10:00:00.000000+00",
    got_summary: "t",
    got_ner: "f",
    is_being_worked: "f",
  });

  expect(result).toMatchObject({
    last_processed_time: "2024-01-19T13:15:10Z",
    first_seen: "2024-01-18T10:00:00Z",
  });
});

test("dates without microseconds", async () => {
  const result = await transformer.transform({
    job_link: "https://example.com/job/123",
    last_processed_time: "2024-01-19 13:15:10+00",
    first_seen: "2024-01-18 10:00:00+00",
  });

  expect(result).toMatchObject({
    last_processed_time: "2024-01-19T13:15:10Z",
    first_seen: "2024-01-18T10:00:00Z",
  });
});

test("dates with variable-length fractional seconds", async () => {
  const result = await transformer.transform({
    job_link: "https://example.com/job/123",
    last_processed_time: "2024-01-21 07:12:29.00256+00", // 5 digits, as seen in real data
    first_seen: "2024-01-15", // date-only, no time/fraction at all
  });

  expect(result).toMatchObject({
    last_processed_time: "2024-01-21T07:12:29Z",
    first_seen: "2024-01-15",
  });
});

test("booleans true", async () => {
  const result = await transformer.transform({
    job_link: "https://example.com/job/123",
    got_summary: "t",
    got_ner: "t",
    is_being_worked: "t",
  });

  expect(result).toMatchObject({
    got_summary: true,
    got_ner: true,
    is_being_worked: true,
  });
});

test("booleans false", async () => {
  const result = await transformer.transform({
    job_link: "https://example.com/job/123",
    got_summary: "f",
    got_ner: "f",
    is_being_worked: "f",
  });

  expect(result).toMatchObject({
    got_summary: false,
    got_ner: false,
    is_being_worked: false,
  });
});

test("all data", async () => {
  const raw = {
    job_link: "https://example.com/job/123",
    last_processed_time: "2024-01-19 13:15:10.497029+00",
    first_seen: "2024-01-18 10:00:00.000000+00",
    got_summary: "t",
    got_ner: "f",
    is_being_worked: "t",
    job_title: "Software Engineer",
    company: "Tech Corp",
    job_location: "San Francisco",
    search_city: "SF",
    search_country: "USA",
    search_position: "Engineer",
    job_level: "Senior",
    job_type: "Full-time",
  };

  const result = await transformer.transform(raw);

  expect(result).toEqual({
    job_link: "https://example.com/job/123",
    last_processed_time: "2024-01-19T13:15:10Z",
    first_seen: "2024-01-18T10:00:00Z",
    got_summary: true,
    got_ner: false,
    is_being_worked: true,
    job_title: "Software Engineer",
    company: "Tech Corp",
    job_location: "San Francisco",
    search_city: "SF",
    search_country: "USA",
    search_position: "Engineer",
    job_level: "Senior",
    job_type: "Full-time",
  });
});
