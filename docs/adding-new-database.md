# Добавление новой базы данных для сервиса

Пошаговое руководство по добавлению PostgreSQL базы данных для нового или существующего сервиса.

## Быстрый старт

### 1. Обновите services.yaml

Добавьте секцию `database` для вашего сервиса:

```yaml
services:
  nest:
    - name: my-service
      description: My awesome service
      database:
        enabled: true
        name: my_service_db # опционально
        user: my_service_user # опционально
```

**Параметры:**

- `enabled` - включить/выключить БД для сервиса
- `name` - имя базы данных (по умолчанию: `{service}_db`)
- `user` - имя пользователя БД (по умолчанию: `{service}_user`)

### 2. Создайте структуру для миграций

```bash
mkdir -p infra/databases/my-service-db/migrations
```

### 3. Создайте data-source.ts

Создайте файл `infra/databases/my-service-db/data-source.ts`:

```typescript
import { DataSource } from "typeorm";
import { MyEntity } from "../../../services/my-service/src/entities/MyEntity";

export const MyServiceDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USER || "my_service_user",
  password: process.env.DB_PASSWORD || "changeme123",
  database: process.env.DB_NAME || "my_service_db",
  entities: [MyEntity],
  migrations: ["infra/databases/my-service-db/migrations/*.ts"],
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
});
```

### 4. Создайте README.md для БД

Создайте файл `infra/databases/my-service-db/README.md`:

```markdown
# My Service Database

PostgreSQL database for my-service.

## Database Info

- **Name**: my_service_db
- **User**: my_service_user
- **Service**: my-service

## Tables

### my_table

Description of the table...

| Column | Type    | Description |
| ------ | ------- | ----------- |
| id     | serial  | Primary key |
| name   | varchar | Name        |

## Migrations

...
```

### 5. Запустите генератор

```bash
pnpm run generate
```

Это автоматически создаст:

- `infra/overrides/development/postgresql-my-service.yaml`
- `infra/overrides/production/postgresql-my-service.yaml`

### 6. Обновите service.yaml сервиса

Добавьте переменные окружения в `services/my-service/service.yaml`:

```yaml
env:
  PORT: "4000"
  NODE_ENV: "production"
  DB_HOST: "postgresql-my-service"
  DB_PORT: "5432"
  DB_NAME: "my_service_db"
  DB_USER: "my_service_user"
  # DB_PASSWORD передается из GitHub Secrets
```

### 7. Запустите генератор еще раз

```bash
pnpm run generate
```

Это обновит overrides для вашего сервиса с новыми переменными окружения.

### 8. Добавьте DB_PASSWORD в GitHub Secrets

1. Перейдите в Settings -> Secrets and variables -> Actions
2. Нажмите "New repository secret"
3. Name: `DB_PASSWORD_MY_SERVICE` (или просто `DB_PASSWORD` если одна БД)
4. Value: ваш безопасный пароль

### 9. Обновите CD workflow (если нужно)

Если вы используете отдельный секрет для каждой БД, обновите `.github/workflows/cd.yml`:

```yaml
env:
  DB_PASSWORD: ${{ secrets.DB_PASSWORD_MY_SERVICE }}
```

### 10. Деплой PostgreSQL

```bash
# Development
helm install postgresql-my-service ./infra/helmcharts/postgresql \
  --namespace default \
  --set database.password=dev_password \
  -f infra/overrides/development/postgresql-my-service.yaml

# Production
helm install postgresql-my-service ./infra/helmcharts/postgresql \
  --namespace production \
  --set database.password=$DB_PASSWORD \
  -f infra/overrides/production/postgresql-my-service.yaml
```

### 11. Деплой сервиса

Создайте PR и запустите release pipeline через GitHub Actions.

## Детальное руководство

### Структура директорий

```
infra/
├── databases/
│   ├── backend-db/              # БД для backend сервиса
│   │   ├── data-source.ts       # TypeORM DataSource
│   │   ├── migrations/          # Миграции
│   │   │   └── *.ts
│   │   └── README.md            # Документация БД
│   └── my-service-db/           # БД для нового сервиса
│       ├── data-source.ts
│       ├── migrations/
│       └── README.md
├── helmcharts/
│   └── postgresql/              # Общий Helm chart для PostgreSQL
└── overrides/
    ├── development/
    │   ├── postgresql-backend.yaml
    │   └── postgresql-my-service.yaml
    └── production/
        ├── postgresql-backend.yaml
        └── postgresql-my-service.yaml
```

### Создание миграций

#### Для NestJS сервиса

Обновите `package.json` сервиса:

```json
{
  "scripts": {
    "migration:generate": "typeorm-ts-node-commonjs migration:generate -d ../../infra/databases/my-service-db/data-source.ts",
    "migration:run": "typeorm-ts-node-commonjs migration:run -d ../../infra/databases/my-service-db/data-source.ts",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert -d ../../infra/databases/my-service-db/data-source.ts"
  }
}
```

Создайте миграцию:

```bash
cd services/my-service
pnpm run migration:generate -- MigrationName
```

#### Пример миграции

Создайте файл `infra/databases/my-service-db/migrations/1704800000000-InitialData.ts`:

```typescript
import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialData1704800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO my_table (name) VALUES
      ('Item 1'),
      ('Item 2')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM my_table WHERE name IN ('Item 1', 'Item 2');
    `);
  }
}
```

### Настройка TypeORM в сервисе

В `app.module.ts` вашего NestJS сервиса:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MyEntity } from "./entities/MyEntity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("DB_HOST", "localhost"),
        port: configService.get<number>("DB_PORT", 5432),
        username: configService.get<string>("DB_USER", "my_service_user"),
        password: configService.get<string>("DB_PASSWORD", "changeme123"),
        database: configService.get<string>("DB_NAME", "my_service_db"),
        entities: [MyEntity],
        synchronize: configService.get<string>("NODE_ENV") !== "production",
        logging: configService.get<string>("NODE_ENV") === "development",
      }),
    }),
  ],
})
export class AppModule {}
```

### Локальная разработка

Создайте `docker-compose.dev.yml` в корне сервиса:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: supreme-postgres-my-service-dev
    environment:
      POSTGRES_USER: my_service_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: my_service_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U my_service_user -d my_service_db"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

Запуск:

```bash
cd services/my-service
docker-compose -f docker-compose.dev.yml up -d
pnpm run dev
```

### Генерируемые values

Генератор создает два файла для каждого окружения:

#### Development

```yaml
nameOverride: postgresql-my-service
fullnameOverride: postgresql-my-service
image:
  repository: postgres
  tag: 16-alpine
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 5432
persistence:
  enabled: true
  storageClass: ""
  size: 5Gi # меньше для dev
  accessMode: ReadWriteOnce
resources:
  limits:
    cpu: 250m
    memory: 256Mi
  requests:
    cpu: 50m
    memory: 128Mi
database:
  name: my_service_db
  user: my_service_user
```

#### Production

```yaml
# ... то же самое, но с большими ресурсами
persistence:
  size: 20Gi # больше для prod
resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 512Mi
```

### Проверка

После деплоя проверьте:

```bash
# 1. PostgreSQL запущен
kubectl get pods -l app.kubernetes.io/name=postgresql-my-service

# 2. Подключение работает
kubectl exec -it postgresql-my-service-0 -- psql -U my_service_user -d my_service_db -c "SELECT version();"

# 3. Таблицы созданы
kubectl exec -it postgresql-my-service-0 -- psql -U my_service_user -d my_service_db -c "\dt"

# 4. Сервис подключается к БД
kubectl logs -l app.kubernetes.io/name=my-service --tail=50
```

### Backup и Restore

```bash
# Backup
kubectl exec postgresql-my-service-0 -- pg_dump -U my_service_user my_service_db > backup.sql

# Restore
kubectl exec -i postgresql-my-service-0 -- psql -U my_service_user my_service_db < backup.sql
```

### Troubleshooting

#### Сервис не может подключиться к БД

1. Проверьте, что PostgreSQL запущен:

   ```bash
   kubectl get pods -l app.kubernetes.io/name=postgresql-my-service
   ```

2. Проверьте переменные окружения:

   ```bash
   kubectl exec -it <service-pod> -- env | grep DB_
   ```

3. Проверьте service:
   ```bash
   kubectl get svc postgresql-my-service
   kubectl describe svc postgresql-my-service
   ```

#### Миграции не применяются

1. Проверьте путь к data-source.ts в package.json
2. Убедитесь, что entities правильно импортированы
3. Проверьте, что synchronize: false в production

#### Генератор не создает файлы

1. Проверьте синтаксис в services.yaml
2. Убедитесь, что `database.enabled: true`
3. Запустите с verbose логами:
   ```bash
   tsx infra/generate/index.ts
   ```

## Примеры для разных сценариев

### Микросервисная архитектура

Для каждого микросервиса своя БД:

```yaml
services:
  nest:
    - name: users-service
      database:
        enabled: true
        name: users_db
        user: users_user

    - name: orders-service
      database:
        enabled: true
        name: orders_db
        user: orders_user

    - name: payments-service
      database:
        enabled: true
        name: payments_db
        user: payments_user
```

### Shared Database

Несколько сервисов используют одну БД:

```yaml
services:
  nest:
    - name: api-service
      database:
        enabled: true
        name: shared_db
        user: shared_user

    - name: worker-service
      database:
        enabled: false # использует БД от api-service
```

В `worker-service/service.yaml`:

```yaml
env:
  DB_HOST: "postgresql-api-service" # используем БД от api-service
  DB_NAME: "shared_db"
  DB_USER: "shared_user"
```

## Дополнительные ресурсы

- [PostgreSQL Helm Chart](../helmcharts/postgresql/README.md)
- [Database Setup Guide](./database-setup.md)
- [Generator Documentation](../infra/generate/generate-database-values/README.md)
- [TypeORM Documentation](https://typeorm.io/)
