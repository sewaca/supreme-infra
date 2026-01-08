import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { HEALTH_MODULE_OPTIONS } from './health.constants';
import { HealthController } from './health.controller';

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
