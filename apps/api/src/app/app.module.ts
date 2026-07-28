import { Module } from '@nestjs/common';
import { JobsSearchHttpModule } from './jobs-search/jobs-search.module';

@Module({
  imports: [JobsSearchHttpModule],
})
export class AppModule {}
