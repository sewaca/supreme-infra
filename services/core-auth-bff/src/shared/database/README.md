# Database Configuration

Этот сервис использует общую конфигурацию базы данных из пакета `@supreme-int/nestjs-shared`.

## Добавление Entity

Когда вы создаете новые entity, добавьте их в `database-config.factory.ts`:

```typescript
import { createDatabaseConfig as createBaseDatabaseConfig } from "@supreme-int/nestjs-shared";
import { UserEntity } from "../../features/Users/model/User.entity";
import { PostEntity } from "../../features/Posts/model/Post.entity";

export function createDatabaseConfig(configService: ConfigService): TypeOrmModuleOptions {
  return createBaseDatabaseConfig(configService, {
    entities: [UserEntity, PostEntity], // Добавьте ваши entity здесь
  });
}
```

## Feature Modules с TypeORM

В feature модулях используйте условную загрузку `TypeOrmModule.forFeature()`:

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../model/User.entity";
import { UsersService } from "../model/Users.service";
import { UsersController } from "./Users.controller";

const skipDb = process.env.SKIP_DB_CONNECTION === "true";
const dbFeatureImports = skipDb ? [] : [TypeOrmModule.forFeature([UserEntity])];

@Module({
  imports: [...dbFeatureImports],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

## SKIP_DB_CONNECTION

Переменная окружения `SKIP_DB_CONNECTION=true` используется для:

- Генерации конфигурации роутов (`pnpm run generate:router`)
- Запуска приложения без реального подключения к БД
- Тестирования структуры приложения

При `SKIP_DB_CONNECTION=true`:

- TypeORM репозитории заменяются на mock-объекты
- Приложение запускается без подключения к PostgreSQL
- Все роуты регистрируются корректно
- Сервисы получают mock-репозитории, которые возвращают пустые данные

## Подробнее

См. документацию пакета: `packages/nestjs-shared/src/database/README.md`
