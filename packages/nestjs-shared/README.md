# @supreme-int/nestjs-shared

Переиспользуемые модули и сервисы для NestJS приложений в Supreme Infrastructure.

## Модули

### 📊 Database Module

Общий модуль для работы с PostgreSQL через TypeORM.

```typescript
import { createDatabaseImports } from "@supreme-int/nestjs-shared";

@Module({
  imports: [...createDatabaseImports({ entities: [UserEntity] })],
})
export class AppModule {}
```

[Подробная документация →](./src/database/README.md)

**Возможности:**

- Готовая конфигурация TypeORM
- Поддержка `SKIP_DB_CONNECTION` для генерации роутов
- Кастомный логгер с эмодзи
- Валидация переменных окружения

### 📝 Logger Module

Модуль логирования с интеграцией OpenTelemetry.

```typescript
import { LoggerModule, OtelLoggerService } from "@supreme-int/nestjs-shared";

@Module({
  imports: [LoggerModule],
})
export class AppModule {}
```

**Возможности:**

- Интеграция с OpenTelemetry
- Структурированное логирование
- Поддержка различных уровней логирования

### 🔐 JWT Authentication (Feature)

Модуль аутентификации с использованием JWT.

```typescript
import { JwtAuthGuard, JwtStrategy } from "@supreme-int/nestjs-shared";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "7d" },
      }),
    }),
  ],
  providers: [JwtStrategy],
})
export class AuthModule {}

// Использование в контроллере
@Controller("protected")
@UseGuards(JwtAuthGuard)
export class ProtectedController {}
```

**Возможности:**

- JWT стратегия для Passport
- Guard для защиты роутов
- Типизированный JWT payload

### 👥 Roles (Entity)

Модуль управления ролями пользователей.

```typescript
import { Roles, RolesGuard } from "@supreme-int/nestjs-shared";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "moderator")
export class AdminController {}
```

**Возможности:**

- Декоратор `@Roles()` для указания требуемых ролей
- Guard для проверки ролей пользователя
- Типизированные роли: `'user' | 'moderator' | 'admin'`

### ✅ Validation Pipe (Shared)

Pipe для валидации данных с использованием Zod.

```typescript
import { ZodValidationPipe } from "@supreme-int/nestjs-shared";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

@Post('users')
@UsePipes(new ZodValidationPipe(createUserSchema))
async createUser(@Body() dto: CreateUserDto) {
  // dto уже провалидирован
}
```

**Возможности:**

- Валидация с помощью Zod schemas
- Детальные сообщения об ошибках
- Типобезопасность

## Установка

Пакет устанавливается автоматически как workspace dependency:

```bash
pnpm install
```

## Использование

```typescript
import { createDatabaseImports, LoggerModule, OtelLoggerService } from "@supreme-int/nestjs-shared";
```

## Лицензия

ISC
