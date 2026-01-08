import type { Type } from '@nestjs/common';
import type { LoggerProvider } from '@opentelemetry/api-logs';

export type BootstrapOptions = {
  AppModule: Type;
  serviceName: string;
  apiPrefix: string;
  port: string | number;
  loggerProvider: LoggerProvider;
  maxBodySize?: number;
  corsOrigins?: string[];
};

export type CorsConfig = {
  origin: string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
};
