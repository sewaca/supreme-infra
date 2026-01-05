# Руководство по системе авторизации

## Обзор

Реализована полноценная система авторизации с использованием JWT токенов.

## Backend (NestJS)

### Структура

```
src/features/Auth/
├── Auth.module.ts          # Модуль авторизации
├── Auth.service.ts         # Сервис с бизнес-логикой
├── Auth.controller.ts      # Контроллер с эндпоинтами
├── Users.service.ts        # Сервис управления пользователями (in-memory)
├── strategies/
│   └── jwt.strategy.ts     # Passport JWT стратегия
└── guards/
    └── jwt-auth.guard.ts   # Guard для защиты роутов
```

### API Endpoints

#### POST /auth/register

Регистрация нового пользователя

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

Response:

```json
{
  "accessToken": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST /auth/login

Вход пользователя

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response: аналогичен register

#### GET /auth/me

Получение информации о текущем пользователе (требует авторизации)

Headers:

```
Authorization: Bearer <jwt_token>
```

Response:

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Защита роутов

Используйте `@UseGuards(JwtAuthGuard)` для защиты эндпоинтов:

```typescript
@Get('protected')
@UseGuards(JwtAuthGuard)
async protectedRoute(@Request() req) {
  return req.user; // { id, email, name }
}
```

## Frontend (Next.js)

### Структура

```
src/
├── shared/
│   ├── lib/
│   │   └── auth.ts              # Хелперы для работы с авторизацией
│   └── api/
│       └── authApi.ts           # API клиент для авторизации
├── widgets/
│   ├── Header/                  # Навигация с учетом авторизации
│   └── AuthForm/                # Форма входа/регистрации
└── views/
    └── ProfilePage/             # Страница профиля пользователя

app/
├── login/page.tsx               # Страница входа
├── register/page.tsx            # Страница регистрации
└── profile/page.tsx             # Страница профиля (защищена)
```

### Хелперы авторизации (RSC)

#### Server-side (React Server Components)

```typescript
import { getUser, getAuthToken } from '@/shared/lib/auth';

// Получить текущего пользователя
const user = await getUser(); // User | null

// Получить токен
const token = await getAuthToken(); // string | undefined

// Пример использования
export default async function ProtectedPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <div>Hello, {user.name}!</div>;
}
```

#### Client-side

```typescript
'use client';

import { setAuthToken, removeAuthToken, getAuthTokenClient } from '@/shared/lib/auth';

// Сохранить токен после логина
setAuthToken(response.accessToken);

// Удалить токен при выходе
removeAuthToken();

// Получить токен на клиенте
const token = getAuthTokenClient();
```

### API клиент

```typescript
import { login, register } from '@/shared/api/authApi';

// Регистрация
const response = await register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
});

// Вход
const response = await login({
  email: 'user@example.com',
  password: 'password123',
});

// Сохранить токен
setAuthToken(response.accessToken);
```

### Защита страниц

```typescript
import { redirect } from 'next/navigation';
import { getUser } from '@/shared/lib/auth';

export default async function ProtectedPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <YourComponent user={user} />;
}
```

### Навигация

Компонент `Header` автоматически показывает:

- Кнопки "Войти" и "Регистрация" для неавторизованных
- Имя пользователя и кнопку "Профиль" для авторизованных

## Безопасность

1. **JWT Secret**: Установите переменную окружения `JWT_SECRET` в production
2. **HTTPS**: Используйте HTTPS в production для безопасной передачи токенов
3. **Хеширование паролей**: Используется bcrypt с 10 раундами
4. **Время жизни токена**: 7 дней (настраивается в Auth.module.ts)
5. **Cookies**: Токен хранится в secure cookies в production

## Переменные окружения

### Backend

```env
JWT_SECRET=your-secret-key-change-in-production
PORT=4000
```

### Frontend

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

## Тестовый пользователь

Email: `user@example.com`
Password: `password` (хеш уже в базе)

## Расширение

### Добавление полей к пользователю

1. Обновите интерфейс `User` в `Users.service.ts`
2. Обновите `JwtPayload` в `Auth.service.ts`
3. Обновите интерфейс `User` в frontend `auth.ts`

### Подключение базы данных

Замените in-memory хранилище в `Users.service.ts` на TypeORM/Prisma/другую ORM.
