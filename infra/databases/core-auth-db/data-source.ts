// This file is kept for reference but is no longer used for migrations.
// Initial data is now loaded via init.sql during PostgreSQL deployment.
// Schema changes are handled by TypeORM synchronize in development
// and should use TypeORM migrations in the service code for production.

import { DataSource } from 'typeorm';
import { UserEntity } from '../../../services/core-auth/src/features/Auth/model/User.entity';

export const CoreAuthDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'core_auth_user',
  password: process.env.DB_PASSWORD || 'changeme123',
  database: process.env.DB_NAME || 'core_auth_db',
  entities: [UserEntity],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
