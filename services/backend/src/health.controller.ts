import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('status')
  getStatus(): { status: string } {
    return { status: 'ok' };
  }
}
