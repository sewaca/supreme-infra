# Настройка IDE для Python

## Проблема: "Import could not be resolved"

Если вы видите предупреждения типа `Import "sqlalchemy.orm" could not be resolved`, это значит, что IDE не знает, где находятся установленные пакеты.

## Решение

### Вариант 1: Выбрать Python Interpreter в IDE

#### В Cursor/VS Code:

1. Откройте любой Python-файл
2. Нажмите `Cmd+Shift+P` (macOS) или `Ctrl+Shift+P` (Windows/Linux)
3. Введите "Python: Select Interpreter"
4. Выберите интерпретатор из `.venv` нужного сервиса:
   - Для `core-applications`: `./services/core-applications/.venv/bin/python`
   - Для `core-client-info`: `./services/core-client-info/.venv/bin/python`

### Вариант 2: Использовать Multi-Root Workspace (Рекомендуется)

Для монорепозитория с несколькими Python-сервисами лучше использовать workspace:

1. Откройте файл `supreme-infra.code-workspace` в Cursor/VS Code
2. Или через меню: File → Open Workspace from File → выберите `supreme-infra.code-workspace`

Это автоматически настроит правильные интерпретаторы для каждого сервиса.

### Вариант 3: Установить расширение Ruff

Установите расширение Ruff для VS Code/Cursor:

```bash
code --install-extension charliermarsh.ruff
```

Или через UI: Extensions → поиск "Ruff" → Install

## Проверка настройки

После настройки проверьте, что всё работает:

1. Откройте файл `services/core-applications/app/main.py`
2. Наведите курсор на `from sqlalchemy.orm import ...`
3. Предупреждение должно исчезнуть

## Файлы конфигурации

Созданные файлы конфигурации:

- `.vscode/settings.json` - настройки для VS Code/Cursor
- `pyrightconfig.json` - конфигурация type checker
- `supreme-infra.code-workspace` - multi-root workspace

## Структура виртуальных окружений

```
supreme-infra/
├── services/
│   ├── core-applications/
│   │   ├── .venv/          # Виртуальное окружение для этого сервиса
│   │   ├── pyproject.toml
│   │   └── app/
│   └── core-client-info/
│       ├── .venv/          # Виртуальное окружение для этого сервиса
│       ├── pyproject.toml
│       └── app/
└── pyproject.toml          # Корневой файл для ruff и других инструментов
```

## Установка зависимостей

Если зависимости не установлены, установите их через `uv`:

```bash
# Для core-applications
cd services/core-applications
uv sync

# Для core-client-info
cd services/core-client-info
uv sync
```

## Troubleshooting

### Проблема: IDE всё ещё показывает ошибки

**Решение:**

1. Перезагрузите окно IDE: `Cmd+Shift+P` → "Developer: Reload Window"
2. Убедитесь, что выбран правильный интерпретатор (см. в статус-баре внизу)
3. Проверьте, что зависимости установлены: `cd services/core-applications && .venv/bin/python -c "import sqlalchemy"`

### Проблема: Разные ошибки в разных сервисах

**Решение:**
Используйте multi-root workspace (`supreme-infra.code-workspace`), который автоматически настраивает правильные интерпретаторы для каждого сервиса.

### Проблема: Pyright не видит типы

**Решение:**
Убедитесь, что `pyrightconfig.json` находится в корне проекта и содержит правильные пути к сервисам.

## Дополнительные настройки

### Автоформатирование при сохранении

В `.vscode/settings.json` уже настроено:

```json
{
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll": "explicit",
      "source.organizeImports": "explicit"
    }
  }
}
```

### Исключение файлов из поиска

Добавлено в настройки:

```json
{
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/.pytest_cache": true,
    "**/.ruff_cache": true
  }
}
```

## Полезные команды

```bash
# Проверить текущий интерпретатор
which python

# Проверить установленные пакеты
pip list

# Переустановить зависимости
uv sync --reinstall

# Обновить зависимости
uv sync --upgrade
```
