import { Controller, Get, Inject } from '@nestjs/common';
import { HEALTH_MODULE_OPTIONS } from '../model/health.constants';
import type { HealthModuleOptions } from '../model/health.types';

@Controller('api')
export class HealthController {
  constructor(
    @Inject(HEALTH_MODULE_OPTIONS)
    private readonly options: HealthModuleOptions,
  ) {}

  @Get('status')
  getStatus(): { status: string; service: string } {
    return { status: 'ok', service: this.options.serviceName };
  }
}
