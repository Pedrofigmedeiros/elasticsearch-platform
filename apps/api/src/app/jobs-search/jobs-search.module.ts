import { Module } from '@nestjs/common';
import { ProductSearchConroller } from './jobs-search.controller';
import { ProductSearchModule as ProductSearchLibraryModule } from 'libs/jobs-search/src';

@Module({
  imports: [ProductSearchLibraryModule],
  controllers: [ProductSearchConroller],
})
export class ProductSearchHttpModule {}
