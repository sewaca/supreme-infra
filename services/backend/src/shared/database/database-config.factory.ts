import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RecipeLikeEntity, UserEntity } from '../../features/Auth/model/User.entity';
import { CustomTypeOrmLogger } from './typeorm-logger';

export function createDatabaseConfig(configService: ConfigService): TypeOrmModuleOptions {
  const host = configService.get<string>('DB_HOST', 'localhost');
  const port = configService.get<number>('DB_PORT', 5432);
  const database = configService.get<string>('DB_NAME');
  const username = configService.get<string>('DB_USER');
  const password = configService.get<string>('DB_PASSWORD');
  const environment = configService.get<string>('NODE_ENV');

  // Validate required environment variables
  if (!database) {
    throw new Error('DB_NAME is not set');
  }
  if (!username) {
    throw new Error('DB_USER is not set');
  }
  if (!password) {
    throw new Error('DB_PASSWORD is not set');
  }
  if (!environment) {
    throw new Error('NODE_ENV is not set');
  }

  console.log('🔌 Connecting to database:', {
    host,
    port,
    database,
    username,
    environment,
  });

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: [UserEntity, RecipeLikeEntity],
    synchronize: environment !== 'production',
    logging: true,
    logger: new CustomTypeOrmLogger(),
    maxQueryExecutionTime: 1000, // Log slow queries (>1s)
  };
}
