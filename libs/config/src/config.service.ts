import { Injectable } from '@nestjs/common';
import env from 'env-var';

@Injectable()
export class ConfigService {
  get elasticUrl(): string {
    return env
      .get('ELASTICSEARCH_NODE')
      .required()
      .asString();
  }

  get apiPort(): number {
    return env
      .get('API_PORT')
      .default('8080')
      .asPortNumber();
  }
}
