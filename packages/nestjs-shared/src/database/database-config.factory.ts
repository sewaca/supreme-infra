import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CustomTypeOrmLogger } from './typeorm-logger';

export interface DatabaseConfigOptions {
  entities?: TypeOrmModuleOptions['entities'];
}

export function createDatabaseConfig(
  configService: ConfigService,
  options: DatabaseConfigOptions = {},
): TypeOrmModuleOptions {
  // Если установлена переменная SKIP_DB_CONNECTION, возвращаем минимальную конфигурацию
  const skipDb = configService.get<string>('SKIP_DB_CONNECTION') === 'true';

  if (skipDb) {
    console.log('⚠️  Skipping database connection (SKIP_DB_CONNECTION=true)');
    // Возвращаем конфигурацию с невалидным хостом, но с entities
    // TypeORM создаст репозитории, но не сможет подключиться
    // Это позволит приложению запуститься и зарегистрировать роуты
    return {
      type: 'postgres',
      host: '0.0.0.0', // Невалидный хост для быстрого фейла
      port: -1, // Невалидный порт
      username: 'dummy',
      password: 'dummy',
      database: 'dummy',
      entities: options.entities || [],
      synchronize: false,
      logging: false,
      autoLoadEntities: true,
      // Быстрый фейл без ретраев
      retryAttempts: 0,
      retryDelay: 0,
      // Не пытаться подключиться при старте
      migrationsRun: false,
    };
  }

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
    entities: options.entities || [],
    synchronize: environment !== 'production',
    logging: true,
    logger: new CustomTypeOrmLogger(),
    maxQueryExecutionTime: 1000, // Log slow queries (>1s)
  };
}
