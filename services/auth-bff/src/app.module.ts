import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, LoggerModule, HealthModule } from '@supreme-int/nestjs-shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    HealthModule.forRoot({ serviceName: 'auth-bff' }),
    ...createDatabaseImports(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

