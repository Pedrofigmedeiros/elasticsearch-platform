import { Module } from '@nestjs/common';
import { JobsSearchController } from './jobs-search.controller';
import { JobsSearchModule as JobsSearchLibraryModule } from 'libs/jobs-search/src';

@Module({
  imports: [JobsSearchLibraryModule],
  controllers: [JobsSearchController],
})
export class JobsSearchHttpModule {}
