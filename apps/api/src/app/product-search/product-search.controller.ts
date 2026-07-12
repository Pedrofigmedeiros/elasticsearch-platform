import { Controller, Get, Query } from '@nestjs/common';
import { ProductSearchService } from 'libs/product-search';
import { ElasticsearchService } from 'libs/elasticsearch';

@Controller('products')
export class ProductSearchConroller {
  constructor(
    private readonly productSearchService: ProductSearchService,
  ) {}

  @Get('search')
  search(@Query('q') query: string) {
    return this.productSearchService.searchByText(query);
  }
}
