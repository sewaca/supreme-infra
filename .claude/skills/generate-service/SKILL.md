---
name: generate-service
description: Generate a new microservice scaffold in this project. Use when the user wants to create a new service, add a service to the monorepo, scaffold a NestJS/Next.js/FastAPI service, or says anything like "создай сервис", "добавь сервис", "сгенерируй сервис", "новый микросервис", "create service", "new service", "scaffold service".
---

# Generate Service Skill

Generates a new microservice by collecting parameters from the user, then running a headless version of the infrastructure generator — no interactive prompts needed.

**Announce at start:** "Использую скилл generate-service для создания нового сервиса."

---

## Step 1 — Collect parameters

Ask the user for the following. You can ask all at once or in one conversational block.

### Required from everyone

| Parameter        | Validation                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| **Service name** | `^[a-z0-9-]+$` — lowercase, digits, dashes only. Check that `services/<name>/` does NOT already exist. |
| **Service type** | One of: `nest` (NestJS), `next` (Next.js), `fastapi` (FastAPI/Python)                                  |
| **Description**  | Non-empty string                                                                                       |
| **Port**         | Integer 1024–65535. Default: `4000` for nest, `8000` for fastapi, `3000` for next                      |

### Only for `nest` and `fastapi`

| Parameter         | Validation                    |
| ----------------- | ----------------------------- |
| **API prefix**    | Default: same as service name |
| **Has database?** | Boolean yes/no                |

### Only when database is enabled

| Parameter              | Validation     | Default                                |
| ---------------------- | -------------- | -------------------------------------- |
| **DB name**            | `^[a-z0-9_]+$` | `<service_name_with_underscores>_db`   |
| **DB user**            | `^[a-z0-9_]+$` | `<service_name_with_underscores>_user` |
| **GitHub Secret name** | `^[A-Z0-9_]+$` | `DB_PASSWORD`                          |

---

## Step 2 — Validate before generating

Before writing any files, verify:

```bash
# Check service doesn't already exist
ls services/<serviceName> 2>/dev/null && echo "EXISTS" || echo "OK"
```

If it exists — stop and tell the user to choose a different name.

---

## Step 3 — Generate the service

Write the file `infra/generate/generate-service/.headless-run.ts` with the template below, filling in ALL placeholder values from collected parameters.

Then run from the project root:

```bash
pnpm tsx infra/generate/generate-service/.headless-run.ts
```

Then delete the temp file:

```bash
rm infra/generate/generate-service/.headless-run.ts
```

### Template for `.headless-run.ts`

Replace ALL `{{PLACEHOLDER}}` values before writing:

```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import * as yaml from 'yaml';

// ── Config (filled by skill) ──────────────────────────────────────────────────
const config = {
  serviceName: '{{SERVICE_NAME}}',
  serviceType: '{{SERVICE_TYPE}}' as 'nest' | 'next' | 'fastapi',
  description: '{{DESCRIPTION}}',
  port: {{PORT}},
  apiPrefix: '{{API_PREFIX}}',
  hasDatabase: {{HAS_DATABASE}},
  databaseName: '{{DB_NAME}}',
  databaseUser: '{{DB_USER}}',
  databasePasswordSecret: '{{DB_SECRET}}',
};
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '../../..');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const COMMON_TEMPLATES_DIR = path.join(__dirname, 'templates/common');
const SERVICES_DIR = path.join(ROOT, 'services');
const SERVICES_YAML_PATH = path.join(ROOT, 'services.yaml');

interface ServicesYaml {
  services: {
    nest: Array<{ name: string; description: string; database?: { enabled: boolean } }>;
    next: Array<{ name: string; description: string }>;
    fastapi: Array<{ name: string; description: string; database?: { enabled: boolean } }>;
  };
}

const FASTAPI_DATABASE_ONLY_ITEMS = new Set(['alembic', 'alembic.ini']);

function shouldSkipItem(item: string): boolean {
  if (config.serviceType === 'fastapi' && !config.hasDatabase) {
    const baseName = item.endsWith('.hbs') ? item.slice(0, -4) : item;
    return FASTAPI_DATABASE_ONLY_ITEMS.has(baseName);
  }
  return false;
}

function copyTemplateFile(templatePath: string, targetPath: string, isHandlebars = true): void {
  const content = fs.readFileSync(templatePath, 'utf-8');
  if (isHandlebars) {
    const template = Handlebars.compile(content);
    fs.writeFileSync(targetPath, template(config));
  } else {
    fs.writeFileSync(targetPath, content);
  }
}

function copyTemplateDirectory(templateDir: string, targetDir: string): void {
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  for (const item of fs.readdirSync(templateDir)) {
    if (shouldSkipItem(item)) continue;
    const src = path.join(templateDir, item);
    if (fs.statSync(src).isDirectory()) {
      copyTemplateDirectory(src, path.join(targetDir, item));
    } else {
      const targetName = item.endsWith('.hbs') ? item.slice(0, -4) : item;
      copyTemplateFile(src, path.join(targetDir, targetName), item.endsWith('.hbs'));
    }
  }
}

function generateGrafanaDashboard(): void {
  const templatePath = path.join(COMMON_TEMPLATES_DIR, config.serviceType, 'grafana-dashboard.json.hbs');
  const dashboardsDir = path.join(ROOT, 'infra/helmcharts/grafana/dashboards');
  if (!fs.existsSync(dashboardsDir)) fs.mkdirSync(dashboardsDir, { recursive: true });
  const content = fs.readFileSync(templatePath, 'utf-8');
  fs.writeFileSync(
    path.join(dashboardsDir, `${config.serviceName}-metrics.json`),
    content.replace(/\{\{serviceName\}\}/g, config.serviceName),
  );
}

function generateDatabaseFiles(): void {
  if (!config.hasDatabase || (config.serviceType !== 'nest' && config.serviceType !== 'fastapi')) return;
  const dbDir = path.join(ROOT, 'infra/databases', `${config.serviceName}-db`);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  // init.sql
  const initTemplate = path.join(COMMON_TEMPLATES_DIR, config.serviceType, 'database-init.sql.hbs');
  copyTemplateFile(initTemplate, path.join(dbDir, 'init.sql'), true);

  // service.yaml
  const dbServiceConfig = {
    database: { name: config.databaseName, user: config.databaseUser, passwordSecret: config.databasePasswordSecret },
    resources: {
      production: { limits: { cpu: '300m', memory: '300Mi' }, requests: { cpu: '100m', memory: '150Mi' } },
      development: { limits: { cpu: '250m', memory: '256Mi' }, requests: { cpu: '50m', memory: '128Mi' } },
    },
  };
  fs.writeFileSync(
    path.join(dbDir, 'service.yaml'),
    `# Database configuration for ${config.serviceName} service\n` + yaml.stringify(dbServiceConfig),
  );
}

function updateServicesYaml(): void {
  let services: ServicesYaml = fs.existsSync(SERVICES_YAML_PATH)
    ? (yaml.parse(fs.readFileSync(SERVICES_YAML_PATH, 'utf-8')) as ServicesYaml)
    : { services: { nest: [], next: [], fastapi: [] } };
  if (!services.services.fastapi) services.services.fastapi = [];

  if (config.serviceType === 'nest') {
    const entry: ServicesYaml['services']['nest'][0] = { name: config.serviceName, description: config.description };
    if (config.hasDatabase) entry.database = { enabled: true };
    services.services.nest.push(entry);
  } else if (config.serviceType === 'fastapi') {
    const entry: ServicesYaml['services']['fastapi'][0] = { name: config.serviceName, description: config.description };
    if (config.hasDatabase) entry.database = { enabled: true };
    services.services.fastapi.push(entry);
  } else {
    services.services.next.push({ name: config.serviceName, description: config.description });
  }

  fs.writeFileSync(SERVICES_YAML_PATH, yaml.stringify(services));
}

function updateOpenapiTsConfig(): void {
  if (config.serviceType !== 'fastapi') return;
  const configPath = path.join(ROOT, 'packages/api-client/openapi-ts.config.ts');
  if (!fs.existsSync(configPath)) { console.log('⚠ openapi-ts.config.ts not found, skipping'); return; }

  const content = fs.readFileSync(configPath, 'utf-8');
  const inputMatch = content.match(/input:\s*\[(.*?)\]/s);
  const outputMatch = content.match(/output:\s*\[(.*?)\]/s);
  if (!inputMatch || !outputMatch) { console.log('⚠ Could not parse openapi-ts.config.ts, skipping'); return; }

  const inputs = inputMatch[1].split(',').map((e) => e.trim()).filter(Boolean);
  const outputs = outputMatch[1].split(',').map((e) => e.trim()).filter(Boolean);
  inputs.push(`'./schemas/${config.serviceName}.json'`);
  outputs.push(`'./src/generated/${config.serviceName}'`);

  fs.writeFileSync(
    configPath,
    `import { defineConfig } from '@hey-api/openapi-ts';\n\nexport default defineConfig({\n  input: [${inputs.join(', ')}],\n  output: [${outputs.join(', ')}],\n});\n`,
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log('→ Copying templates...');
copyTemplateDirectory(path.join(TEMPLATES_DIR, config.serviceType), path.join(SERVICES_DIR, config.serviceName));
console.log(`✓ Service files created: services/${config.serviceName}`);

console.log('→ Generating Grafana dashboard...');
generateGrafanaDashboard();
console.log(`✓ Dashboard: infra/helmcharts/grafana/dashboards/${config.serviceName}-metrics.json`);

if (config.hasDatabase) {
  console.log('→ Generating database config...');
  generateDatabaseFiles();
  console.log(`✓ DB files: infra/databases/${config.serviceName}-db/`);
}

console.log('→ Updating services.yaml...');
updateServicesYaml();
console.log('✓ services.yaml updated');

updateOpenapiTsConfig();
console.log('\n✅ Service scaffold created successfully!');
```

---

## Step 4 — Run infrastructure generators

After the script completes, run:

```bash
pnpm run generate
```

This regenerates Helm overrides, CD workflow, security matrices, router configs.

---

## Step 5 — Install dependencies

For TypeScript services (nest/next):

```bash
cd services/<serviceName> && pnpm install
```

For FastAPI services:

```bash
cd services/<serviceName> && uv sync
```

---

## Step 6 — Report to user

After all steps complete, report:

```
✅ Сервис <name> (<type>) создан.

Файлы:
  services/<name>/           — код сервиса
  infra/overrides/*/         — Helm values (сгенерированы)
  infra/helmcharts/grafana/dashboards/<name>-metrics.json
  [infra/databases/<name>-db/] — (если с БД)

Следующие шаги:
  cd services/<name> && pnpm run dev     (или uv run uvicorn app.main:app --reload --port <port>)

  [Если с БД:]
  Отредактируй init.sql в infra/databases/<name>-db/
  Добавь GitHub Secret <DB_SECRET>
  Запусти Deploy Database workflow
```

---

## Placeholder reference

| Placeholder        | Description                            | Example                  |
| ------------------ | -------------------------------------- | ------------------------ |
| `{{SERVICE_NAME}}` | Service name                           | `core-auth`              |
| `{{SERVICE_TYPE}}` | `nest` / `next` / `fastapi`            | `fastapi`                |
| `{{DESCRIPTION}}`  | Service description                    | `Authentication service` |
| `{{PORT}}`         | Port number (integer, no quotes)       | `8002`                   |
| `{{API_PREFIX}}`   | API route prefix                       | `core-auth`              |
| `{{HAS_DATABASE}}` | `true` or `false` (boolean, no quotes) | `true`                   |
| `{{DB_NAME}}`      | DB name                                | `core_auth_db`           |
| `{{DB_USER}}`      | DB user                                | `core_auth_user`         |
| `{{DB_SECRET}}`    | GitHub Secret name                     | `DB_PASSWORD`            |

For `next` services: set `apiPrefix` to `''`, `hasDatabase` to `false`, `databaseName/User/PasswordSecret` to `''`.

---

## Common errors

| Error                             | Fix                                                                  |
| --------------------------------- | -------------------------------------------------------------------- |
| `Service already exists`          | Check `ls services/<name>` — choose a different name                 |
| `Template not found`              | Make sure `infra/generate/generate-service/templates/<type>/` exists |
| `Cannot find module 'handlebars'` | Run from project root, not from another dir                          |
| `ExitPromptError`                 | Don't run the interactive script — use this skill's headless runner  |
