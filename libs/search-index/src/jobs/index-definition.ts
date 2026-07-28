import { jobPostingsMapping } from './mapping';
import { jobsSettings } from './settings';
import { jobsAliasConfig } from './alias.config';

export const jobsIndexDefinition = {
  ...jobsAliasConfig,
  mapping: jobPostingsMapping(),
  settings: jobsSettings,
};

export type JobsIndexDefinition = typeof jobsIndexDefinition;
