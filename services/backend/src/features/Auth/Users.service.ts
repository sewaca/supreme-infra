import { Injectable } from '@nestjs/common';

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
  private users: User[] = [
    {
      id: 1,
      email: 'admin@example.com',
      password: '$2b$10$Nkntdhghajml3edGWucny.xSRRLId2nv70E7hKzvjEQsythcN.ZpC',
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
    },
    {
      id: 2,
      email: 'moder@example.com',
      password: '$2b$10$RnWxr3HzK4KVuAv854g/k.AiwlFKaT/NDQQuulMkF1EzxvqNsmxn6',
      name: 'Moderator User',
      role: 'moderator',
      createdAt: new Date(),
    },
    {
      id: 3,
      email: 'user@example.com',
      password: '$2b$10$4INUj5alxEjHmoM/szXUBeIMDLowl42WnqOxJoULh.3qDFmnj/e9.',
      name: 'Regular User',
      role: 'user',
      createdAt: new Date(),
    },
  ];
  private currentId = 4;
  private recipeLikes: UserRecipeLike[] = [];

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async findById(id: number): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async create(
    email: string,
    hashedPassword: string,
    name: string,
    role: UserRole = 'user',
  ): Promise<User> {
    const user: User = {
      id: this.currentId++,
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async update(
    id: number,
    updates: Partial<Omit<User, 'id' | 'createdAt'>>,
  ): Promise<User | undefined> {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return undefined;
    }
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  async toggleRecipeLike(
    userId: number,
    recipeId: number,
  ): Promise<{ liked: boolean; totalLikes: number }> {
    const existingLike = this.recipeLikes.find(
      (like) => like.userId === userId && like.recipeId === recipeId,
    );

    if (existingLike) {
      this.recipeLikes = this.recipeLikes.filter(
        (like) => !(like.userId === userId && like.recipeId === recipeId),
      );
      const totalLikes = this.recipeLikes.filter(
        (like) => like.recipeId === recipeId,
      ).length;
      return { liked: false, totalLikes };
    }

    this.recipeLikes.push({ userId, recipeId, likedAt: new Date() });
    const totalLikes = this.recipeLikes.filter(
      (like) => like.recipeId === recipeId,
    ).length;
    return { liked: true, totalLikes };
  }

  async getRecipeLikesCount(recipeId: number): Promise<number> {
    return this.recipeLikes.filter((like) => like.recipeId === recipeId).length;
  }

  async isRecipeLikedByUser(
    userId: number,
    recipeId: number,
  ): Promise<boolean> {
    return this.recipeLikes.some(
      (like) => like.userId === userId && like.recipeId === recipeId,
    );
  }

  async getUserLikedRecipes(userId: number): Promise<number[]> {
    return this.recipeLikes
      .filter((like) => like.userId === userId)
      .map((like) => like.recipeId);
  }

  async delete(id: number): Promise<boolean> {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return false;
    }
    this.users.splice(userIndex, 1);
    this.recipeLikes = this.recipeLikes.filter((like) => like.userId !== id);
    return true;
  }
}
