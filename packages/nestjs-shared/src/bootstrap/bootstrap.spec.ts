import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggerModule } from '../logger';
import { bootstrapNestApp } from './bootstrap';

// Mock module for testing
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), LoggerModule], controllers: [], providers: [] })
class TestAppModule {}

describe('bootstrapNestApp', () => {
  const mockLoggerProvider = { getLogger: vi.fn(() => ({ emit: vi.fn() })) };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create and configure NestJS application with default options', async () => {
    const app = await bootstrapNestApp({
      AppModule: TestAppModule,
      serviceName: 'test-service',
      apiPrefix: 'api',
      port: '3000',
      loggerProvider: mockLoggerProvider as never,
    });
    expect(app).toBeDefined();
    await app.close();
  });

  it('should create application with custom CORS origins', async () => {
    const customOrigins = ['http://custom-origin.com'];
    const app = await bootstrapNestApp({
      AppModule: TestAppModule,
      serviceName: 'test-service',
      apiPrefix: 'api',
      port: '3000',
      loggerProvider: mockLoggerProvider as never,
      corsOrigins: customOrigins,
    });
    expect(app).toBeDefined();
    await app.close();
  });

  it('should create application with custom body size', async () => {
    const customBodySize = 20 * 1024;
    const app = await bootstrapNestApp({
      AppModule: TestAppModule,
      serviceName: 'test-service',
      apiPrefix: 'api',
      port: '3000',
      loggerProvider: mockLoggerProvider as never,
      maxBodySize: customBodySize,
    });
    expect(app).toBeDefined();
    await app.close();
  });
});
