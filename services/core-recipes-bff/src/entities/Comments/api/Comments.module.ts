import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeCommentEntity } from '../model/RecipeComment.entity';
import { CommentsService } from './Comments.service';

const skipDb = process.env.SKIP_DB_CONNECTION === 'true';
const dbFeatureImports = skipDb ? [] : [TypeOrmModule.forFeature([RecipeCommentEntity])];

@Module({
  imports: [...dbFeatureImports],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
