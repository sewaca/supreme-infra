import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, HealthModule, LoggerModule } from '@supreme-int/nestjs-shared';
import { AuthModule } from './features/Auth/api/Auth.module';
import { RecipeLikeEntity, UserEntity } from './features/Auth/model/User.entity';
import { RecipesModule } from './features/Recipes/api/Recipes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    HealthModule.forRoot({ serviceName: 'backend' }),
    ...createDatabaseImports({ entities: [UserEntity, RecipeLikeEntity] }),
    RecipesModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
