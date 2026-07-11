import { Global, Module } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { ConfigModule } from 'libs/config';


@Global()
@Module({
  imports: [ConfigModule],
  providers: [ElasticsearchService],
  exports: [ElasticsearchService],
})
export class ElasticsearchModule {}
