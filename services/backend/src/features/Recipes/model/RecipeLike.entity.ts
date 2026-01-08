import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('recipe_likes')
export class RecipeLikeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'recipe_id' })
  recipeId!: number;

  @CreateDateColumn({ name: 'liked_at' })
  likedAt!: Date;
}
