import { DynamicModule, Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HEALTH_MODULE_OPTIONS } from './health.constants';
import type { HealthModuleOptions } from './health.types';

@Module({})
export class HealthModule {
  static forRoot(options: HealthModuleOptions): DynamicModule {
    return {
      module: HealthModule,
      controllers: [HealthController],
      providers: [
        {
          provide: HEALTH_MODULE_OPTIONS,
          useValue: options,
        },
      ],
    };
  }
}

