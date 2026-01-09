import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createDatabaseImports, HealthModule, LoggerModule } from '@supreme-int/nestjs-shared';
import { CommentsModule } from './entities/Comments/api/Comments.module';
import { RecipeCommentEntity } from './entities/Comments/model/RecipeComment.entity';
import { RecipesModule } from './entities/Recipes/api/Recipes.module';
import { ProposedRecipeEntity } from './entities/Recipes/model/ProposedRecipe.entity';
import { PublishedRecipeEntity } from './entities/Recipes/model/PublishedRecipe.entity';
import { RecipeLikesModule } from './features/RecipeLikes/api/RecipeLikes.module';
import { RecipeLikeEntity } from './features/RecipeLikes/model/RecipeLike.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    HealthModule.forRoot({ serviceName: 'core-recipes-bff' }),
    ...createDatabaseImports({
      entities: [PublishedRecipeEntity, ProposedRecipeEntity, RecipeLikeEntity, RecipeCommentEntity],
    }),
    RecipesModule,
    CommentsModule,
    RecipeLikesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
