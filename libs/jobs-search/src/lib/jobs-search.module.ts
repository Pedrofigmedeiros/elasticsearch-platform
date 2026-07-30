import { Module } from '@nestjs/common';
import { JobsSearchService } from './jobs-search.service';
import { ElasticsearchModule } from 'libs/elastic';

@Module({
  imports: [ElasticsearchModule],
  providers: [JobsSearchService],
  exports: [JobsSearchService],
})
export class JobsSearchModule {}
