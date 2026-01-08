import helmet from '@fastify/helmet';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { OtelLoggerService } from '../logger';
import type { BootstrapOptions, CorsConfig } from './bootstrap.types';

const DEFAULT_MAX_BODY_SIZE = 10 * 1024;
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:*',
  'http://127.0.0.1:*',
  'http://84.252.134.216',
  'https://84.252.134.216',
];

const DEFAULT_CORS_CONFIG: Omit<CorsConfig, 'origin'> = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export async function bootstrapNestApp(options: BootstrapOptions): Promise<NestFastifyApplication> {
  const { AppModule, apiPrefix, port, loggerProvider, maxBodySize, corsOrigins } = options;

  const bodyLimit = maxBodySize ?? DEFAULT_MAX_BODY_SIZE;
  const fastifyAdapter = new FastifyAdapter({ bodyLimit });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, { bufferLogs: true });

  // Set custom logger globally
  const logger = app.get(OtelLoggerService);
  const otelLogger = loggerProvider.getLogger('nestjs-logger');
  logger.setOtelLogger(otelLogger);
  app.useLogger(logger);

  app.enableShutdownHooks();
  app.setGlobalPrefix(apiPrefix);

  // Enable Helmet for security headers
  await app.register(helmet, { contentSecurityPolicy: true });

  // Enable CORS
  const origins = corsOrigins ?? DEFAULT_CORS_ORIGINS;
  app.enableCors({ ...DEFAULT_CORS_CONFIG, origin: origins });

  const configService = app.get(ConfigService);
  const listenPort = Number(configService.get('PORT', String(port)));
  await app.listen(listenPort, '0.0.0.0');

  return app;
}
