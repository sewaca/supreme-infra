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
  const cdWorkflowPath = join(projectRoot, '.github', 'workflows', 'cd.yml');
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

  // Генерируем options для choice input
  const serviceOptions = allServices
    .map((service) => `          - ${service}`)
    .join('\n');
  const defaultService = allServices[0] || '';

  // Генерируем input для workflow_dispatch
  const serviceInput = `      service:
        description: 'Select service to deploy'
        required: true
        type: choice
        options:
${serviceOptions}
        default: '${defaultService}'`;

  // Обновляем секцию inputs в workflow_dispatch
  const inputsRegex =
    /(workflow_dispatch:\s+inputs:\s+)([\s\S]*?)(\n\s+)(jobs:)/;
  cdWorkflowContent = cdWorkflowContent.replace(
    inputsRegex,
    `$1${serviceInput}\n    $4`,
  );

  // Обновляем логику в prepare-services для одного выбранного сервиса
  const githubInputsService = `\${{ github.event.inputs.service }}`;
  const githubOutput = '$GITHUB_OUTPUT';
  const prepareServicesLogic = `          # Get selected service
          SELECTED_SERVICE="${githubInputsService}"

          # Convert to JSON array (single service wrapped in array)
          # Install jq if not available
          if ! command -v jq &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y jq
          fi
          SERVICES_JSON=$(echo "$SELECTED_SERVICE" | jq -R -c '[.]')

          echo "Selected service: $SELECTED_SERVICE"
          echo "services=$SERVICES_JSON" >> ${githubOutput}
          echo "Services JSON: $SERVICES_JSON"`;

  // Обновляем логику prepare-services
  const prepareServicesRegex =
    /(Set services list[\s\S]*?id: set-services\s+run: \|)([\s\S]*?)(\n {2}get-latest-release-version:)/s;
  cdWorkflowContent = cdWorkflowContent.replace(
    prepareServicesRegex,
    `$1\n${prepareServicesLogic}\n$3`,
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
        `      - name: Security scan check for NestJS \${{ matrix.service-name }}
        if: matrix.service-name == '${service}'
        uses: ./.github/workflows/jobs/nest-application-security-check
        with:
          service-name: \${{ matrix.service-name }}`,
      );
    });
  }

  if (nextServices.length > 0) {
    nextServices.forEach((service) => {
      securityCheckSteps.push(
        `      - name: Security scan check for Next.js \${{ matrix.service-name }}
        if: matrix.service-name == '${service}'
        uses: ./.github/workflows/jobs/next-application-security-check
        with:
          service-name: \${{ matrix.service-name }}`,
      );
    });
  }

  // Обновляем секцию security-checks
  // Ищем блок от начала security-checks до начала build-image-to-docker-hub
  const securityChecksRegex =
    /(security-checks:[\s\S]*?steps:\s+- name: Checkout code[\s\S]*?uses: actions\/checkout@v4\s+)([\s\S]*?)(\n {2}build-image-to-docker-hub:)/s;

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
