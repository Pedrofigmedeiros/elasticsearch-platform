import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from 'libs/elasticsearch';
import { Product } from './types/product.types';

@Injectable()
export class ProductSearchService {
  private readonly indexName = 'ol_br_fashion_offers_v1';

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
  ) {}

  async findAll() {
    const response = await this.elasticsearchService.search({
      index: this.indexName,
      size: 10,
      query: {
        match_all: {},
      },
    });

    return response.hits.hits.map((hit) => ({
      id: hit._id,
      score: hit._score,
      Product: hit._source as Product,
    }));
  }
}
