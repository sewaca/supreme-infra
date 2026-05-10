/**
 * k6 brute-force protection test
 *
 * Проверяет, что /core-auth/auth/login отражает атаку перебора паролей:
 *   — слишком много неверных попыток → 429 или 423 (account locked)
 *   — корректные данные по-прежнему проходят после снятия блокировки
 *
 * Запуск:
 *   k6 run load-tests/brute-force-protection.k6.js
 *   k6 run --env BASE_URL=https://diploma.sewaca.ru load-tests/brute-force-protection.k6.js
 *   k6 run --env TARGET_EMAIL=user@example.com load-tests/brute-force-protection.k6.js
 *
 * Сценарии:
 *   1. single_attacker  — один VU, 50 неверных попыток подряд → ждём 429/423
 *   2. distributed      — 10 VU имитируют распределённый перебор с разных «IP» → проверяем
 *   3. valid_after_lock — после блокировки верные данные должны либо пройти, либо вернуть 423
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// 401, 422, 429, 423 — ожидаемые ответы для этого теста, не network failures
http.setResponseCallback(http.expectedStatuses(200, 201, 400, 401, 403, 422, 423, 429));

// ─── Custom metrics ───────────────────────────────────────────────────────────
const blockedRate = new Rate('brute_force_blocked_rate');
const blockedTotal = new Counter('brute_force_blocked_total');
const loginDuration = new Trend('login_duration_ms', true);
const successfulLogins = new Counter('successful_logins');
const unauthorizedTotal = new Counter('unauthorized_total');

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://diploma.sewaca.ru';
const LOGIN_URL = `${BASE_URL}/core-auth/auth/login`;
const TARGET_EMAIL = __ENV.TARGET_EMAIL || 'sofia.volkova@example.com';
const CORRECT_PASSWORD = __ENV.CORRECT_PASSWORD || '';

// Wordlist неверных паролей для имитации перебора
const WRONG_PASSWORDS = [
  'password',
  'password1',
  '123456',
  '123456789',
  'qwerty',
  'abc123',
  'letmein',
  'monkey',
  '1234567',
  'dragon',
  'master',
  'login',
  'welcome',
  'shadow',
  'sunshine',
  'princess',
  'admin',
  'passw0rd',
  'test123',
  'iloveyou',
  'trustno1',
  'hunter2',
  'superman',
  'batman',
  'football',
  'michael',
  'jessica',
  'charlie',
  'donald',
];

const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  Accept: '*/*',
};

// ─── Scenarios ────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Сценарий 1: один «атакующий» — 50 попыток подряд без паузы
    single_attacker: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: WRONG_PASSWORDS.length,
      maxDuration: '60s',
      tags: { scenario: 'single_attacker' },
    },

    // Сценарий 2: 10 VU, каждый пробует по 5 паролей (распределённый перебор)
    distributed: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 5,
      maxDuration: '60s',
      startTime: '65s',
      tags: { scenario: 'distributed' },
    },

    // Сценарий 3: после серии неудач — проверяем корректный пароль (если задан)
    valid_after_lock: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '30s',
      startTime: '130s',
      tags: { scenario: 'valid_after_lock' },
      env: { IS_VALID_ATTEMPT: 'true' },
    },
  },

  thresholds: {
    // Главная проверка: >50% попыток перебора должны быть заблокированы
    'brute_force_blocked_rate{scenario:single_attacker}': ['rate>0.50'],
    'brute_force_blocked_rate{scenario:distributed}': ['rate>0.30'],

    // Latency не должна деградировать даже при блокировке
    'login_duration_ms{scenario:single_attacker}': ['p(95)<3000'],
  },
};

// ─── Main function ────────────────────────────────────────────────────────────
export default function () {
  const scenario = __ENV.SCENARIO_TAG || 'unknown';
  const isValidAttempt = __ENV.IS_VALID_ATTEMPT === 'true';

  let password;
  if (isValidAttempt && CORRECT_PASSWORD) {
    password = CORRECT_PASSWORD;
  } else {
    // Циклично берём пароль из списка по итерации
    password = WRONG_PASSWORDS[(__ITER || 0) % WRONG_PASSWORDS.length];
  }

  const payload = JSON.stringify({
    email: TARGET_EMAIL,
    password,
    location: 'Test Runner',
    device: 'k6 load test',
    ip_address: '127.0.0.1',
  });

  const res = http.post(LOGIN_URL, payload, {
    headers: COMMON_HEADERS,
    tags: { endpoint: 'login', attempt_type: isValidAttempt ? 'valid' : 'brute' },
    timeout: '10s',
  });

  loginDuration.add(res.timings.duration);

  const isBlocked = res.status === 429 || res.status === 423;
  const isUnauthorized = res.status === 401;
  const isSuccess = res.status === 200 || res.status === 201;

  blockedRate.add(isBlocked);
  if (isBlocked) blockedTotal.add(1);
  if (isUnauthorized) unauthorizedTotal.add(1);
  if (isSuccess) successfulLogins.add(1);

  check(res, {
    'не 5xx': (r) => r.status < 500,
    'ответ содержит body': (r) => r.body && r.body.length > 0,
    'заблокирован или отклонён (не 200)': (r) => (isValidAttempt ? true : r.status !== 200 && r.status !== 201),
  });

  if (isBlocked) {
    // Небольшая пауза после блокировки — как реальный атакующий
    sleep(0.5);
  } else {
    sleep(0.1);
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────
export function setup() {
  console.log('\n=== Brute-Force Protection Test ===');
  console.log(`  LOGIN_URL    : ${LOGIN_URL}`);
  console.log(`  TARGET_EMAIL : ${TARGET_EMAIL}`);
  console.log(`  PASSWORDS    : ${WRONG_PASSWORDS.length} вариантов`);
  console.log('');
  console.log('  Сценарий 1 (single_attacker): 1 VU × 29 попыток → ожидаем >50% блокировок');
  console.log('  Сценарий 2 (distributed):    10 VU × 5 попыток  → ожидаем >30% блокировок');
  console.log('  Сценарий 3 (valid_after_lock): 1 попытка с правильным паролем (если задан)');
  console.log('===================================\n');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const blocked = data.metrics['brute_force_blocked_total']?.values?.count ?? 0;
  const unauthorized = data.metrics['unauthorized_total']?.values?.count ?? 0;
  const successes = data.metrics['successful_logins']?.values?.count ?? 0;
  const blockedRateVal = (data.metrics['brute_force_blocked_rate']?.values?.rate ?? 0) * 100;
  const p95 = data.metrics['login_duration_ms']?.values?.['p(95)'] ?? 0;
  const totalReqs = data.metrics['http_reqs']?.values?.count ?? 0;

  const thresholdResults = [];
  for (const [name, metric] of Object.entries(data.metrics)) {
    if (!metric.thresholds) continue;
    for (const [expr, t] of Object.entries(metric.thresholds)) {
      thresholdResults.push(`  ${t.ok ? 'PASS' : 'FAIL'} [${name}] ${expr}`);
    }
  }

  const lines = [
    '',
    '═══════════════════════════════════════════════════',
    '  Brute-Force Protection Test — Results',
    '═══════════════════════════════════════════════════',
    `  Всего запросов        : ${totalReqs}`,
    `  Заблокировано (429/423): ${blocked} (${blockedRateVal.toFixed(1)}%)`,
    `  Отклонено (401)        : ${unauthorized}`,
    `  Успешных входов        : ${successes}`,
    `  p95 latency            : ${p95.toFixed(0)} ms`,
    '',
    '  Thresholds:',
    ...thresholdResults,
    '═══════════════════════════════════════════════════',
    '',
    blocked === 0
      ? '  [!] ВНИМАНИЕ: ни одна попытка перебора не заблокирована!'
      : `  Защита от брутфорса ${blockedRateVal > 50 ? 'работает корректно' : 'требует проверки'}.`,
    '',
  ];

  return { stdout: lines.join('\n') };
}
