import { Module } from '@nestjs/common';
import { ProductSearchHttpModule } from './product-search/product-search.module';

@Module({
  imports: [ProductSearchHttpModule],
})
export class AppModule {}
