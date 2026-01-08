# Генератор микросервисов

Интерактивный генератор для создания новых микросервисов на базе NestJS или Next.js.

## Использование

```bash
pnpm run generate:service
```

## Что делает генератор

1. **Интерактивный опрос** - спрашивает у пользователя:
   - Название сервиса
   - Тип сервиса (NestJS или Next.js)
   - Описание
   - Порт для локальной разработки
   - API префикс (для NestJS)
   - Нужна ли база данных (для NestJS)
   - Параметры базы данных (если нужна)

2. **Создание структуры** - генерирует полную структуру сервиса:
   - Все необходимые конфигурационные файлы
   - Базовый код приложения
   - Dockerfile
   - README с инструкциями
   - Конфигурацию для тестов
   - Health check endpoint

3. **Обновление services.yaml** - автоматически добавляет новый сервис в общий конфиг

## Шаблоны

### NestJS (Backend)

Создает полноценный NestJS сервис с:
- Fastify адаптером
- OpenTelemetry инструментацией
- Prometheus метриками
- Health check контроллером
- TypeORM (опционально, если нужна БД)
- Webpack конфигурацией
- Vitest для тестов

Структура:
```
services/<service-name>/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── instrumentation.ts
│   ├── features/
│   │   └── HealthCheck/
│   │       └── api/
│   │           ├── health.controller.ts
│   │           └── health.controller.spec.ts
│   └── shared/
│       └── database/              # Только если hasDatabase = true
│           ├── database-config.factory.ts
│           └── typeorm-logger.ts
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── webpack.config.js
├── vitest.config.ts
├── Dockerfile
├── .gitignore
├── router.yaml
├── service.yaml
└── README.md
```

### Next.js (Frontend)

Создает Next.js 15 приложение с:
- App Router
- OpenTelemetry инструментацией
- Prometheus метриками
- Health check API route
- Vitest + Testing Library для тестов

Структура:
```
services/<service-name>/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── status/
│           ├── route.ts
│           └── route.spec.ts
├── src/
│   └── shared/
│       └── lib/
│           └── environment.ts
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.ts
├── vitest.setup.ts
├── instrumentation.ts
├── instrumentation.nodejs.ts
├── middleware.ts
├── Dockerfile
├── .gitignore
├── router.yaml
├── service.yaml
└── README.md
```

## Переменные шаблонов

Все шаблоны используют Handlebars с следующими переменными:

- `{{serviceName}}` - название сервиса
- `{{description}}` - описание сервиса
- `{{port}}` - порт для локальной разработки
- `{{apiPrefix}}` - API префикс (только NestJS)
- `{{hasDatabase}}` - флаг наличия БД (только NestJS)
- `{{databaseName}}` - название базы данных
- `{{databaseUser}}` - пользователь БД
- `{{databasePasswordSecret}}` - название GitHub Secret для пароля

## Пример использования

```bash
$ pnpm run generate:service

═══════════════════════════════════════════════════════════
🚀 Генератор микросервисов Supreme Infrastructure
═══════════════════════════════════════════════════════════

? Название сервиса: auth-bff
? Тип сервиса: NestJS (Backend)
? Описание сервиса: Authentication BFF service
? Порт для локальной разработки: 4001
? API префикс: auth-bff
? Нужна ли сервису база данных PostgreSQL? Yes
? Название базы данных: auth_bff_db
? Имя пользователя базы данных: auth_bff_user
? Название GitHub Secret для пароля БД: AUTH_BFF_DB_PASSWORD

📋 Конфигурация сервиса:
───────────────────────────────────────────────────────────
  Название: auth-bff
  Тип: NestJS
  Описание: Authentication BFF service
  Порт: 4001
  API префикс: auth-bff
  База данных: Да
    - Название БД: auth_bff_db
    - Пользователь: auth_bff_user
    - GitHub Secret: AUTH_BFF_DB_PASSWORD

? Создать сервис с этими настройками? Yes

📦 Создание сервиса...
───────────────────────────────────────────────────────────
→ Копирование шаблонов nest...
✓ Файлы сервиса созданы в: services/auth-bff
→ Обновление services.yaml...
✓ services.yaml обновлен

═══════════════════════════════════════════════════════════
✅ Сервис успешно создан!
═══════════════════════════════════════════════════════════

📝 Следующие шаги:

  1. Установите зависимости:
     cd services/auth-bff && pnpm install

  2. Запустите генераторы инфраструктуры:
     pnpm run generate

  3. Запустите сервис локально:
     cd services/auth-bff && pnpm run dev

  4. Настройте базу данных:
     - Создайте init.sql в infra/databases/auth_bff_db/
     - Добавьте GitHub Secret: AUTH_BFF_DB_PASSWORD

═══════════════════════════════════════════════════════════
```

## После генерации

После создания сервиса необходимо:

1. **Установить зависимости**:
   ```bash
   cd services/<service-name>
   pnpm install
   ```

2. **Запустить генераторы инфраструктуры**:
   ```bash
   pnpm run generate
   ```
   Это обновит:
   - Ingress конфигурацию
   - CI/CD workflows
   - Helm values файлы

3. **Настроить базу данных** (если нужна):
   - Создать `infra/databases/<db-name>/init.sql`
   - Добавить GitHub Secret для пароля БД
   - Запустить `pnpm run generate` еще раз

4. **Начать разработку**:
   ```bash
   cd services/<service-name>
   pnpm run dev
   ```

## Добавление шаблонов

Чтобы добавить новые файлы в шаблоны:

1. Создайте файл в `templates/nest/` или `templates/next/`
2. Используйте расширение `.hbs` для файлов с Handlebars переменными
3. Структура папок должна соответствовать итоговой структуре сервиса
4. Используйте переменные `{{variableName}}` для подстановки значений

Пример:
```
templates/nest/src/features/MyFeature/my-file.ts.hbs
```

Создаст:
```
services/<service-name>/src/features/MyFeature/my-file.ts
```

## Валидация

Генератор проверяет:
- ✅ Название сервиса (только строчные буквы, цифры, дефисы)
- ✅ Уникальность названия (сервис не должен существовать)
- ✅ Порт (от 1024 до 65535)
- ✅ Название БД (только строчные буквы, цифры, подчеркивания)
- ✅ Имя пользователя БД (только строчные буквы, цифры, подчеркивания)
- ✅ Название секрета (только заглавные буквы, цифры, подчеркивания)

## Troubleshooting

### Ошибка "Service already exists"

Сервис с таким названием уже существует в `services/`. Выберите другое название.

### Ошибка при копировании файлов

Проверьте права доступа к директории `services/`.

### Шаблоны не найдены

Убедитесь, что папка `infra/generate/generate-service/templates/` существует и содержит шаблоны.

