# Быстрое исправление: "Import could not be resolved"

## 🚀 Решение за 30 секунд

### Шаг 1: Выберите Python Interpreter

1. Откройте любой Python-файл (например, `services/core-applications/app/main.py`)
2. Нажмите **Cmd+Shift+P** (macOS) или **Ctrl+Shift+P** (Windows)
3. Введите: `Python: Select Interpreter`
4. Выберите: `./services/core-applications/.venv/bin/python`

### Шаг 2: Перезагрузите окно

1. Нажмите **Cmd+Shift+P** (macOS) или **Ctrl+Shift+P** (Windows)
2. Введите: `Developer: Reload Window`

✅ **Готово!** Предупреждения должны исчезнуть.

---

## 🎯 Альтернатива: Multi-Root Workspace (для работы с несколькими сервисами)

1. Закройте текущую папку
2. File → Open Workspace from File
3. Выберите: `supreme-infra.code-workspace`

Это автоматически настроит правильные интерпретаторы для каждого сервиса.

---

## 🔧 Если не помогло

### Проверьте, что зависимости установлены:

```bash
cd services/core-applications
uv sync
```

### Проверьте, что SQLAlchemy установлен:

```bash
cd services/core-applications
.venv/bin/python -c "import sqlalchemy; print('OK')"
```

Если выдаёт ошибку, установите зависимости:

```bash
uv sync --reinstall
```

---

## 📚 Подробная документация

См. [PYTHON_IDE_SETUP.md](./PYTHON_IDE_SETUP.md) для полной инструкции.
