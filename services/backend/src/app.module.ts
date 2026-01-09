import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule, LoggerModule } from '@supreme-int/nestjs-shared';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LoggerModule, HealthModule.forRoot({ serviceName: 'backend' })],
  controllers: [],
  providers: [],
})
export class AppModule {}
