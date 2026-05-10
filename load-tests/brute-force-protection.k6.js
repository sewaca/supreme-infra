/**
 * k6 brute-force protection test
 *
 * Проверяет, что /core-auth/auth/login блокирует перебор паролей.
 *
 * Запуск:
 *   k6 run load-tests/brute-force-protection.k6.js
 *   k6 run --env ATTACK_RPS=5 load-tests/brute-force-protection.k6.js
 *   k6 run --env BASE_URL=https://diploma.sewaca.ru load-tests/brute-force-protection.k6.js
 *
 * ATTACK_RPS (default: 5) — RPS атаки. Должен превышать ожидаемый лимит.
 *   После деплоя: лимит core-auth = 3 RPS → ставим 5+
 *   Пока старые настройки (лимит 30 RPS): нужно 35+
 *
 * Сценарии:
 *   1. single_attacker (0s)   — форсированный RPS с одного IP, смотрим когда придёт первый 429
 *   2. distributed    (45s)   — 10 «атакующих» одновременно, каждый посылает по 20 попыток
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// 401/429/423 — ожидаемые ответы для этого теста, не network errors
http.setResponseCallback(http.expectedStatuses(200, 201, 400, 401, 403, 422, 423, 429));

// ─── Custom metrics ───────────────────────────────────────────────────────────
const blockedRate = new Rate('blocked_rate');
const blockedTotal = new Counter('blocked_total');
const unauthorizedTotal = new Counter('unauthorized_total');
const loginDuration = new Trend('login_duration_ms', true);

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://diploma.sewaca.ru';
const LOGIN_URL = `${BASE_URL}/core-auth/auth/login`;
const TARGET_EMAIL = __ENV.TARGET_EMAIL || 'sofia.volkova@example.com';
const ATTACK_RPS = parseInt(__ENV.ATTACK_RPS || '5', 10);

const WRONG_PASSWORDS = [
  'password',
  'password1',
  '123456',
  '123456789',
  'qwerty',
  'abc123',
  'letmein',
  'monkey',
  'dragon',
  'master',
  'welcome',
  'shadow',
  'admin',
  'passw0rd',
  'test123',
  'iloveyou',
  'batman',
  'football',
  'michael',
  'jessica',
  'charlie',
  'donald',
  'superman',
  'trustno1',
];

const HEADERS = { 'Content-Type': 'application/json', Accept: '*/*' };

// ─── Scenarios ────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // constant-arrival-rate гарантирует ATTACK_RPS независимо от latency
    single_attacker: {
      executor: 'constant-arrival-rate',
      rate: ATTACK_RPS,
      timeUnit: '1s',
      duration: '30s',
      // preAllocatedVUs = RPS × max_latency_sec, чтобы VU хватало
      preAllocatedVUs: ATTACK_RPS * 4,
      maxVUs: ATTACK_RPS * 8,
      tags: { scenario: 'single_attacker' },
    },

    // 10 «атакующих» параллельно, по 20 попыток каждый
    distributed: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 20,
      maxDuration: '90s',
      startTime: '35s',
      tags: { scenario: 'distributed' },
    },
  },

  thresholds: {
    // Application-level lockout: после 5 попыток все остальные должны быть заблокированы.
    // При 5 RPS × 30s = 150 запросов: первые 5 пройдут (401), остальные 145 = 429.
    // Ожидаем >80% блокировок.
    'blocked_rate{scenario:single_attacker}': ['rate>0.80'],
    // Distributed: все 10 VU атакуют один email → lockout срабатывает после 5-й попытки
    'blocked_rate{scenario:distributed}': ['rate>0.70'],
    // Latency не должна деградировать
    'login_duration_ms{scenario:single_attacker}': ['p(95)<5000'],
  },
};

// ─── Main function ────────────────────────────────────────────────────────────

// Счётчики per-VU для логирования прогрессии
let firstBlockedIter = -1;

export default function () {
  const iter = __ITER;
  const password = WRONG_PASSWORDS[iter % WRONG_PASSWORDS.length];

  const payload = JSON.stringify({
    email: TARGET_EMAIL,
    password,
    location: 'Test Runner',
    device: 'k6 load test',
    ip_address: '127.0.0.1',
  });

  const res = http.post(LOGIN_URL, payload, {
    headers: HEADERS,
    tags: { attempt: String(iter) },
    timeout: '10s',
  });

  loginDuration.add(res.timings.duration);

  const isBlocked = res.status === 429 || res.status === 423;
  const isUnauthorized = res.status === 401;

  blockedRate.add(isBlocked);
  if (isBlocked) {
    blockedTotal.add(1);
    if (firstBlockedIter === -1) {
      firstBlockedIter = iter;
      console.log(`[VU ${__VU}] BLOCKED at iter=${iter} | status=${res.status} | password="${password}"`);
    }
  }
  if (isUnauthorized) unauthorizedTotal.add(1);

  check(res, {
    'не 5xx': (r) => r.status < 500,
    'ожидаемый статус': (r) => [200, 201, 401, 422, 423, 429].includes(r.status),
  });

  // Логируем каждые 5 итераций чтобы видеть прогрессию без спама
  if (iter % 5 === 0) {
    const statusLabel = isBlocked ? '🔒 BLOCKED' : isUnauthorized ? '✗ 401' : `? ${res.status}`;
    console.log(`[VU ${__VU}] iter=${iter} | ${statusLabel} | ${res.timings.duration.toFixed(0)}ms`);
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────
export function setup() {
  console.log('\n=== Brute-Force Protection Test ===');
  console.log(`  URL         : ${LOGIN_URL}`);
  console.log(`  Email       : ${TARGET_EMAIL}`);
  console.log(`  Attack RPS  : ${ATTACK_RPS} req/sec (меняй --env ATTACK_RPS=N)`);
  console.log('');
  console.log(`  single_attacker: ${ATTACK_RPS} RPS × 30s = ~${ATTACK_RPS * 30} запросов с одного IP`);
  console.log(`  distributed:     10 VU × 20 попыток = 200 запросов с разных VU`);
  console.log('');
  console.log('  Если лимит НЕ сработал — смотри текущий ingress rateLimit.');
  console.log(`  Текущий ожидаемый лимит core-auth: 3 RPS → ATTACK_RPS должен быть > 3.`);
  console.log('===================================\n');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const blocked = data.metrics['blocked_total']?.values?.count ?? 0;
  const unauthorized = data.metrics['unauthorized_total']?.values?.count ?? 0;
  const blockedRateVal = (data.metrics['blocked_rate']?.values?.rate ?? 0) * 100;
  const p95 = data.metrics['login_duration_ms']?.values?.['p(95)'] ?? 0;
  const totalReqs = data.metrics['http_reqs']?.values?.count ?? 0;
  const actualRps = (data.metrics['http_reqs']?.values?.rate ?? 0).toFixed(1);

  const thresholdResults = [];
  for (const [name, metric] of Object.entries(data.metrics)) {
    if (!metric.thresholds) continue;
    for (const [expr, t] of Object.entries(metric.thresholds)) {
      thresholdResults.push(`  ${t.ok ? 'PASS' : 'FAIL'} [${name}] ${expr}`);
    }
  }

  const diagnosis =
    blocked === 0
      ? `  [!] Ни один запрос не заблокирован.\n` +
        `  Возможные причины:\n` +
        `    1. Ingress изменения ещё не задеплоены (текущий лимит: 30 RPS, атака: ${ATTACK_RPS} RPS)\n` +
        `    2. ATTACK_RPS (${ATTACK_RPS}) ниже текущего лимита — попробуй --env ATTACK_RPS=35`
      : `  Защита работает: заблокировано ${blockedRateVal.toFixed(1)}% запросов.`;

  const lines = [
    '',
    '═══════════════════════════════════════════════════',
    '  Brute-Force Protection Test — Results',
    '═══════════════════════════════════════════════════',
    `  Всего запросов        : ${totalReqs}`,
    `  Фактический RPS       : ${actualRps} req/s`,
    `  Заблокировано (429/423): ${blocked} (${blockedRateVal.toFixed(1)}%)`,
    `  Отклонено (401)        : ${unauthorized}`,
    `  p95 latency            : ${p95.toFixed(0)} ms`,
    '',
    '  Thresholds:',
    ...thresholdResults,
    '═══════════════════════════════════════════════════',
    '',
    diagnosis,
    '',
  ];

  return { stdout: lines.join('\n') };
}
