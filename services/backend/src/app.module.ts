import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, HealthModule, LoggerModule } from '@supreme-int/nestjs-shared';
import { RecipesModule } from './features/Recipes/api/Recipes.module';
import { RecipeLikeEntity } from './features/Recipes/model/RecipeLike.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    HealthModule.forRoot({ serviceName: 'backend' }),
    ...createDatabaseImports({ entities: [RecipeLikeEntity] }),
    RecipesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
