import './instrumentation';
import helmet from '@fastify/helmet';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

const MAX_BODY_SIZE = 10 * 1024;

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({
    bodyLimit: MAX_BODY_SIZE,
    trustProxy: true, // Trust X-Forwarded-For header for rate limiting
  });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, { bufferLogs: true });
  app.enableShutdownHooks();
  app.setGlobalPrefix('main-api');

  // Enable Helmet for security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

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

  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();
