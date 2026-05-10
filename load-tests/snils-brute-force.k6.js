/**
 * k6 SNILS lookup brute-force protection test
 *
 * Проверяет, что /core-auth/auth/lookup блокирует перебор СНИЛС:
 *   — 10 попыток с одного IP → 429 + Retry-After
 *   — попытки 11+ возвращают 429, не ищут в БД
 *
 * Запуск:
 *   k6 run load-tests/snils-brute-force.k6.js
 *   k6 run --env BASE_URL=https://diploma.sewaca.ru load-tests/snils-brute-force.k6.js
 *   k6 run --env ATTACK_RPS=3 load-tests/snils-brute-force.k6.js
 *
 * Лимит: 10 попыток / 15 мин с одного IP.
 * ATTACK_RPS (default: 3) — должен превышать ingress-лимит core-auth (3 RPS).
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

http.setResponseCallback(http.expectedStatuses(200, 201, 400, 401, 404, 422, 429));

// ─── Metrics ──────────────────────────────────────────────────────────────────
const blockedRate = new Rate('snils_blocked_rate');
const blockedTotal = new Counter('snils_blocked_total');
const notFoundTotal = new Counter('snils_not_found_total');
const lookupDuration = new Trend('snils_lookup_duration_ms', true);

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://diploma.sewaca.ru';
const LOOKUP_URL = `${BASE_URL}/core-auth/auth/lookup`;
const ATTACK_RPS = parseInt(__ENV.ATTACK_RPS || '3', 10);

// Случайные СНИЛС для имитации перебора
function randomSnils() {
  return String(Math.floor(Math.random() * 90000000000) + 10000000000);
}

// Случайные фамилии для перебора
const LAST_NAMES = [
  'Иванов',
  'Петров',
  'Сидоров',
  'Смирнов',
  'Кузнецов',
  'Попов',
  'Лебедев',
  'Козлов',
  'Новиков',
  'Морозов',
  'Волков',
  'Соловьев',
  'Федоров',
  'Васильев',
  'Орлов',
];

const HEADERS = { 'Content-Type': 'application/json', Accept: '*/*' };

// ─── Scenarios ────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Сценарий 1: один «атакующий», форсированный RPS
    // После 10 попыток с одного IP все запросы должны возвращать 429
    single_ip: {
      executor: 'constant-arrival-rate',
      rate: ATTACK_RPS,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: ATTACK_RPS * 5,
      maxVUs: ATTACK_RPS * 10,
      tags: { scenario: 'single_ip' },
    },

    // Сценарий 2: 5 «атакующих» перебирают СНИЛС одновременно
    // Все идут с одного IP (k6-runner) → один общий счётчик
    concurrent: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 10,
      maxDuration: '60s',
      startTime: '35s',
      tags: { scenario: 'concurrent' },
    },
  },

  thresholds: {
    // После 10 попыток c одного IP все остальные (~70%) должны блокироваться
    'snils_blocked_rate{scenario:single_ip}': ['rate>0.60'],
    // Concurrent: 50 суммарных запросов от 5 VU — >40% заблокированы
    'snils_blocked_rate{scenario:concurrent}': ['rate>0.40'],
    // Latency
    'snils_lookup_duration_ms{scenario:single_ip}': ['p(95)<5000'],
  },
};

// ─── Main ─────────────────────────────────────────────────────────────────────
let firstBlockedIter = -1;

export default function () {
  const iter = __ITER;
  const payload = JSON.stringify({
    snils: randomSnils(),
    last_name: LAST_NAMES[iter % LAST_NAMES.length],
  });

  const res = http.post(LOOKUP_URL, payload, {
    headers: HEADERS,
    tags: { attempt: String(iter) },
    timeout: '10s',
  });

  lookupDuration.add(res.timings.duration);

  const isBlocked = res.status === 429;
  const isNotFound = res.status === 404;

  blockedRate.add(isBlocked);
  if (isBlocked) {
    blockedTotal.add(1);
    if (firstBlockedIter === -1) {
      firstBlockedIter = iter;
      console.log(`[VU ${__VU}] BLOCKED at iter=${iter} | Retry-After: ${res.headers['Retry-After'] ?? '?'}s`);
    }
  }
  if (isNotFound) notFoundTotal.add(1);

  check(res, {
    'не 5xx': (r) => r.status < 500,
    'ожидаемый статус': (r) => [200, 404, 429].includes(r.status),
    '429 содержит Retry-After': (r) => r.status !== 429 || !!r.headers['Retry-After'],
  });

  if (iter % 5 === 0) {
    const label = isBlocked ? '🔒 429 BLOCKED' : isNotFound ? '✗ 404 not found' : `? ${res.status}`;
    console.log(`[VU ${__VU}] iter=${iter} | ${label} | ${res.timings.duration.toFixed(0)}ms`);
  }

  sleep(0.05);
}

// ─── Setup ────────────────────────────────────────────────────────────────────
export function setup() {
  console.log('\n=== SNILS Brute-Force Protection Test ===');
  console.log(`  URL         : ${LOOKUP_URL}`);
  console.log(`  Attack RPS  : ${ATTACK_RPS} req/sec`);
  console.log(`  Лимит       : 10 попыток / 15 мин с одного IP`);
  console.log('');
  console.log(`  single_ip  : ${ATTACK_RPS} RPS × 30s = ~${ATTACK_RPS * 30} запросов`);
  console.log('  concurrent : 5 VU × 10 попыток = 50 запросов');
  console.log('==========================================\n');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const blocked = data.metrics['snils_blocked_total']?.values?.count ?? 0;
  const notFound = data.metrics['snils_not_found_total']?.values?.count ?? 0;
  const blockedRateVal = (data.metrics['snils_blocked_rate']?.values?.rate ?? 0) * 100;
  const p95 = data.metrics['snils_lookup_duration_ms']?.values?.['p(95)'] ?? 0;
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
      ? '  [!] Ни один запрос не заблокирован. Проверь деплой core-auth.'
      : `  Защита работает: заблокировано ${blockedRateVal.toFixed(1)}% запросов.`;

  const lines = [
    '',
    '═══════════════════════════════════════════════════',
    '  SNILS Brute-Force Protection Test — Results',
    '═══════════════════════════════════════════════════',
    `  Всего запросов         : ${totalReqs}`,
    `  Фактический RPS        : ${actualRps} req/s`,
    `  Заблокировано (429)    : ${blocked} (${blockedRateVal.toFixed(1)}%)`,
    `  Не найдено (404)       : ${notFound}`,
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
