# auth-ssr

Сервис авторизации и управления пользователями на базе Next.js 15 с SSR.

## Features

- Next.js 15 with App Router
- Server-side rendering (SSR)
- Авторизация и регистрация пользователей
- Управление профилями пользователей
- OpenTelemetry instrumentation
- Prometheus metrics
- TypeScript

## Prerequisites

- Node.js 22+
- pnpm 9+

## Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run Development Server

```bash
pnpm run dev
```

The application will start on http://localhost:3002

### 3. Access Application

- Homepage: http://localhost:3002
- Health check: http://localhost:3002/api/status
- Metrics: http://localhost:9464/metrics

## Testing

```bash
# Run unit tests
pnpm run unit --verbose

# Run tests in watch mode
pnpm run unit:watch

# Run tests with coverage
pnpm run unit:coverage
```

## Building

```bash
# Build for production
pnpm run build

# Run production build
pnpm run start
```

## Environment Variables

| Variable                  | Description                      | Default     |
| ------------------------- | -------------------------------- | ----------- |
| PORT                      | Server port                      | 3002        |
| NODE_ENV                  | Environment                      | development |
| BACKEND_SERVICE_NAMESPACE | Kubernetes namespace for backend | default     |

## Project Structure

```
app/
├── layout.tsx          # Root layout with theme
├── page.tsx            # Homepage
├── login/              # Страница входа
├── register/           # Страница регистрации
├── profile/            # Профиль пользователя
│   └── [id]/          # Просмотр профиля по ID
├── theme.css          # CSS переменные и стили
├── font.css           # Шрифты
└── api/
    └── status/
        └── route.ts    # Health check endpoint

src/
├── widgets/           # Виджеты (AuthForm)
├── views/             # Страницы (ProfilePage)
└── shared/
    ├── api/           # API клиенты
    └── lib/           # Утилиты (auth.client, auth.server)
```

## Routes

- `/` - Главная страница сервиса
- `/login` - Вход в систему
- `/register` - Регистрация нового пользователя
- `/profile` - Профиль текущего пользователя
- `/profile/[id]` - Просмотр профиля пользователя по ID
- `/api/status` - Health check endpoint

## License

ISC
