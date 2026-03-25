import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('recipe_likes')
export class RecipeLikeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'recipe_id', type: 'integer' })
  recipeId!: number;

  @CreateDateColumn({ name: 'liked_at' })
  likedAt!: Date;
}
