import { DynamicModule, Module } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';

/**
 * Создает mock-репозиторий для entity
 */
function createMockRepository() {
  return {
    find: () => Promise.resolve([]),
    findOne: () => Promise.resolve(null),
    findOneBy: () => Promise.resolve(null),
    findAndCount: () => Promise.resolve([[], 0]),
    save: (entity: unknown) => Promise.resolve(entity),
    create: (entity: unknown) => entity,
    update: () => Promise.resolve({ affected: 1, raw: [], generatedMaps: [] }),
    delete: () => Promise.resolve({ affected: 1, raw: [] }),
    remove: (entity: unknown) => Promise.resolve(entity),
    count: () => Promise.resolve(0),
    query: () => Promise.resolve([]),
    createQueryBuilder: () => ({
      select: () => ({}),
      where: () => ({}),
      andWhere: () => ({}),
      orWhere: () => ({}),
      getMany: () => Promise.resolve([]),
      getOne: () => Promise.resolve(null),
      execute: () => Promise.resolve({ raw: [], affected: 0 }),
    }),
    manager: {
      transaction: (cb: (manager: unknown) => Promise<unknown>) =>
        cb({
          save: (entity: unknown) => Promise.resolve(entity),
          find: () => Promise.resolve([]),
        }),
      save: (entity: unknown) => Promise.resolve(entity),
      find: () => Promise.resolve([]),
      findOne: () => Promise.resolve(null),
      create: (entity: unknown) => entity,
      update: () => Promise.resolve({ affected: 1, raw: [], generatedMaps: [] }),
      delete: () => Promise.resolve({ affected: 1, raw: [] }),
      query: () => Promise.resolve([]),
    },
  };
}

/**
 * Создает mock DataSource
 */
function createMockDataSource() {
  return {
    isInitialized: true,
    options: {},
    initialize: () => Promise.resolve(),
    destroy: () => Promise.resolve(),
    synchronize: () => Promise.resolve(),
    dropDatabase: () => Promise.resolve(),
    runMigrations: () => Promise.resolve([]),
    undoLastMigration: () => Promise.resolve(undefined),
    query: () => Promise.resolve([]),
    createQueryRunner: () => ({
      connect: () => Promise.resolve(),
      startTransaction: () => Promise.resolve(),
      commitTransaction: () => Promise.resolve(),
      rollbackTransaction: () => Promise.resolve(),
      release: () => Promise.resolve(),
      query: () => Promise.resolve([]),
      manager: {
        save: (entity: unknown) => Promise.resolve(entity),
        find: () => Promise.resolve([]),
      },
    }),
    manager: {
      transaction: (cb: (manager: unknown) => Promise<unknown>) =>
        cb({
          save: (entity: unknown) => Promise.resolve(entity),
          find: () => Promise.resolve([]),
        }),
      save: (entity: unknown) => Promise.resolve(entity),
      find: () => Promise.resolve([]),
      findOne: () => Promise.resolve(null),
      create: (entity: unknown) => entity,
      update: () => Promise.resolve({ affected: 1, raw: [], generatedMaps: [] }),
      delete: () => Promise.resolve({ affected: 1, raw: [] }),
      query: () => Promise.resolve([]),
    },
  };
}

/**
 * Создает модуль с mock-репозиториями для указанных entities
 * Используется когда SKIP_DB_CONNECTION=true
 *
 * @param entities - Массив entity классов
 * @returns DynamicModule с mock-провайдерами
 *
 * @example
 * ```typescript
 * import { createMockTypeOrmModule } from '@supreme-int/nestjs-shared';
 * import { UserEntity } from './user.entity';
 *
 * @Module({
 *   imports: [
 *     createMockTypeOrmModule([UserEntity]),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export function createMockTypeOrmModule(entities: unknown[] = []): DynamicModule {
  const providers = entities.map((entity) => ({
    provide: getRepositoryToken(entity as never),
    useValue: createMockRepository(),
  }));

  // Добавляем mock DataSource
  providers.push({
    provide: getDataSourceToken(),
    useValue: createMockDataSource() as never,
  });

  return {
    module: MockTypeOrmModule,
    providers,
    exports: providers.map((p) => p.provide),
    global: true,
  };
}

@Module({})
class MockTypeOrmModule {}
