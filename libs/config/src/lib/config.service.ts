import { Injectable } from '@nestjs/common';
import env from 'env-var';

@Injectable()
export class ConfigService {
  get elasticsearchNode(): string {
    return env
      .get('ELASTICSEARCH_NODE')
      .required()
      .asString();
  }

  get elasticsearchUsername(): string {
    return env
      .get('ELASTICSEARCH_USERNAME')
      .required()
      .asString();
  }

  get elasticsearchPassword(): string {
    return env
      .get('ELASTICSEARCH_PASSWORD')
      .required()
      .asString();
  }

  get apiPort(): number {
    return env
      .get('API_PORT')
      .default('3000')
      .asPortNumber();
  }
}
