import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeLikeEntity } from '../model/RecipeLike.entity';

@Injectable()
export class RecipeLikesService {
  constructor(
    @InjectRepository(RecipeLikeEntity)
    private readonly recipeLikeRepository: Repository<RecipeLikeEntity>,
  ) {}

  async toggleRecipeLike(userId: number, recipeId: number): Promise<{ liked: boolean; totalLikes: number }> {
    const existingLike = await this.recipeLikeRepository.findOne({
      where: { userId, recipeId },
    });

    if (existingLike) {
      await this.recipeLikeRepository.remove(existingLike);
      const totalLikes = await this.recipeLikeRepository.count({ where: { recipeId } });
      return { liked: false, totalLikes };
    }

    const like = this.recipeLikeRepository.create({ userId, recipeId });
    await this.recipeLikeRepository.save(like);
    const totalLikes = await this.recipeLikeRepository.count({ where: { recipeId } });
    return { liked: true, totalLikes };
  }

  async getRecipeLikesCount(recipeId: number): Promise<number> {
    return await this.recipeLikeRepository.count({ where: { recipeId } });
  }

  async isRecipeLikedByUser(userId: number, recipeId: number): Promise<boolean> {
    const like = await this.recipeLikeRepository.findOne({
      where: { userId, recipeId },
    });
    return !!like;
  }

  async getUserLikedRecipes(userId: number): Promise<number[]> {
    const likes = await this.recipeLikeRepository.find({
      where: { userId },
      select: ['recipeId'],
    });
    return likes.map((like) => like.recipeId);
  }
}
