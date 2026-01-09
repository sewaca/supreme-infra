import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeCommentEntity } from '../model/RecipeComment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(RecipeCommentEntity)
    private readonly recipeCommentRepository: Repository<RecipeCommentEntity>,
  ) {}

  async getRecipeComments(recipeId: number): Promise<RecipeCommentEntity[]> {
    return await this.recipeCommentRepository.find({
      where: { recipeId },
      order: { createdAt: 'DESC' },
    });
  }

  async createComment(
    recipeId: number,
    author: string,
    content: string,
    rating: number,
    authorUserId?: number,
  ): Promise<RecipeCommentEntity> {
    const comment = this.recipeCommentRepository.create({
      recipeId,
      author,
      content,
      rating,
      authorUserId: authorUserId || null,
    });

    return await this.recipeCommentRepository.save(comment);
  }
}
