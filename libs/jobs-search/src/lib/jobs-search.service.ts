import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from 'libs/elasticsearch';
import { JobPosting } from './types/product.type';

@Injectable()
export class ProductSearchService {
  private readonly indexName = 'job_postings';

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
      Product: hit._source as JobPosting,
    }));
  }
}
