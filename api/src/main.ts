import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { CustomLogger } from './libs/logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: {
      origin: process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN,
      credentials: true,
    },
  });
  app.setGlobalPrefix('api/v1');

  // app.use(cookieParser());
  app.useLogger(await app.resolve(CustomLogger));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin:
      process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Cookie'],
  });

  const port = process.env.PORT ?? 3000;

  await app.listen(port);
}
bootstrap();
