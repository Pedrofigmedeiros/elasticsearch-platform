import { Controller, Get } from '@nestjs/common';
import { ProductSearchService } from 'libs/product-search';
import { ElasticsearchService } from 'libs/elasticsearch';

@Controller()
export class ProductSearchConroller {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly productSearchService: ProductSearchService,
  ) {}

  @Get()
  findAll() {
    return this.productSearchService.findAll();
  }
}
