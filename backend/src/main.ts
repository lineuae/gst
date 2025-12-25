import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsDir =
    process.env.UPLOADS_DIR && process.env.UPLOADS_DIR.trim().length > 0
      ? process.env.UPLOADS_DIR
      : join(__dirname, '..', 'uploads');

  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
