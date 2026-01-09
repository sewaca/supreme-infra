# @supreme-int/design-system

Общая дизайн-система для всех Next.js сервисов в Supreme-Infra монорепозитории.

## Описание

Пакет содержит:

- **theme.css** - CSS переменные для цветов, отступов, шрифтов и других дизайн-токенов
- **font.css** - Подключение кастомных шрифтов (YS Text)

## Использование

### В Next.js приложениях

Импортируйте стили в корневом `app/layout.tsx`:

```tsx
import "@supreme-int/design-system/font.css";
import "@supreme-int/design-system/theme.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My App" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
```

## CSS Переменные

### Цвета

```css
--color-primary: #f5841f;
--color-primary-hover: #e65f00;
--color-secondary: #5d7e8b;
--color-success: #67bd45;
--color-error: #ed1556;
--color-text-primary: #000000;
--color-background: #ffffff;
/* и многие другие... */
```

### Отступы

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

### Шрифты

```css
--font-family-primary: "Fira Sans", -apple-system, ...;
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-md: 16px;
--font-size-lg: 18px;
/* и т.д. */
```

### Радиусы скругления

```css
--border-radius-sm: 4px;
--border-radius-md: 8px;
--border-radius-lg: 12px;
--border-radius-xl: 16px;
--border-radius-full: 9999px;
```

### Переходы

```css
--transition-fast: 150ms ease-in-out;
--transition-normal: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
```

## Пример использования в компонентах

```css
.button {
  padding: var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-md);
  transition: background var(--transition-fast);
}

.button:hover {
  background: var(--color-primary-hover);
}
```

## Разработка

Этот пакет содержит только CSS файлы и не требует сборки.

## Лицензия

ISC
