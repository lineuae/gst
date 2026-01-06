import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import sharp from 'sharp';

class CreateProductDto {
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
}

class UpdateProductDto {
  name?: string;
  price?: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(UserRole.Manager)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles(UserRole.Manager)
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Seules les images sont autorisées'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu');
    }
    // Compression automatique avec sharp : redimensionner à max 1200px, qualité ~80%
    const maxDimension = 1200;
    const image = sharp(file.buffer).rotate(); // orientation automatique
    const metadata = await image.metadata();

    let pipeline = image;
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > maxDimension || metadata.height > maxDimension)
    ) {
      pipeline = pipeline.resize({
        width: maxDimension,
        height: maxDimension,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // On convertit en JPEG compressé pour un bon ratio poids/qualité
    const compressedBuffer = await pipeline.jpeg({ quality: 80 }).toBuffer();
    const base64 = compressedBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    return { imagePath: dataUrl };
  }

  @Roles(UserRole.Manager, UserRole.Admin, UserRole.Staff)
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Roles(UserRole.Manager, UserRole.Admin, UserRole.Staff)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Roles(UserRole.Manager)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles(UserRole.Manager)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
