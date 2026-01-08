import './instrumentation';
import helmet from '@fastify/helmet';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { OtelLoggerService } from './shared/logger';

const MAX_BODY_SIZE = 10 * 1024;

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({ bodyLimit: MAX_BODY_SIZE });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, { bufferLogs: true });

  // Set custom logger globally
  // biome-ignore lint/correctness/useHookAtTopLevel: TODO: fix this
  app.useLogger(app.get(OtelLoggerService));

  app.enableShutdownHooks();
  app.setGlobalPrefix('main-api');

  // Enable Helmet for security headers
  await app.register(helmet, { contentSecurityPolicy: true });

  // Enable CORS
  // TODO: сделать по человечески
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://84.252.134.216',
      'https://84.252.134.216',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const configService = app.get(ConfigService);
  await app.listen(Number(configService.get('PORT', '4000')), '0.0.0.0');
}
bootstrap();
