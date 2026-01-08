import { DynamicModule, Module } from '@nestjs/common';
import { HEALTH_MODULE_OPTIONS } from '../model/health.constants';
import type { HealthModuleOptions } from '../model/health.types';
import { HealthController } from './health.controller';

@Module({})
export class HealthModule {
  public readonly moduleName: string = 'health core module';

  static forRoot(options: HealthModuleOptions): DynamicModule {
    return {
      module: HealthModule,
      controllers: [HealthController],
      providers: [{ provide: HEALTH_MODULE_OPTIONS, useValue: options }],
    };
  }
}
