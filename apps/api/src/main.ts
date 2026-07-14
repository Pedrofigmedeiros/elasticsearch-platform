import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ProductSearchHttpModule } from './app/jobs-search/jobs-search.module';
import { ConfigService } from 'libs/config';

async function bootstrap() {
  const app = await NestFactory.create(ProductSearchHttpModule);
  const config = app.get(ConfigService);
  await app.listen(config.apiPort);
}
void bootstrap();
