import { Injectable } from '@nestjs/common';
import { Alias, ElasticsearchService } from 'libs/elastic';
import { JobPosting } from './types/job-posting.type';

@Injectable()
export class JobsSearchService {
  private readonly indexName = Alias.jobPostings;

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async searchByText(query: string) {
    const response = await this.elasticsearchService.search({
      index: this.indexName,
      size: 10,
      query: {
        multi_match: {
          query: query,
          fields: [
            'job_title^3',
            'search_position^2',
            'company',
            'job_location',
          ],
        },
      },
    });

    return response.hits.hits.map((hit) => ({
      id: hit._id,
      score: hit._score,
      job: hit._source as JobPosting,
    }));
  }
}
