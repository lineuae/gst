import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { RolesGuard } from '../auth/roles.guard';
import { Product, ProductSchema } from './schemas/product.schema';
import {
  ProductCategory,
  ProductCategorySchema,
} from './schemas/product-category.schema';
import { ProductCategoriesService } from './product-categories.service';
import { ProductCategoriesController } from './product-categories.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductCategory.name, schema: ProductCategorySchema },
    ]),
  ],
  providers: [ProductsService, ProductCategoriesService, RolesGuard],
  controllers: [ProductsController, ProductCategoriesController],
  exports: [ProductsService, ProductCategoriesService],
})
export class ProductsModule {}
