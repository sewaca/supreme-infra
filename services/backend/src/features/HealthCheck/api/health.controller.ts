import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('api/status')
  getStatus(): { status: string } {
    return { status: 'ok' };
  }
}
