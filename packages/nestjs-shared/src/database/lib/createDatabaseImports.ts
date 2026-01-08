import type { DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createMockTypeOrmModule } from '../mocks/mock-typeorm.module';
import { createDatabaseConfig, type DatabaseConfigOptions } from '../model/createDatabaseConfig.factory';

/**
 * Создает массив импортов для TypeORM с поддержкой SKIP_DB_CONNECTION
 *
 * @param options - Опции конфигурации базы данных (например, entities)
 * @returns Массив модулей для импорта в @Module
 *
 * @example
 * ```typescript
 * import { createDatabaseImports } from '@supreme-int/nestjs-shared';
 * import { UserEntity } from './entities/user.entity';
 *
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true }),
 *     LoggerModule,
 *     ...createDatabaseImports({ entities: [UserEntity] }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export function createDatabaseImports(options: DatabaseConfigOptions = {}): DynamicModule[] {
  const skipDbConnection = process.env.SKIP_DB_CONNECTION === 'true';

  if (skipDbConnection) {
    console.log('⚠️  Using mock TypeORM repositories (SKIP_DB_CONNECTION=true)');
    // Возвращаем mock-модуль с фейковыми репозиториями
    const entities = Array.isArray(options.entities) ? options.entities : [];
    return [createMockTypeOrmModule(entities)];
  }

  return [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => createDatabaseConfig(configService, options),
    }),
  ];
}
