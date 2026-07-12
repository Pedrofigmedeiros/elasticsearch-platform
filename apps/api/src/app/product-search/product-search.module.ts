import { Module } from '@nestjs/common';
import { ProductSearchConroller } from './product-search.controller';
import { ProductSearchModule as ProductSearchLibraryModule } from 'libs/product-search';

@Module({
  imports: [ProductSearchLibraryModule],
  controllers: [ProductSearchConroller],
})
export class ProductSearchHttpModule {}
