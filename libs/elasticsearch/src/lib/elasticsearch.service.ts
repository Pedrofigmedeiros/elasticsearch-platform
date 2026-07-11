import { Client } from '@elastic/elasticsearch';
import { Injectable } from '@nestjs/common';
import { ConfigService } from 'libs/config';

@Injectable()
export class ElasticsearchService {
  private readonly client: Client;

  constructor(private readonly config: ConfigService) {
    this.client = new Client({
      node: this.config.elasticsearchNode,
      auth: {
        username: this.config.elasticsearchUsername,
        password: this.config.elasticsearchPassword,
      },

      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async health() {
    return this.client.cluster.health();
  }
}
