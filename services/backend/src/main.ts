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

  // Add a simple health check endpoint
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.get('/', async () => {
    return { status: 'ok', message: 'Backend service is running' };
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
