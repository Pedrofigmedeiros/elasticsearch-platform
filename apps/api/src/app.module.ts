import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from 'libs/config';
import { ElasticsearchModule } from 'libs/elasticsearch';

@Module({
  imports: [ConfigModule, ElasticsearchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
