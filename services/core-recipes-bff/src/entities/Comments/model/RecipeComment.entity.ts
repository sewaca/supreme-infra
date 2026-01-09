import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('recipe_comments')
export class RecipeCommentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'recipe_id', type: 'integer' })
  recipeId!: number;

  @Column({ type: 'varchar', length: 255 })
  author!: string;

  @Column({ name: 'author_user_id', type: 'integer', nullable: true })
  authorUserId!: number | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'integer' })
  rating!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
