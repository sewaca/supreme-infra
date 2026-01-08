import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeLikeEntity, UserEntity } from './User.entity';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface UserRecipeLike {
  userId: number;
  recipeId: number;
  likedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RecipeLikeEntity)
    private readonly recipeLikeRepository: Repository<RecipeLikeEntity>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { email } });
    return user ?? undefined;
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ?? undefined;
  }

  async create(email: string, hashedPassword: string, name: string, role: UserRole = 'user'): Promise<User> {
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role,
    });
    return await this.userRepository.save(user);
  }

  async update(id: number, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return undefined;
    }
    Object.assign(user, updates);
    return await this.userRepository.save(user);
  }

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

  async delete(id: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return false;
    }
    await this.recipeLikeRepository.delete({ userId: id });
    await this.userRepository.remove(user);
    return true;
  }
}
