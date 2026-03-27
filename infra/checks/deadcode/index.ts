import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Knip JSON format: each issue object has `file` + issue-type keys
// e.g. { file: "x.ts", exports: [{name,line,col}], dependencies: [{name,line}] }
// duplicates is an array of arrays (groups): [[{name,line}, ...], ...]

interface SymbolRef {
  name: string;
  line?: number;
  col?: number;
  pos?: number;
}

interface KnipIssueRecord {
  file: string;
  [issueType: string]: string | SymbolRef[] | SymbolRef[][];
}

interface KnipReport {
  files: string[];
  issues: KnipIssueRecord[];
}

type IssueEntry = { file: string; name: string; line?: number };

const ROOT = process.cwd();
mkdirSync(resolve(ROOT, '__reports'), { recursive: true });
const OUTPUT = resolve(ROOT, '__reports/deadcode-report.html');

process.stdout.write('Running Knip analysis (this may take a while)...\n');

let raw = '';
try {
  raw = execSync('pnpm knip --production --reporter json', {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'ignore'],
  });
} catch (err: unknown) {
  // knip exits with code 1 when dead code is found — that's expected
  raw = (err as { stdout?: string }).stdout ?? '';
}

let report: KnipReport;
try {
  report = JSON.parse(raw || '{"files":[],"issues":[]}');
} catch {
  process.stderr.write('Failed to parse Knip JSON output.\n');
  process.stderr.write(`Raw output (first 500 chars): ${raw.slice(0, 500)}\n`);
  process.exit(1);
}

const unusedFiles: string[] = report.files ?? [];
const byType: Record<string, IssueEntry[]> = {};

for (const issueRecord of report.issues ?? []) {
  const { file, ...typeMap } = issueRecord;
  for (const [type, value] of Object.entries(typeMap)) {
    if (!Array.isArray(value)) continue;
    if (!byType[type]) {
      byType[type] = [];
    }
    const entries = byType[type];
    if (type === 'duplicates') {
      // value is SymbolRef[][] — flatten each group into a single label
      for (const group of value as SymbolRef[][]) {
        const names = group.map((s) => s.name).join(' / ');
        entries.push({ file: file as string, name: names, line: group[0]?.line });
      }
    } else {
      for (const sym of value as SymbolRef[]) {
        entries.push({ file: file as string, name: sym.name, line: sym.line });
      }
    }
  }
}

const ISSUE_META: Record<string, { label: string; color: string; desc: string }> = {
  exports: { label: 'Unused Exports', color: '#f97316', desc: 'Exported symbols not imported anywhere' },
  types: { label: 'Unused Types', color: '#f59e0b', desc: 'Exported type declarations not used anywhere' },
  enumMembers: { label: 'Unused Enum Members', color: '#eab308', desc: 'Enum members never referenced' },
  classMembers: { label: 'Unused Class Members', color: '#84cc16', desc: 'Class properties/methods not used' },
  nsExports: { label: 'Unused Namespace Exports', color: '#22c55e', desc: 'Re-exported symbols not imported' },
  nsTypes: { label: 'Unused Namespace Types', color: '#14b8a6', desc: 'Re-exported types not imported' },
  duplicates: { label: 'Duplicate Exports', color: '#06b6d4', desc: 'Same symbol exported from multiple places' },
  dependencies: { label: 'Unused Dependencies', color: '#8b5cf6', desc: 'Listed in dependencies but never imported' },
  devDependencies: {
    label: 'Unused Dev Dependencies',
    color: '#a855f7',
    desc: 'Listed in devDependencies but never used',
  },
  optionalPeerDependencies: {
    label: 'Unused Peer Deps',
    color: '#64748b',
    desc: 'Optional peer dependencies not needed',
  },
  unlisted: { label: 'Unlisted Dependencies', color: '#ec4899', desc: 'Imported but not declared in package.json' },
  unresolved: { label: 'Unresolved Imports', color: '#ef4444', desc: 'Imports that cannot be resolved' },
  binaries: { label: 'Unlisted Binaries', color: '#f43f5e', desc: 'Scripts not listed in package.json' },
  catalog: {
    label: 'Unused Catalog Entries',
    color: '#78716c',
    desc: 'Entries in pnpm catalog not used by any workspace',
  },
};

const totalSymbols = Object.values(byType).reduce((acc, arr) => acc + arr.length, 0);
const totalIssues = totalSymbols + unusedFiles.length;
const generatedAt = new Date().toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderUnusedFiles(): string {
  if (unusedFiles.length === 0) return '';
  const items = unusedFiles
    .map((f) => `<li class="item item--file"><span class="item-name">${escHtml(f)}</span></li>`)
    .join('\n');
  return renderSection(
    'files',
    'Unused Files',
    '#ef4444',
    'Files not imported or referenced anywhere — safe to delete',
    unusedFiles.length,
    `<ul class="item-list">${items}</ul>`,
  );
}

function renderSymbolSection(type: string, entries: IssueEntry[]): string {
  const meta = ISSUE_META[type] ?? { label: type, color: '#6b7280', desc: '' };

  // Group by file
  const byFile: Record<string, Array<{ name: string; line?: number }>> = {};
  for (const { file, name, line } of entries) {
    if (!byFile[file]) {
      byFile[file] = [];
    }

    byFile[file].push({ name, line });
  }

  const fileBlocks = Object.entries(byFile)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([file, symbols]) => {
      const symbolItems = symbols
        .map(({ name, line }) => {
          const lineTag = line !== undefined ? `<span class="line-num">:${line}</span>` : '';
          return `<li><code>${escHtml(name)}</code>${lineTag}</li>`;
        })
        .join('');
      return `
        <details class="file-block">
          <summary class="file-block__header">
            <span class="file-path">${escHtml(file)}</span>
            <span class="badge">${symbols.length}</span>
          </summary>
          <ul class="symbol-list">${symbolItems}</ul>
        </details>`;
    })
    .join('');

  return renderSection(type, meta.label, meta.color, meta.desc, entries.length, fileBlocks);
}

function renderSection(id: string, title: string, color: string, desc: string, count: number, body: string): string {
  return `
  <details class="section" id="section-${escHtml(id)}" open>
    <summary class="section__header" style="--accent: ${color}">
      <span class="section__title">${escHtml(title)}</span>
      <span class="section__count" style="background:${color}">${count}</span>
    </summary>
    ${desc ? `<p class="section__desc">${escHtml(desc)}</p>` : ''}
    <div class="section__body">${body}</div>
  </details>`;
}

function renderStatCard(label: string, value: number, color: string): string {
  return `
    <div class="stat-card" style="--c: ${color}">
      <div class="stat-card__value">${value}</div>
      <div class="stat-card__label">${escHtml(label)}</div>
    </div>`;
}

const statCards = [
  renderStatCard('Total Issues', totalIssues, totalIssues === 0 ? '#22c55e' : '#ef4444'),
  renderStatCard('Unused Files', unusedFiles.length, unusedFiles.length === 0 ? '#22c55e' : '#ef4444'),
  renderStatCard('Unused Symbols', totalSymbols, totalSymbols === 0 ? '#22c55e' : '#f97316'),
  ...Object.entries(byType)
    .filter(([, arr]) => arr.length > 0)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5)
    .map(([type, arr]) => {
      const meta = ISSUE_META[type] ?? { label: type, color: '#6b7280', desc: '' };
      return renderStatCard(meta.label, arr.length, meta.color);
    }),
].join('');

const sections = [
  renderUnusedFiles(),
  ...Object.entries(byType)
    .filter(([, arr]) => arr.length > 0)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([type, entries]) => renderSymbolSection(type, entries)),
].join('');

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dead Code Report — Supreme Infra</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0f1117;
      --bg2: #1a1d27;
      --bg3: #22263a;
      --border: #2e3348;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --radius: 8px;
      --font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 0;
    }

    /* Header */
    .header {
      background: var(--bg2);
      border-bottom: 1px solid var(--border);
      padding: 24px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header__logo {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; color: white;
      flex-shrink: 0;
    }
    .header__title { font-size: 20px; font-weight: 700; }
    .header__sub { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
    .header__meta { margin-left: auto; text-align: right; font-size: 12px; color: var(--text-dim); }

    /* Status banner */
    .banner {
      padding: 10px 32px;
      font-size: 14px;
      font-weight: 600;
      background: ${totalIssues === 0 ? 'linear-gradient(90deg,#14532d,#166534)' : 'linear-gradient(90deg,#7f1d1d,#991b1b)'};
      color: ${totalIssues === 0 ? '#86efac' : '#fca5a5'};
    }

    /* Main layout */
    .main { padding: 24px 32px; max-width: 1200px; margin: 0 auto; }

    /* Stat cards */
    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-top: 3px solid var(--c);
      border-radius: var(--radius);
      padding: 16px 20px;
      min-width: 140px;
    }
    .stat-card__value {
      font-size: 32px;
      font-weight: 800;
      color: var(--c);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .stat-card__label {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 6px;
    }

    /* Sections */
    .section {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 16px;
      overflow: hidden;
    }
    .section__header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      cursor: pointer;
      user-select: none;
      list-style: none;
      border-left: 3px solid var(--accent, #6b7280);
    }
    .section__header::-webkit-details-marker { display: none; }
    .section__header::before {
      content: '▸';
      color: var(--accent, #6b7280);
      font-size: 11px;
      transition: transform 0.15s;
    }
    details[open] > .section__header::before { transform: rotate(90deg); }
    .section__title { font-weight: 600; font-size: 15px; }
    .section__count {
      margin-left: auto;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 99px;
      color: white;
    }
    .section__desc {
      font-size: 13px;
      color: var(--text-muted);
      padding: 0 20px 12px;
      border-bottom: 1px solid var(--border);
    }
    .section__body { padding: 12px 20px; }

    /* Unused file items */
    .item-list { list-style: none; }
    .item { padding: 5px 0; font-size: 13px; }
    .item-name { font-family: var(--font-mono); color: #f87171; }

    /* File blocks (for symbol issues) */
    .file-block {
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 8px;
      overflow: hidden;
    }
    .file-block__header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: var(--bg3);
      cursor: pointer;
      user-select: none;
      list-style: none;
      font-size: 13px;
    }
    .file-block__header::-webkit-details-marker { display: none; }
    .file-block__header::before { content: '▸'; color: var(--text-dim); font-size: 10px; transition: transform 0.15s; }
    details[open] > .file-block__header::before { transform: rotate(90deg); }
    .file-path { font-family: var(--font-mono); color: #93c5fd; word-break: break-all; }
    .badge {
      margin-left: auto;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      padding: 1px 8px;
      border-radius: 99px;
      flex-shrink: 0;
    }

    /* Symbol list */
    .symbol-list {
      list-style: none;
      padding: 8px 14px 8px 32px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .symbol-list li { font-size: 13px; color: var(--text-muted); }
    .symbol-list code {
      font-family: var(--font-mono);
      color: #fbbf24;
      background: rgba(251,191,36,0.08);
      padding: 1px 6px;
      border-radius: 4px;
    }
    .line-num { color: var(--text-dim); font-family: var(--font-mono); font-size: 12px; margin-left: 4px; }

    /* Empty state */
    .empty {
      text-align: center;
      padding: 48px;
      color: var(--text-muted);
    }
    .empty__icon { font-size: 48px; margin-bottom: 16px; }
    .empty__title { font-size: 20px; font-weight: 700; color: #22c55e; margin-bottom: 8px; }
  </style>
</head>
<body>
  <header class="header">
    <div class="header__logo">S</div>
    <div>
      <div class="header__title">Dead Code Report</div>
      <div class="header__sub">Supreme Infra — Knip analysis</div>
    </div>
    <div class="header__meta">
      Generated: ${generatedAt}
    </div>
  </header>

  <div class="banner">
    ${
      totalIssues === 0
        ? '✓ No dead code found — codebase is clean!'
        : `✗ Found ${totalIssues} issue${totalIssues !== 1 ? 's' : ''}: ${unusedFiles.length} unused file${unusedFiles.length !== 1 ? 's' : ''}, ${totalSymbols} unused symbol${totalSymbols !== 1 ? 's' : ''}`
    }
  </div>

  <main class="main">
    <div class="stats">${statCards}</div>

    ${
      totalIssues === 0
        ? `<div class="empty">
          <div class="empty__icon">🎉</div>
          <div class="empty__title">All clean!</div>
          <p>No unused files, exports, or dependencies found.</p>
        </div>`
        : sections
    }
  </main>
</body>
</html>`;

writeFileSync(OUTPUT, html, 'utf-8');
process.stdout.write(`\nReport saved to: ${OUTPUT}\n`);
process.stdout.write(`Total issues: ${totalIssues} (${unusedFiles.length} files, ${totalSymbols} symbols)\n`);
if (totalIssues > 0) process.exit(1);
