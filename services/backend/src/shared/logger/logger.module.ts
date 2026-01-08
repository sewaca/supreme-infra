import { Global, Module } from '@nestjs/common';
import { OtelLoggerService } from './otel-logger.service';

@Global()
@Module({
  providers: [OtelLoggerService],
  exports: [OtelLoggerService],
})
export class LoggerModule {}
