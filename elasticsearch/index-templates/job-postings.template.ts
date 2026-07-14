import { jobPostingsMapping } from '../mappings/job-postings.mapping';

export const buildJobPostingsTemplate = () => ({
  index_patterns: ['job_postings*'],
  composed_of: ['shards'],
  template: {
    mappings: jobPostingsMapping(),
  },
});
