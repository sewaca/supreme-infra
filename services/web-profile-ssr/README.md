# web-profile-ssr

All user profile data.

## Pages (features)

1. /profile
2. /profile/dormitory
3. /profile/rating
4. /profile/references
5. /profile/settings
6. /profile/data
7. /profile/subjects-ranking
8. /profile/orders?orderId=xxx&ordersType=xxx

```
TODO:
  x. /profile/gradebook
  x. /profile/student-id
  x. /profile/scholarship
  x. Извлекать user_id из JWT (сейчас хардкод DEV_USER_ID)
  x. Каталог предметов (subjects-ranking) — перенести на бэкенд (сейчас статика на фронте)
  x. Справки: pickupPointIdsByType — перенести на бэкенд (сейчас статика)
```

## Backend Dependencies

All pages fetch data from real backend services:

- **core-client-info** (port 8000) — профиль, личные данные, рейтинг, достижения, настройки, дисциплины по выбору
- **core-applications** (port 8001) — приказы, справки, общежитие, стипендия

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

The application will start on http://localhost:3005

### 3. Access Application

- Homepage: http://localhost:3005
- Health check: http://localhost:3005/api/status
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

| Variable                  | Description                      | Default                                 |
| ------------------------- | -------------------------------- | --------------------------------------- |
| PORT                      | Server port                      | 3005                                    |
| NODE_ENV                  | Environment                      | development                             |
| BACKEND_SERVICE_NAMESPACE | Kubernetes namespace for backend | default                                 |
| CORE_APPLICATIONS_URL     | URL сервиса core-applications    | http://localhost:8001/core-applications |
| CORE_CLIENT_INFO_URL      | URL сервиса core-client-info     | http://localhost:8000/core-client-info  |
| JWT_SECRET                | Секрет для валидации JWT         | local-development-secret                |

## Project Structure

```
app/
├── layout.tsx          # Root layout
├── page.tsx            # Homepage
└── api/
    └── status/
        └── route.ts    # Health check endpoint

src/
├── components/         # Reusable components
├── shared/            # Shared utilities
└── views/             # Page views
```

## SVG Icons

You can import SVG files as React components:

```tsx
import MyIcon from "./path/to/icon.svg";

function MyComponent() {
  return <MyIcon width={24} height={24} className="icon" />;
}
```

SVG components accept all standard SVG props (width, height, className, fill, stroke, etc.).

## License

ISC
