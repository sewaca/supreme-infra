import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface ServicesConfig {
  nest: string[];
  next: string[];
}

export function updateCdWorkflow(): void {
  // Путь к корню проекта (относительно текущего файла)
  const projectRoot = join(__dirname, '../..');

  // Читаем services.json
  const servicesJsonPath = join(__dirname, 'services.json');
  const servicesContent = readFileSync(servicesJsonPath, 'utf-8');
  const servicesConfig: ServicesConfig = JSON.parse(servicesContent);

  // Читаем cd.yml
  const cdWorkflowPath = join(
    projectRoot,
    '.github',
    'workflows',
    'cd.yml',
  );
  let cdWorkflowContent = readFileSync(cdWorkflowPath, 'utf-8');

  // Собираем все сервисы
  const allServices = [
    ...(servicesConfig.nest || []),
    ...(servicesConfig.next || []),
  ];

  // Создаем мапу типов сервисов для быстрого поиска
  const serviceTypeMap = new Map<string, 'nest' | 'next'>();
  (servicesConfig.nest || []).forEach((service) => {
    serviceTypeMap.set(service, 'nest');
  });
  (servicesConfig.next || []).forEach((service) => {
    serviceTypeMap.set(service, 'next');
  });

  // Генерируем inputs для workflow_dispatch
  const inputs = allServices
    .map(
      (service) => `      ${service}:
        description: 'Deploy ${service} service'
        required: false
        type: boolean
        default: true`,
    )
    .join('\n');

  // Обновляем секцию inputs в workflow_dispatch
  const inputsRegex = /(workflow_dispatch:\s+inputs:\s+)([\s\S]*?)(\n\s+)(jobs:)/;
  cdWorkflowContent = cdWorkflowContent.replace(
    inputsRegex,
    `$1${inputs}\n    $4`,
  );

  // Генерируем логику для сбора выбранных сервисов в prepare-services
  const serviceChecks = allServices
    .map(
      (service) => `          if [ "${{ github.event.inputs.${service} }}" == "true" ]; then
            SERVICES+=("${service}")
          fi`,
    )
    .join('\n\n');

  // Обновляем логику сбора сервисов
  const servicesCollectionRegex =
    /(# Collect selected services\s+SERVICES=\(\)\s+)([\s\S]*?)(\s+# Check if at least one service is selected)/s;
  cdWorkflowContent = cdWorkflowContent.replace(
    servicesCollectionRegex,
    `$1${serviceChecks}\n\n$3`,
  );

  // Обновляем security-checks секцию
  // Генерируем условия для каждого типа сервиса
  const nestServices = servicesConfig.nest || [];
  const nextServices = servicesConfig.next || [];

  // Генерируем шаги для security checks
  const securityCheckSteps: string[] = [];

  if (nestServices.length > 0) {
    nestServices.forEach((service) => {
      securityCheckSteps.push(
        `      - name: Security scan check for NestJS ${{ matrix.service-name }}
        if: matrix.service-name == '${service}'
        uses: ./.github/workflows/jobs/nest-application-security-check
        with:
          service-name: ${{ matrix.service-name }}`,
      );
    });
  }

  if (nextServices.length > 0) {
    nextServices.forEach((service) => {
      securityCheckSteps.push(
        `      - name: Security scan check for Next.js ${{ matrix.service-name }}
        if: matrix.service-name == '${service}'
        uses: ./.github/workflows/jobs/next-application-security-check
        with:
          service-name: ${{ matrix.service-name }}`,
      );
    });
  }

  // Обновляем секцию security-checks
  // Ищем блок от начала security-checks до начала build-image-to-docker-hub
  const securityChecksRegex =
    /(security-checks:[\s\S]*?steps:\s+- name: Checkout code[\s\S]*?uses: actions\/checkout@v4\s+)([\s\S]*?)(\n  build-image-to-docker-hub:)/s;
  
  if (securityCheckSteps.length > 0) {
    const securityChecksReplacement = `$1${securityCheckSteps.join('\n\n')}\n$3`;
    cdWorkflowContent = cdWorkflowContent.replace(
      securityChecksRegex,
      securityChecksReplacement,
    );
  }

  // Сохраняем обновленный файл
  writeFileSync(cdWorkflowPath, cdWorkflowContent, 'utf-8');

  console.log('CD workflow updated successfully!');
  console.log(`All services: ${allServices.join(', ')}`);
  console.log(`Nest services: ${nestServices.join(', ')}`);
  console.log(`Next services: ${nextServices.join(', ')}`);
}

