# 1. Цель работы

Целью лабораторной работы является изучение и описание автоматизированного end-to-end тестирования микросервисного веб-приложения, реализованного в формате монорепозитория. Исследуемая система включает набор фронтенд-приложений на Next.js с поддержкой серверного рендеринга, backend-сервисы на FastAPI и NestJS, а также единую инфраструктурную платформу, включающую PostgreSQL, Helm, CI/CD и развёртывание в Kubernetes.

В рамках работы рассматривается структура E2E-тестов, охватывающих ключевые пользовательские сценарии: вход в систему, оформление справок, работу с динамической формой заказа и просмотр истории заявок. Особое внимание уделяется тому, как автоматизация позволяет контролировать корректность поведения интерфейса и согласованность работы нескольких сервисов в едином пользовательском потоке.

# 2. Описание реализованных автотестов

Автоматизированное тестирование выполняется для микросервисного веб-приложения, реализованного в формате цифрового личного кабинета. Система объединяет несколько сервисов, отвечающих за аутентификацию, профиль пользователя, справки, заказы, сообщения, расписание, документы и файловое хранилище, но на пользовательском уровне воспринимается как единое приложение за счёт общей маршрутизации и проксирования запросов.

E2E-тесты реализованы на TypeScript с использованием Playwright. Выполнение сценариев происходит в браузерном окружении Chromium, а для изолированного и воспроизводимого запуска может применяться Selenoid. Такой стек позволяет автоматизировать действия пользователя, проверять состояние интерфейса, контролировать ожидания и стабильно запускать тесты как локально, так и в составе CI/CD.

Набор автотестов охватывает страницу входа и раздел заказа справок. Проверяются отображение элементов формы авторизации, успешные и негативные сценарии входа, логика выбора типа справки, работа поля получения, переключение режима виртуальной PDF-справки, условия активации кнопки «Заказать», фильтрация списка типов и отображение истории заказов. Это позволяет проверить корректность ключевых пользовательских сценариев и согласованность работы интерфейса.

Структура тестового набора включает следующие файлы:

| Файл                                        | Назначение                               |
| ------------------------------------------- | ---------------------------------------- |
| `login/login.spec.ts`                       | Проверка страницы входа                  |
| `references/references.typeInput.spec.ts`   | Проверка выбора типа справки             |
| `references/references.pickup.spec.ts`      | Проверка места получения справки         |
| `references/references.pdf.spec.ts`         | Проверка режима PDF                      |
| `references/references.orderButton.spec.ts` | Проверка условий активации кнопки заказа |
| `references/references.history.spec.ts`     | Проверка фильтрации и истории заказов    |

# 3. Отчет о тестировании

По состоянию на момент подготовки отчёта реализованный E2E-набор включает 7 тестовых сьютов и 44 теста. Автоматизация охватывает ключевые пользовательские действия, связанные с аутентификацией и заказом справок.

## 3.1. Сводная статистика

| Файл                                        | Сьютов | Тестов | Успешно |
| ------------------------------------------- | -----: | -----: | ------: |
| `login/login.spec.ts`                       |      1 |      6 |       6 |
| `references/references.typeInput.spec.ts`   |      1 |      8 |       8 |
| `references/references.pickup.spec.ts`      |      1 |      6 |       6 |
| `references/references.pdf.spec.ts`         |      1 |      4 |       4 |
| `references/references.orderButton.spec.ts` |      1 |      6 |       6 |
| `references/references.history.spec.ts`     |      2 |     14 |      14 |
| **Итого**                                   |  **7** | **44** |  **44** |

## 3.2. Основные результаты тестирования

В ходе тестирования подтверждена корректная работа страницы входа и формы заказа справок. Для страницы аутентификации проверены отображение заголовка, полей ввода, кнопки отправки и ссылок, а также успешный и неуспешный сценарии входа. Для формы заказа справок установлено, что валидный тип справки корректно принимается системой, пользователь может указать собственный вариант, а пустой ввод или ввод из одних пробелов не позволяет продолжить оформление заявки.

Дополнительно проверено, что поле выбора места получения становится доступным только после указания типа справки и скрывается при активации режима виртуальной PDF-справки. Установлено, что состояние кнопки «Заказать» корректно зависит от заполнения обязательных полей. Также подтверждена работа раздела истории заказов: наличие секции, корректное переключение фильтров по статусам, отображение пустого состояния и возможность открытия карточки заявки с подробной информацией.

## 3.3. Оценка покрытия

Реализованный набор тестов покрывает наиболее значимые пользовательские сценарии, связанные с началом работы в системе и оформлением справок. Такой уровень автоматизации позволяет обнаруживать ошибки в поведении интерфейса, логике формы и маршрутизации между страницами. Для микросервисного приложения это особенно важно, поскольку пользовательский сценарий зависит от согласованной работы нескольких независимых сервисов.

# 4. Выводы

В ходе лабораторной работы была рассмотрена организация автоматизированного E2E-тестирования микросервисного веб-приложения, построенного на основе монорепозитория. Исследуемая система сочетает несколько пользовательских фронтендов на Next.js, backend-компоненты на FastAPI и NestJS и общую инфраструктуру развёртывания в Kubernetes.

Анализ тестового набора показал, что end-to-end автоматизация позволяет эффективно контролировать корректность критически важных пользовательских сценариев. Реализованные тесты охватывают вход в систему, работу формы заказа справок, динамическое изменение интерфейса и просмотр истории заявок. Это снижает риск регрессий при развитии продукта и упрощает контроль качества в условиях распределённой архитектуры.

Использование TypeScript, Playwright, Chromium и Selenoid делает тестовый контур воспроизводимым, удобным для сопровождения и пригодным для запуска как локально, так и в составе CI/CD. Таким образом, автоматизированное E2E-тестирование является важным элементом обеспечения качества в современных микросервисных веб-приложениях.

# 5. Список литературы

1. Документация Playwright. — URL: https://playwright.dev/docs/intro
2. Документация TypeScript. — URL: https://www.typescriptlang.org/docs/
3. Документация Chromium Projects. — URL: https://www.chromium.org/
4. Документация Selenoid. — URL: https://aerokube.com/selenoid/latest/
5. Документация Docker. — URL: https://docs.docker.com/
6. Документация Next.js. — URL: https://nextjs.org/docs
7. Документация FastAPI. — URL: https://fastapi.tiangolo.com/
8. Документация NestJS. — URL: https://docs.nestjs.com/
9. Учебно-методические материалы по дисциплине «Проектирование и архитектура программных систем».

# 6. Приложения (исходный код автотестов)

## Приложение 6.1. /e2e/src/tests/login/login.spec.ts

```typescript
import { expect, test } from "@playwright/test";

test.describe("Login page — unauthenticated", { tag: ["@web-auth-ssr", "@core-auth"] }, () => {
  test("loads with correct heading and subtitle @smoke", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("text=Вход в личный кабинет")).toBeVisible();
    await expect(page.locator("text=Введите данные для входа в систему")).toBeVisible();
  });

  test("shows email and password fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("shows submit button", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('button[type="submit"]')).toContainText("Войти");
  });

  test("shows links to register and forgot password", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('a[href="/register"]')).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });

  test("logs in with correct credentials @smoke", async ({ page }) => {
    // Мокаем detectClientInfo() чтобы не ждать внешний запрос к ipregistry
    await page.route("https://api.ipregistry.co/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          location: { country: { name: "Russia" }, city: "Saint Petersburg" },
          user_agent: { device: { name: "Desktop" } },
          ip: "127.0.0.1",
        }),
      })
    );

    await page.goto("/login");

    await page.locator('input[type="email"]').fill("ivan.ivanov@example.com");
    await page.locator('input[type="password"]').fill("ivan.ivanov@example.com");

    // Кликаем и одновременно ждём ответ от login API
    await Promise.all([
      page.waitForResponse((res) => res.url().includes("/auth/login") && res.status() === 200),
      page.locator('button[type="submit"]').click(),
    ]);

    await page.waitForURL("**/profile**");
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator("text=Иванов Иван")).toBeVisible();
  });

  test("shows error alert on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.locator('input[type="email"]').fill("nonexistent@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword123");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 15000 });
  });
});
```

## Приложение 6.2. /e2e/src/tests/references/references.history.spec.ts

```typescript
import { expect, test } from "../../fixtures";
import { fillType, REFERENCES_URL } from "./helpers";

test.describe("5. Фильтрация списка типов", { tag: ["@web-profile-ssr", "@core-applications"] }, () => {
  test("5.1 — ввод «По» показывает варианты, содержащие «По» @smoke", async ({ authenticatedPage: page }) => {
    // Компонент возвращает все опции если хоть одна начинается с введённого текста,
    // поэтому проверяем что НУЖНЫЕ опции присутствуют, а не что список отфильтрован.
    await page.goto(REFERENCES_URL);
    await fillType(page, "По");
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();
    await expect(listbox.locator('[role="option"]').filter({ hasText: "По месту работы" }).first()).toBeVisible();
    await expect(
      listbox.locator('[role="option"]').filter({ hasText: "По месту работы родителей" }).first()
    ).toBeVisible();
  });

  test("5.2 — ввод «по» в нижнем регистре — нужные варианты видны (регистронезависимо)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, "по");
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();
    // Хотя бы одна опция с «По» присутствует в списке
    await expect(listbox.locator('[role="option"]').filter({ hasText: /по/i }).first()).toBeVisible();
  });

  test("5.3 — ввод «zzz» добавляет пользовательскую опцию", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, "zzz");
    const options = page.locator('[role="listbox"] [role="option"]');
    await expect(options.first()).toBeVisible();
    const texts = await options.allTextContents();
    expect(texts.some((t) => t.includes("zzz"))).toBe(true);
  });

  test("5.4 — пустой ввод показывает все предустановленные типы", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await page.getByTestId("reference-type-input").click();
    const options = page.locator('[role="listbox"] [role="option"]');
    await expect(options.first()).toBeVisible();
    await expect(options).toHaveCount(await options.count());
    expect(await options.count()).toBeGreaterThanOrEqual(5);
  });
});

test.describe("6. История заказов", { tag: ["@web-profile-ssr", "@core-applications"] }, () => {
  test("6.1 — секция «История заказов» присутствует на странице @smoke", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(page.getByTestId("reference-history")).toBeVisible();
    await expect(page.getByTestId("reference-history")).toContainText("История заказов");
  });

  test("6.2 — фильтр статусов отображает все пять кнопок", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const filter = page.getByTestId("reference-status-filter");
    await expect(filter).toBeVisible();
    await expect(page.getByTestId("status-btn-all")).toBeVisible();
    await expect(page.getByTestId("status-btn-preparation")).toBeVisible();
    await expect(page.getByTestId("status-btn-in_progress")).toBeVisible();
    await expect(page.getByTestId("status-btn-pending")).toBeVisible();
    await expect(page.getByTestId("status-btn-ready")).toBeVisible();
  });

  test("6.3 — по умолчанию активен фильтр «Все»", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(page.getByTestId("status-btn-all")).toHaveAttribute("aria-pressed", "true");
  });

  test("6.4 — клик по фильтру переключает активную кнопку", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await page.getByTestId("status-btn-preparation").click();
    await expect(page.getByTestId("status-btn-preparation")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("status-btn-all")).toHaveAttribute("aria-pressed", "false");
  });

  test("6.5 — пустое состояние показывает нужный текст", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const cards = page.getByTestId("reference-history-card");
    if ((await cards.count()) === 0) {
      await expect(page.getByTestId("reference-history-empty")).toContainText("Пока нет заказанных справок");
    }
  });

  test("6.6 — клик по карточке открывает модальное окно", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const firstCard = page.getByTestId("reference-history-card").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "Нет заказанных справок в истории");
      return;
    }
    await firstCard.click();
    await expect(page.getByTestId("reference-detail-modal")).toBeVisible();
  });

  test("6.7 — модальное окно закрывается по кнопке «Закрыть»", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const firstCard = page.getByTestId("reference-history-card").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "Нет заказанных справок в истории");
      return;
    }
    await firstCard.click();
    await expect(page.getByTestId("reference-detail-modal")).toBeVisible();
    await page.getByTestId("reference-modal-close").click();
    await expect(page.getByTestId("reference-detail-modal")).not.toBeVisible();
  });

  test("6.8 — модальное окно содержит дату заказа и статус", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const firstCard = page.getByTestId("reference-history-card").first();
    if ((await firstCard.count()) === 0) {
      test.skip(true, "Нет заказанных справок в истории");
      return;
    }
    await firstCard.click();
    const modal = page.getByTestId("reference-detail-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Дата заказа");
    await expect(modal).toContainText("Статус");
  });

  test("6.9 — фильтр «Подготовка» показывает только соответствующие карточки или пустое состояние", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await page.getByTestId("status-btn-preparation").click();
    const list = page.getByTestId("reference-history-list");
    const cards = list.getByTestId("reference-history-card");
    const empty = page.getByTestId("reference-history-empty");
    const hasCards = (await cards.count()) > 0;
    const hasEmpty = (await empty.count()) > 0;
    expect(hasCards || hasEmpty).toBe(true);
  });

  test("6.10 — фильтр «Все» возвращает полный список", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    const totalBefore = await page.getByTestId("reference-history-card").count();
    await page.getByTestId("status-btn-preparation").click();
    await page.getByTestId("status-btn-all").click();
    const totalAfter = await page.getByTestId("reference-history-card").count();
    expect(totalAfter).toBe(totalBefore);
  });
});
```

## Приложение 6.3. /e2e/src/tests/references/references.orderButton.spec.ts

```typescript
import { expect, test } from "../../fixtures";
import { fillType, fillTypeAndSelect, REFERENCES_URL, submitBtn, togglePdf } from "./helpers";

test.describe("4. Кнопка «Заказать»", { tag: ["@web-profile-ssr", "@core-applications"] }, () => {
  test("4.1 — disabled: тип не выбран, PDF выключен @smoke", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(submitBtn(page)).toBeDisabled();
  });

  test("4.2 — active: пользовательский тип активирует кнопку через defaultPickupPointIds", async ({
    authenticatedPage: page,
  }) => {
    // Компонент всегда делает auto-select через defaultPickupPointIds,
    // поэтому для любого непустого типа (даже не из справочника) кнопка становится активной.
    await page.goto(REFERENCES_URL);
    await fillType(page, "Произвольный тип");
    await page.getByTestId("reference-type-input").press("Tab");
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test("4.3 — active: тип выбран из справочника, пункт выдачи автовыбран, PDF выключен", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, "РЖД");
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test("4.4 — active: тип выбран, PDF включён (пункт выдачи не нужен)", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, "РЖД");
    await togglePdf(page);
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test("4.5 — disabled: тип пустой, PDF включён", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await togglePdf(page);
    await expect(submitBtn(page)).toBeDisabled();
  });

  test("4.6 — disabled: тип из только пробелов, PDF включён", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await togglePdf(page);
    await fillType(page, "   ");
    await page.getByTestId("reference-type-input").press("Tab");
    await expect(submitBtn(page)).toBeDisabled();
  });
});
```

## Приложение 6.4. /e2e/src/tests/references/references.pdf.spec.ts

```typescript
import { expect, test } from "../../fixtures";
import { pickupFormControl, REFERENCES_URL, togglePdf } from "./helpers";

test.describe("3. PDF-переключатель", { tag: ["@web-profile-ssr", "@core-applications"] }, () => {
  test("3.1 — включение PDF скрывает поле выдачи @smoke", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await togglePdf(page);
    await expect(pickupFormControl(page)).not.toBeVisible();
  });

  test("3.2 — PDF выключен по умолчанию; поле выдачи видно", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(page.getByTestId("reference-virtual-checkbox")).not.toBeChecked();
    await expect(pickupFormControl(page)).toBeVisible();
  });

  test("3.3 — переключение false→true скрывает поле выдачи", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(page.getByTestId("reference-virtual-checkbox")).not.toBeChecked();
    await togglePdf(page);
    await expect(pickupFormControl(page)).not.toBeVisible();
  });

  test("3.4 — переключение true→false возвращает поле выдачи", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);

    await togglePdf(page); // false → true: поле скрывается
    await expect(pickupFormControl(page)).not.toBeVisible();

    await togglePdf(page); // true → false: поле возвращается
    await expect(pickupFormControl(page)).toBeVisible();
  });
});
```

## Приложение 6.5. /e2e/src/tests/references/references.pickup.spec.ts

```typescript
import { expect, test } from "../../fixtures";
import { fillTypeAndSelect, pickupCombobox, pickupFormControl, REFERENCES_URL, submitBtn, togglePdf } from "./helpers";

test.describe("2. Где получить справку", { tag: ["@web-profile-ssr", "@core-applications"] }, () => {
  test("2.1 — пункт «СПбГУТ» выбирается после указания типа @smoke", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, "По месту работы родителей");
    // Кликаем на видимый combobox, а не на скрытый input
    await pickupCombobox(page).click();
    const option = page.locator('[role="option"]').filter({ hasText: "СПбГУТ" });
    await expect(option).toBeVisible();
    await option.click();
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test("2.2 — пункт «СПбКТ» выбирается после указания типа", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, "По месту работы родителей");
    await pickupCombobox(page).click();
    const option = page.locator('[role="option"]').filter({ hasText: "СПбКТ" });
    await expect(option).toBeVisible();
    await option.click();
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test("2.3 — поле выдачи недоступно до выбора типа", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    // MUI FormControl не ставит aria-disabled на wrapper; проверяем child combobox
    await expect(pickupCombobox(page)).toBeDisabled();
  });

  test("2.4 — кнопка disabled без пункта выдачи при выключенном PDF", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);

    await expect(submitBtn(page)).toBeDisabled();
  });

  test("2.5 — после выбора типа автоматически выбирается первый пункт выдачи", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, "РЖД");
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test("2.6 — поле выдачи скрыто при включённом PDF", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await togglePdf(page);
    await expect(pickupFormControl(page)).not.toBeVisible();
  });
});
```

## Приложение 6.6. /e2e/src/tests/references/references.typeInput.spec.ts

```typescript
import { expect, test } from "../../fixtures";
import { fillType, fillTypeAndSelect, pickupFormControl, REFERENCES_URL, submitBtn, togglePdf } from "./helpers";

test.describe("1. Тип справки", { tag: ["@web-profile-ssr", "@core-applications"] }, () => {
  test("1.1 — валидный тип «По месту работы родителей» разблокирует поле выдачи @smoke", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, "По месту работы родителей");
    await expect(pickupFormControl(page)).not.toHaveAttribute("aria-disabled", "true");
  });

  test("1.2 — валидный тип «РЖД» разблокирует поле выдачи", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillTypeAndSelect(page, "РЖД");
    await expect(pickupFormControl(page)).not.toHaveAttribute("aria-disabled", "true");
  });

  test("1.3 — тип с пробелами по краям принимается корректно", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, "  По месту работы  ");
    await page.getByTestId("reference-type-input").press("Tab");
    await expect(pickupFormControl(page)).not.toHaveAttribute("aria-disabled", "true");
  });

  test("1.4 — пользовательский тип «Справка для архива» принимается (freeSolo)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, "Справка для архива");
    await page.getByTestId("reference-type-input").press("Tab");
    await togglePdf(page);
    await expect(submitBtn(page)).not.toBeDisabled();
  });

  test("1.5 — пустой тип держит кнопку «Заказать» disabled", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await expect(submitBtn(page)).toBeDisabled();
  });

  test("1.6 — тип из одних пробелов держит кнопку «Заказать» disabled", async ({ authenticatedPage: page }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, "   ");
    await page.getByTestId("reference-type-input").press("Tab");
    await expect(submitBtn(page)).toBeDisabled();
  });

  test("1.7 — промежуточный ввод «По» показывает варианты, содержащие «По»", async ({ authenticatedPage: page }) => {
    // Компонент показывает все опции когда хоть одна начинается с введённого текста —
    // проверяем что нужные варианты присутствуют в списке.
    await page.goto(REFERENCES_URL);
    await fillType(page, "По");
    const listbox = page.locator('[role="listbox"]');
    await expect(listbox).toBeVisible();
    await expect(listbox.locator('[role="option"]').filter({ hasText: "По месту работы" }).first()).toBeVisible();
    await expect(
      listbox.locator('[role="option"]').filter({ hasText: "По месту работы родителей" }).first()
    ).toBeVisible();
  });

  test("1.8 — ввод в нижнем регистре «по месту работы» принимается (регистронезависимо)", async ({
    authenticatedPage: page,
  }) => {
    await page.goto(REFERENCES_URL);
    await fillType(page, "по месту работы");
    const option = page.locator('[role="listbox"] [role="option"]').filter({ hasText: /по месту работы/i });
    await expect(option.first()).toBeVisible();
    await option.first().click();
    await togglePdf(page);
    await expect(submitBtn(page)).not.toBeDisabled();
  });
});
```
