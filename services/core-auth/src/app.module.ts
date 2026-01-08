import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, HealthModule, LoggerModule } from '@supreme-int/nestjs-shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    HealthModule.forRoot({ serviceName: 'core-auth' }),
    ...createDatabaseImports(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

