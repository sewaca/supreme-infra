import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, LoggerModule } from '@supreme-int/nestjs-shared';
import { AuthModule } from './features/Auth/api/Auth.module';
import { RecipeLikeEntity, UserEntity } from './features/Auth/model/User.entity';
import { HealthController } from './features/HealthCheck/api/health.controller';
import { RecipesModule } from './features/Recipes/api/Recipes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    ...createDatabaseImports({ entities: [UserEntity, RecipeLikeEntity] }),
    RecipesModule,
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
