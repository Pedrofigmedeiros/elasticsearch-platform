import { Alias } from 'libs/elastic';

import { Processor } from './processor';
import { Runner } from './runner';

let processor: Processor;
let runner: Runner;

beforeEach(() => {
  processor = { process: jest.fn() } as unknown as Processor;
  runner = new Runner(processor);
});

test("delegates to processor with the alias as indexName", async () => {
  (processor.process as jest.Mock).mockResolvedValue({
    successful: 5,
    failed: 0,
    total: 5,
    elapsedTimeMs: 100,
  });

  const stats = await runner.run({
    csvPath: '/tmp/jobs.csv',
    alias: Alias.jobPostings,
  });

  expect(processor.process).toHaveBeenCalledWith({
    csvPath: '/tmp/jobs.csv',
    indexName: Alias.jobPostings,
    bulkSize: undefined,
  });
  expect(stats).toMatchObject({ successful: 5, failed: 0, total: 5 });
});

test("passes bulkSize through", async () => {
  (processor.process as jest.Mock).mockResolvedValue({
    successful: 1,
    failed: 0,
    total: 1,
    elapsedTimeMs: 10,
  });

  await runner.run({
    csvPath: '/tmp/jobs.csv',
    alias: Alias.jobPostings,
    bulkSize: 500,
  });

  expect(processor.process).toHaveBeenCalledWith({
    csvPath: '/tmp/jobs.csv',
    indexName: Alias.jobPostings,
    bulkSize: 500,
  });
});

test("throws for an unknown alias without calling the processor", async () => {
  await expect(
    runner.run({ csvPath: '/tmp/jobs.csv', alias: 'unknown' as Alias }),
  ).rejects.toThrow(/Unknown alias/);

  expect(processor.process).not.toHaveBeenCalled();
});
