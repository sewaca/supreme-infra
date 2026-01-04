import './instrumentation';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function printRoutes() {
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter(),
    { 
      bufferLogs: false,
      logger: ['log'],
    },
  );

  await app.init();
  
  console.log('___ROUTES_EXTRACTION_COMPLETE___');
  
  await app.close();
  process.exit(0);
}

printRoutes().catch((error) => {
  console.error('Failed to print routes:', error);
  process.exit(1);
});

