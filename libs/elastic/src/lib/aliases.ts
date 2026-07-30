import { buildJobsIndex } from './build-jobs-index';
import { IndexDefinition, IndexMapping } from './types';

export enum Alias {
  jobs = 'jobs',
  // Futuro:
  // jobSummary = 'job_summary',
  // jobSkills = 'job_skills',
}

export const allAliases = Object.values(Alias);

export const aliases: Record<Alias, IndexDefinition> = {
  [Alias.jobs]: {
    alias: Alias.jobs,
    build: (): IndexMapping => buildJobsIndex(),
  },

  // Futuro com múltiplos índices:
  // [Alias.jobSummary]: {
  //   alias: Alias.jobSummary,
  //   build: (): IndexMapping => buildJobSummaryIndex(),
  // },
};

export const allIndexDefinitions = Object.values(aliases);