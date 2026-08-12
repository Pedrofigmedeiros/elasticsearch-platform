import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { JobsSearchHttpModule } from './app/jobs-search/jobs-search.module';
import { ConfigService } from 'libs/config';
import { join } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    JobsSearchHttpModule,
  );
  const config = app.get(ConfigService);

  app.useStaticAssets(join(process.cwd(), 'apps/api/public'));

  await app.listen(config.apiPort);
}
void bootstrap();
