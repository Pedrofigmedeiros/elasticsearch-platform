import { buildJobsPostingsIndex as buildJobPostingsIndex } from './build-jobs-index';
import { IndexDefinition, IndexMapping } from './types';

export enum Alias {
  jobPostings = 'job_postings',
  // Futuro:
  // jobSummary = 'job_summary',
  // jobSkills = 'job_skills',
}

export const allAliases = Object.values(Alias);

export const aliases: Record<Alias, IndexDefinition> = {
  [Alias.jobPostings]: {
    alias: Alias.jobPostings,
    build: (): IndexMapping => buildJobPostingsIndex(),
  },

  // Futuro com múltiplos índices:
  // [Alias.jobSummary]: {
  //   alias: Alias.jobSummary,
  //   build: (): IndexMapping => buildJobSummaryIndex(),
  // },
};

export const allIndexDefinitions = Object.values(aliases);
