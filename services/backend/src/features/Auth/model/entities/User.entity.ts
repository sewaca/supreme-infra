import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

export type UserRole = 'user' | 'moderator' | 'admin';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(
    () => RecipeLikeEntity,
    (recipeLike) => recipeLike.user,
  )
  recipeLikes: RecipeLikeEntity[];
}

@Entity('recipe_likes')
export class RecipeLikeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'recipe_id' })
  recipeId: number;

  @CreateDateColumn({ name: 'liked_at' })
  likedAt: Date;

  @ManyToOne(
    () => UserEntity,
    (user) => user.recipeLikes,
  )
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
