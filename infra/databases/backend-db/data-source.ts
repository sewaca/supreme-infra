// This file is kept for reference but is no longer used for migrations.
// Initial data is now loaded via init.sql during PostgreSQL deployment.
// Schema changes are handled by TypeORM synchronize in development
// and should use TypeORM migrations in the service code for production.

import { DataSource } from 'typeorm';
import { RecipeLikeEntity, UserEntity } from '../../../services/backend/src/features/Auth/model/entities/User.entity';

export const BackendDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'backend_user',
  password: process.env.DB_PASSWORD || 'changeme123',
  database: process.env.DB_NAME || 'backend_db',
  entities: [UserEntity, RecipeLikeEntity],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
