import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ElasticsearchService } from 'libs/elasticsearch';

@Controller()
export class AppController {
  constructor(
    private readonly elasticsearchService: ElasticsearchService
  ) {}

  @Get('health/elasticsearch')
  elasticsearchHealth() {
    return this.elasticsearchService.health();
  }
}
