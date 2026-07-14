import { Module } from '@nestjs/common';
import { ProductSearchHttpModule } from './jobs-search/jobs-search.module';

@Module({
  imports: [ProductSearchHttpModule],
})
export class AppModule {}
