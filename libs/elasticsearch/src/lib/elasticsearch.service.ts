import { Client, estypes} from '@elastic/elasticsearch';
import { Injectable } from '@nestjs/common';
import { ConfigService } from 'libs/config';

@Injectable()
export class ElasticsearchService {
  private readonly client: Client;

  constructor(
    private readonly config: ConfigService
  ){
    this.client = new Client({
      node: this.config.elasticsearchNode,
      auth: {
        username: this.config.elasticsearchUsername,
        password: this.config.elasticsearchPassword,
      },

      tls: {
        // TODO: Configure the Elasticsearch CA certificate.
        // Intended only for local development.
        rejectUnauthorized: false,
      },
    });
  }

  async health() {
    return this.client.cluster.health();
  }

  async search(request: estypes.SearchRequest) {
    return this.client.search(request);
  }
}
