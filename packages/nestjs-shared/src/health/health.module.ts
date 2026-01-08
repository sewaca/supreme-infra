import { DynamicModule, Module } from '@nestjs/common';
import { HEALTH_MODULE_OPTIONS } from './health.constants';
import { HealthController } from './health.controller';
import type { HealthModuleOptions } from './health.types';

@Module({})
export class HealthModule {
  public readonly moduleName: string = 'health core module';

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
