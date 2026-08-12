import { Module } from '@nestjs/common';
import { ConfigModule } from 'libs/config';
import { ElasticsearchModule } from 'libs/elastic';

import { DocumentsModule } from './documents.module';

@Module({
  imports: [ConfigModule, ElasticsearchModule, DocumentsModule],
})
export class AppModule {}
