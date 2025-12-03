import './instrumentation';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

const MAX_BODY_SIZE = 10 * 1024;

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter({ bodyLimit: MAX_BODY_SIZE }),
    { bufferLogs: true },
  );
  app.enableShutdownHooks();

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Add a simple health check endpoint
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.get('/', async () => {
    return { status: 'ok', message: 'Backend service is running' };
  });

  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();
