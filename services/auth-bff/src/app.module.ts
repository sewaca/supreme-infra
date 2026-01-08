import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, LoggerModule } from '@supreme-int/nestjs-shared';
import { HealthController } from './features/HealthCheck/api/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    ...createDatabaseImports(),
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

