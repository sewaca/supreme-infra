# Health Module

Модуль для проверки здоровья сервиса (health check).

## Использование

Импортируйте `HealthModule` в ваш корневой модуль и настройте его с помощью метода `forRoot`:

```typescript
import { Module } from "@nestjs/common";
import { HealthModule } from "@supreme-int/nestjs-shared";

@Module({
  imports: [HealthModule.forRoot({ serviceName: "my-service" })],
})
export class AppModule {}
```

## API

После подключения модуль автоматически регистрирует эндпоинт:

**GET** `/api/status`

Возвращает:

```json
{
  "status": "ok",
  "service": "my-service"
}
```

## Конфигурация

### HealthModuleOptions

- `serviceName` (string, обязательный) - имя сервиса, которое будет возвращаться в ответе

## Тестирование

Пример теста контроллера:

```typescript
import { Test, type TestingModule } from "@nestjs/testing";
import { HealthController } from "@supreme-int/nestjs-shared";
import { HEALTH_MODULE_OPTIONS } from "@supreme-int/nestjs-shared";

describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HEALTH_MODULE_OPTIONS,
          useValue: { serviceName: "test-service" },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it("should return status ok with service name", () => {
    const result = controller.getStatus();
    expect(result).toEqual({ status: "ok", service: "test-service" });
  });
});
```
