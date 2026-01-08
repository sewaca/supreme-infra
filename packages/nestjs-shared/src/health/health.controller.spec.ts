import { Test, type TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { HealthController } from './health.controller';
import { HEALTH_MODULE_OPTIONS } from './health.constants';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HEALTH_MODULE_OPTIONS, useValue: { serviceName: 'test-service' } }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return status ok with service name', () => {
    const result = controller.getStatus();
    expect(result).toEqual({ status: 'ok', service: 'test-service' });
  });
});

