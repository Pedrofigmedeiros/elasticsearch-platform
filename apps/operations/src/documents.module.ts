import { Client } from '@elastic/elasticsearch';
import { Module } from '@nestjs/common';
import { ElasticsearchModule, ElasticsearchService } from 'libs/elastic';

import { Processor } from './documents/processor';
import { Reader } from './documents/reader';
import { Runner } from './documents/runner';
import { Transformer } from './documents/transformer';
import { Writer } from './documents/writer';

@Module({
  imports: [ElasticsearchModule],
  providers: [
    Reader,
    Transformer,
    {
      provide: Client,
      useFactory: (esService: ElasticsearchService) => esService.getClient(),
      inject: [ElasticsearchService],
    },
    Writer,
    Processor,
    Runner,
  ],
  exports: [Runner],
})
export class DocumentsModule {}
