import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  it('should be defined', async () => {
    const module: TestingModule = await Test.createTestingModule({ controllers: [HealthController] }).compile();
    controller = module.get<HealthController>(HealthController);
    expect(controller).toBeDefined();
  });

  it('should return ok status', async () => {
    const module: TestingModule = await Test.createTestingModule({ controllers: [HealthController] }).compile();
    controller = module.get<HealthController>(HealthController);
    const result = controller.getStatus();
    expect(result).toEqual({ status: 'ok' });
  });
});

