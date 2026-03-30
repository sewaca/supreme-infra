# Базы данных в supreme-infra

Единая документация по PostgreSQL в кластере: объявление БД в репозитории, `init.sql`, SQL-миграции через Helm, генерация values и ручной деплой через GitHub Actions.

## Обзор

1. **Первичная схема и seed** — файл `infra/databases/{service}-db/init.sql`. Выполняется **один раз** при первом старте PostgreSQL (пустой том данных).
2. **Изменения после создания БД** — файлы `infra/databases/{service}-db/migrations/*.sql`. На каждый `helm upgrade` chart создаёт Job с hook `post-upgrade` и последовательно применяет все `*.sql` в алфавитном порядке.
3. **Приложения** в Kubernetes подключаются к БД через **PgBouncer** (`DB_HOST: pgbouncer-{service}` в `services/{service}/service.yaml` и сгенерированных overrides). Сам PostgreSQL в кластере — release `postgresql-{service}` (прямое подключение обычно для админки и отладки).

Инфраструктурный слой **не использует** TypeORM `data-source.ts` в `infra/databases`: схема и миграции для кластера — это **SQL**. В коде сервисов (например, FastAPI) используются свои ORM (SQLAlchemy и т.д.), согласованные с этими таблицами.

## Структура каталогов

```text
infra/
├── databases/
│   └── {service}-db/           # имя папки = имя сервиса из services.yaml + суффикс -db
│       ├── init.sql            # опционально, первый запуск
│       ├── service.yaml        # опционально: ресурсы, overrides для chart
│       └── migrations/         # опционально, SQL для helm upgrade
│           ├── 001_something.sql
│           └── ...
├── helmcharts/postgresql/      # общий chart
└── overrides/
    ├── development/
    │   └── postgresql-{service}.yaml   # генерируется, не править вручную
    └── production/
        └── postgresql-{service}.yaml
```

Корневой файл **`services.yaml`** перечисляет сервисы (`nest`, `next`, `fastapi`) и для кого включена БД.

## Конфигурация в `services.yaml`

Для сервиса с БД задаётся блок `database`:

```yaml
services:
  fastapi:
    - name: core-auth
      description: ...
      database:
        enabled: true
        name: core_auth_db      # опционально; иначе шаблон: дефисы → подчёркивания + _db
        user: core_auth_user    # опционально; иначе аналогично + _user
        passwordSecret: DB_PASSWORD   # имя GitHub Secret с паролем (см. использование в CD)
```

Проверка в коде генератора: `database.enabled`, имя и пользователь подставляются в Helm values. Сервисы с БД могут жить в любой из веток `nest` / `next` / `fastapi` — генератор объединяет все списки.

## `infra/databases/{service}-db/service.yaml`

Необязательный файл: лимиты/запросы ресурсов, `persistence`, `image`, `service`, а также `overrides.development` / `overrides.production` для точечной подстройки values chart’а. Поля `database.name` / `database.user` здесь дублируют контракт с `services.yaml` (см. примеры в `infra/databases/core-auth-db/service.yaml`).

## Init-скрипты (`init.sql`)

- Кладутся в `infra/databases/{service}-db/init.sql`.
- После `pnpm run generate` содержимое попадает в поле `initScript` сгенерированного `infra/overrides/{env}/postgresql-{service}.yaml` и монтируется chart’ом в `/docker-entrypoint-initdb.d/` (см. `infra/helmcharts/postgresql/templates/init-configmap.yaml`).
- Выполняются **только при пустом data directory**. Повторный прогон того же release с тем же PVC **не** переигрывает init.
- Пишите **идемпотентно**: `ON CONFLICT DO NOTHING`, `IF NOT EXISTS`, и т.д.

Несколько файлов в одной БД: официальный образ Postgres грузит скрипты из каталога в **лексикографическом** порядке; в текущем chart’е в ConfigMap попадает один сгенерированный `init.sql`. Дополнительные произвольные имена файлов без доработки chart не поддерживаются — при необходимости объединяйте логику в одном `init.sql` или расширяйте chart.

## Миграции (`migrations/*.sql`)

- Файлы: только расширение `.sql`, порядок — **сортировка по имени** (префикс `001_`, `002_`, …).
- Генератор встраивает их в values как словарь `migrations: { "001_foo.sql": "..." }`; chart собирает ConfigMap и Job (см. `infra/helmcharts/postgresql/templates/migration-job.yaml`).
- Hook: `helm.sh/hook: post-upgrade` — Job создаётся и выполняется при **`helm upgrade`**, а **не** при первом **`helm install`** (так устроен Helm). После первой установки release либо положитесь на полную схему в `init.sql`, либо выполните **`helm upgrade`** тем же chart и values, чтобы применить файлы из `migrations/`. Workflow **Deploy Database** при действии **upgrade** на несуществующем release делает **install** — в этом случае миграции из `migrations/` применятся только при **следующем** запуске **upgrade**.
- Миграции должны быть **идемпотентными** — Job может пересоздаваться; повторный прогон того же SQL не должен ломать БД.

### Логи миграций (в кластере)

У pod’ов Job label вида `app: postgresql-{service}-migration` (полное имя release — `postgresql-{service}`). Namespace в проекте для деплоя БД через workflow — **`default`** (не `supreme-infra`).

Пример (подставьте свой сервис и при необходимости namespace):

```bash
kubectl logs -n default -l app=postgresql-core-auth-migration --tail=100
```

### Отключить миграции (аварийно)

В values chart’а есть флаг `skipMigrations: true` (`infra/helmcharts/postgresql/values.yaml`). Использовать только осознанно.

## Генерация (`pnpm run generate`)

Из корня репозитория:

```bash
pnpm run generate
```

Среди прочего выполняется:

- **`update-database-workflow`** — в `.github/workflows/deploy-database.yml` обновляется список сервисов в input `service` (все с `database.enabled: true`).
- **`generate-database-values`** — для каждого такого сервиса пересоздаются `infra/overrides/development/postgresql-{service}.yaml` и `infra/overrides/production/postgresql-{service}.yaml` из:

  - базовых defaults chart’а;
  - `overrides` окружения в `infra/helmcharts/postgresql/values.yaml`;
  - `infra/databases/{service}-db/service.yaml` (если есть);
  - содержимого `init.sql` и всех `migrations/*.sql`.

Сгенерированные файлы помечены комментарием, что их **не редактируют вручную** — правки вносят в источники выше и снова запускают generate.

Подробности реализации: `infra/generate/generate-database-values/generate-database-values.ts`, описание: `infra/generate/generate-database-values/README.md`.

## Деплой PostgreSQL: workflow `Deploy Database`

Файл: `.github/workflows/deploy-database.yml`.

### Запуск

**Actions → Deploy Database → Run workflow.**

Параметры:

- **`service`** — один из сервисов с `database.enabled: true` (список синхронизируется `pnpm run generate`).
- **`action`**:
  - **`install`** — `helm install`, только если release ещё **нет**; иначе ошибка намеренно не дублируется в этом шаге (см. логику job).
  - **`upgrade`** — если release есть: `helm upgrade`; если нет: **install** с теми же values.
  - **`uninstall`** — `helm uninstall`; PVC **может остаться** — в логе workflow явно подсказана команда удаления PVC.

### Важные детали окружения

- Используются **только** файлы **`infra/overrides/production/postgresql-{service}.yaml`** (development-файлы workflow **не** подставляет).
- Namespace: **`default`**.
- Пароль: secret **`DB_PASSWORD`** (и при необходимости другие секреты Yandex Cloud / kubeconfig через job `setup-yandex-cloud`).

### Проверка после install/upgrade

Workflow ждёт готовность pod и выполняет `psql -c "SELECT version();"`. Имена release и pod: `postgresql-{service}`, pod обычно `postgresql-{service}-0`.

### Замечание про подсказку в workflow

В job «Post-deployment» встречается текст про `pnpm run migration:run` в каталоге сервиса — это **не** отражает единый механизм миграций в этом репозитории. Для инфраструктуры источник правды — **SQL в `infra/databases/...` и `helm upgrade`**.

## Подключение приложений (env)

В манифестах сервисов задаются переменные окружения, согласованные с именем БД и пользователем из `services.yaml`. Хост в кластере — **PgBouncer**:

```yaml
env:
  DB_HOST: "pgbouncer-core-auth"
  DB_PORT: "5432"
  DB_NAME: "core_auth_db"
  DB_USER: "core_auth_user"
  # DB_PASSWORD — из секретов при деплое приложения
```

Пароль тот же, что передаётся в PostgreSQL chart (`DB_PASSWORD`), если иначе не задумано отдельной политикой секретов.

## Добавление новой БД для сервиса

1. Добавьте сервис в **`services.yaml`** с `database.enabled: true` и при необходимости `name`, `user`, `passwordSecret`.
2. Создайте каталог **`infra/databases/{service}-db/`**, при необходимости:
   - `init.sql`;
   - `migrations/*.sql`;
   - `service.yaml` для ресурсов/overrides.
3. В **`services/{service}/service.yaml`** пропишите `DB_*` и `DB_HOST: pgbouncer-{service}` (по аналогии с существующими сервисами).
4. Выполните **`pnpm run generate`** и закоммитьте изменения (включая обновлённые overrides и workflow).
5. Настройте секреты в GitHub (как минимум **`DB_PASSWORD`**, плюс учётные данные Yandex Cloud для workflow).
6. Запустите **Deploy Database** для нового сервиса (обычно сначала `install` или `upgrade` в зависимости от того, есть ли уже release).
7. Задеплойте **PostgreSQL** и **PgBouncer** для этого сервиса согласно общему CD/процессу репозитория (отдельные chart’ы и workflow для PgBouncer не описаны в этом файле — см. `infra/generate/generate-pgbouncer-values` и соответствующие workflows).

### Несколько сервисов на одну БД

Если только один сервис «владеет» chart’ом PostgreSQL (`database.enabled: true`), остальные могут указывать тот же `DB_HOST` / `DB_NAME` / `DB_USER`, но отдельный Helm release для той же БД не создаётся. Такой сценарий требует дисциплины в миграциях и правах.

## Локальная разработка

Общий репозиторий не обязывает единый `docker-compose` для каждой БД. Типичный подход — поднять Postgres локально с теми же `DB_NAME` / `DB_USER`, что в `services.yaml`, и прогонять приложение с `DB_HOST=localhost`. SQL из `init.sql` / `migrations` можно применять вручную через `psql`.

## Бэкап и восстановление (справочно)

Команды выполняются в вашем окружении с доступом к кластеру (подставьте namespace, release и учётные данные):

```bash
kubectl exec -n default postgresql-core-auth-0 -- pg_dump -U core_auth_user core_auth_db > backup.sql
kubectl exec -i -n default postgresql-core-auth-0 -- psql -U core_auth_user core_auth_db < backup.sql
```

## Устранение неполадок

| Симптом | Что проверить |
|--------|----------------|
| Workflow: service does not have database enabled | В `services.yaml` у выбранного имени должно быть `database.enabled: true`, затем снова `pnpm run generate`. |
| Values file not found | Не запускали generate после добавления сервиса; должен появиться `infra/overrides/production/postgresql-{service}.yaml`. |
| Install при уже существующем release | Использовать `upgrade` или удалить release осознанно. |
| Init не применился | Данные уже в PVC — init не повторяется; нужна миграция SQL или пересоздание PVC (только dev / с бэкапом). |
| Миграция падает во второй раз | Сделать скрипт идемпотентным (`IF NOT EXISTS`, `ON CONFLICT`, и т.д.). |

## Ссылки

- `infra/helmcharts/postgresql/README.md` — chart PostgreSQL (init, migrations, values).
- `infra/generate/generate-database-values/README.md` — генератор database values.
- `docs/secrets-management.md` — работа с секретами.
