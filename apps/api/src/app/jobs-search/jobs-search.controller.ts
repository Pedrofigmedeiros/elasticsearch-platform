import { Controller, Get, Query } from '@nestjs/common';
import { JobsSearchService } from 'libs/jobs-search/src';

@Controller('jobs')
export class JobsSearchController {
  constructor(
    private readonly jobsSearchService: JobsSearchService,
  ) {}

  @Get('search')
  search(@Query('q') query: string) {
    return this.jobsSearchService.searchByText(query);
  }
}
