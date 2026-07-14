import { Module } from '@nestjs/common';
import { ProductSearchService } from './jobs-search.service';
import { ElasticsearchModule } from 'libs/elasticsearch';


@Module({
  imports: [ElasticsearchModule],
  providers: [ProductSearchService],
  exports: [ProductSearchService],
})
export class ProductSearchModule {}
