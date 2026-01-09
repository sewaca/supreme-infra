import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createDatabaseConfig as createBaseDatabaseConfig } from '@supreme-int/nestjs-shared';
import { RecipeCommentEntity } from '../../entities/Comments/model/RecipeComment.entity';
import { ProposedRecipeEntity } from '../../entities/Recipes/model/ProposedRecipe.entity';
import { PublishedRecipeEntity } from '../../entities/Recipes/model/PublishedRecipe.entity';
import { RecipeLikeEntity } from '../../features/RecipeLikes/model/RecipeLike.entity';

export function createDatabaseConfig(configService: ConfigService): TypeOrmModuleOptions {
  return createBaseDatabaseConfig(configService, {
    entities: [PublishedRecipeEntity, ProposedRecipeEntity, RecipeLikeEntity, RecipeCommentEntity],
  });
}
