import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.join(__dirname, '../..');
const WORKSPACES = ['services', 'packages'];
const DEP_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies'] as const;
const ALLOWED_PREFIXES = ['catalog:', 'workspace:'];

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

interface Violation {
  file: string;
  field: string;
  pkg: string;
  version: string;
}

function isAllowed(version: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => version.startsWith(prefix));
}

function collectPackageJsonPaths(): string[] {
  const paths: string[] = [path.join(ROOT, 'package.json')];

  for (const workspace of WORKSPACES) {
    const workspaceDir = path.join(ROOT, workspace);
    if (!fs.existsSync(workspaceDir)) continue;

    for (const entry of fs.readdirSync(workspaceDir)) {
      const pkgPath = path.join(workspaceDir, entry, 'package.json');
      if (fs.existsSync(pkgPath)) paths.push(pkgPath);
    }
  }

  return paths;
}

function validatePackageJson(filePath: string): Violation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const pkg = JSON.parse(content) as PackageJson;
  const violations: Violation[] = [];
  const relativePath = path.relative(ROOT, filePath);

  for (const field of DEP_FIELDS) {
    const deps = pkg[field];
    if (!deps) continue;

    for (const [name, version] of Object.entries(deps)) {
      if (!isAllowed(version)) {
        violations.push({ file: relativePath, field, pkg: name, version });
      }
    }
  }

  return violations;
}

function main(): void {
  const packageJsonPaths = collectPackageJsonPaths();
  const allViolations: Violation[] = [];

  for (const filePath of packageJsonPaths) {
    allViolations.push(...validatePackageJson(filePath));
  }

  if (allViolations.length === 0) {
    console.log('All dependencies use catalog: or workspace:* — OK');
    process.exit(0);
  }

  console.error(`Found ${allViolations.length} dependency version violation(s):\n`);

  for (const v of allViolations) {
    console.error(`  ${v.file} > ${v.field} > "${v.pkg}": "${v.version}"`);
    console.error(`    Expected: "catalog:" or "workspace:*"\n`);
  }

  process.exit(1);
}

main();
