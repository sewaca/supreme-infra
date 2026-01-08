import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '@supreme-int/nestjs-shared';
import { AuthModule } from './features/Auth/api/Auth.module';
import { HealthController } from './features/HealthCheck/api/health.controller';
import { RecipesModule } from './features/Recipes/api/Recipes.module';
import { createDatabaseConfig } from './shared/database/database-config.factory';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createDatabaseConfig,
    }),
    RecipesModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
