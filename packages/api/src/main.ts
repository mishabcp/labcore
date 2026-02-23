import { config } from 'dotenv';
import * as path from 'path';

// Load root .env when running in monorepo (cwd is packages/api)
config({ path: path.resolve(process.cwd(), '../../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3001;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  });

  await app.listen(port);
  console.log(`LabCore API listening on http://localhost:${port}`);
}

bootstrap();
