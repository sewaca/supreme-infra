# PostCSS + dvh Fallback — Итоги миграции

## Контекст

Задача: добавить автоматический фоллбэк `dvh → vh` во всех Next.js сервисах, чтобы старые браузеры (Safari ≤ 15, iOS Safari ≤ 15) получали `100vh` вместо неподдерживаемого `100dvh`.

---

## Что сделано

### 1. PostCSS-плагины во всех Next.js сервисах

Добавлены в `dependencies` (не `devDependencies` — Dockerfile использует `pnpm install --prod`):

```json
"postcss": "catalog:",
"postcss-flexbugs-fixes": "catalog:",
"postcss-preset-env": "catalog:"
```

Каталог версий в `pnpm-workspace.yaml`:

```yaml
postcss: 8.5.8
postcss-flexbugs-fixes: 5.0.2
postcss-preset-env: 11.2.0
```

### 2. `postcss.config.js` во всех сервисах

Формат — array (не object), CommonJS `module.exports`. Object-формат не работает с inline-плагинами: `postcss-load-config` пытается `require()` по имени ключа.

```js
// services/{frontend,web-auth-ssr,web-profile-ssr,web-documents-ssr}/postcss.config.js
module.exports = {
  plugins: [
    "postcss-flexbugs-fixes",
    [
      "postcss-preset-env",
      {
        stage: 1,
        features: {
          "custom-properties": false,
          "custom-media-queries": true,
          "nesting-rules": true,
        },
        autoprefixer: { flexbox: "no-2009" },
      },
    ],
    require("@supreme-int/nextjs-shared/postcss-dvh-fallback"),
  ],
};
```

### 3. `packages/nextjs-shared/postcss-dvh-fallback.js`

Кастомный PostCSS-плагин для `dvh → @supports` трансформации.

---

## Почему не сработали другие подходы

### `postcss-viewport-unit-fallback` — не работает

Плагин добавляет каскадный фоллбэк:

```css
.rule {
  min-height: 100vh;
  min-height: 100dvh;
}
```

Turbopack использует **Lightning CSS** для обработки CSS. Lightning CSS считает два значения одного свойства дубликатом и оставляет только последнее:

```css
.rule {
  min-height: 100dvh;
} /* 100vh удалён */
```

Это НЕ минификация — происходит даже с `minify: false`.

### `browserslist` — не работает

Lightning CSS умеет добавлять фоллбэки для цветов, селекторов и т.д. на основе таргетов браузеров — **но не для `dvh`**. Прямой тест:

```js
transform({ code: ".p{min-height:100dvh}", targets: { safari: 983040 }, minify: true });
// → .p{min-height:100dvh}  (без vh-фоллбэка)
```

Lightning CSS просто пропускает `dvh` как валидную единицу CSS без транспиляции.

### `@supports` — работает ✓

Lightning CSS сохраняет объявления в разных скоупах:

```css
.rule {
  min-height: 100vh;
} /* фоллбэк */
@supports (height: 1dvh) {
  .rule {
    min-height: 100dvh;
  }
} /* современные */
```

---

## Как работает плагин

`packages/nextjs-shared/postcss-dvh-fallback.js`:

1. `walkDecls` — ищет все объявления с `dvh`/`svh`/`lvh`
2. Заменяет значение на `vh`/`vw` (фоллбэк остаётся в исходном правиле)
3. Создаёт `@supports (height: 1dvh)` с клонированным селектором и оригинальным `dvh`-значением
4. Вставляет `@supports` сразу после исходного правила

**Вход:**

```css
.page {
  min-height: 100dvh;
}
```

**Выход (после PostCSS → Lightning CSS):**

```css
.StudentIdBook-module__abc__page { min-height: 100vh; ... }
@supports (height:1dvh) { .StudentIdBook-module__abc__page { min-height: 100dvh } }
```

---

## Затронутые файлы

| Файл                                                                   | Изменение                                                                     |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm-workspace.yaml`                                                  | добавлены `postcss`, `postcss-flexbugs-fixes`, `postcss-preset-env` в каталог |
| `services/{4 сервиса}/package.json`                                    | добавлены PostCSS-пакеты в `dependencies`                                     |
| `services/{4 сервиса}/postcss.config.js`                               | переписан в array-формате + плагин dvh-fallback                               |
| `packages/nextjs-shared/postcss-dvh-fallback.js`                       | новый файл — кастомный PostCSS-плагин                                         |
| `infra/generate/generate-service/templates/next/postcss.config.js.hbs` | обновлён шаблон                                                               |
| `infra/generate/generate-service/templates/next/package.json.hbs`      | добавлены PostCSS-зависимости                                                 |
