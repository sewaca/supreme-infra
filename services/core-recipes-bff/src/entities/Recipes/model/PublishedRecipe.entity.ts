import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export interface RecipeIngredient {
  name: string;
  amount: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

@Entity('published_recipes')
export class PublishedRecipeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', array: true })
  ingredients!: string[];

  @Column({ type: 'text' })
  instructions!: string;

  @Column({ name: 'cooking_time', type: 'integer' })
  cookingTime!: number;

  @Column({ type: 'varchar', length: 20 })
  difficulty!: 'easy' | 'medium' | 'hard';

  @Column({ name: 'image_url', type: 'text' })
  imageUrl!: string;

  @Column({ type: 'integer' })
  servings!: number;

  @Column({ type: 'integer' })
  calories!: number;

  @Column({ name: 'detailed_ingredients', type: 'jsonb' })
  detailedIngredients!: RecipeIngredient[];

  @Column({ type: 'jsonb' })
  steps!: RecipeStep[];

  @Column({ type: 'varchar', length: 255 })
  author!: string;

  @Column({ name: 'author_user_id', type: 'integer', nullable: true })
  authorUserId!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
