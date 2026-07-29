import { Module } from '@nestjs/common';
import { ConfigModule } from 'libs/config';
import { ElasticsearchModule } from 'libs/elasticsearch';

@Module({
  imports: [ConfigModule, ElasticsearchModule],
})
export class AppModule {}