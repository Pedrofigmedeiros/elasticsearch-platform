import { IndexMapping } from './types';

export const buildJobsPostingsIndex = (): IndexMapping => {
  return {
    settings: {
      index: {
        number_of_shards: 1,
        number_of_replicas: 0,
        refresh_interval: "30s",
      },
    },
    mappings: {
      dynamic: "false",
      properties: {
        '@timestamp': {
          type: 'date',
        },
        first_seen: {
          type: 'date',
        },
        last_processed_time: {
          type: 'date',
        },
        job_title: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
            },
          },
        },
        company: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
            },
          },
        },
        search_position: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
            },
          },
        },
        job_location: {
          type: 'text',
          fields: {
            keyword: {
              type: 'keyword',
            },
          },
        },
        job_level: {
          type: 'keyword',
        },
        job_type: {
          type: 'keyword',
        },
        search_city: {
          type: 'keyword',
        },
        search_country: {
          type: 'keyword',
        },
        job_link: {
          type: 'keyword',
        },
        got_ner: {
          type: 'boolean',
        },
        got_summary: {
          type: 'boolean',
        },
        is_being_worked: {
          type: 'boolean',
        },
      },
    }
  };
};
