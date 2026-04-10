/**
 * k6 rate limiter test
 *
 * Запуск:
 *   k6 run load-tests/rate-limiter.k6.js
 *   k6 run --env BASE_URL=https://sewaca.ru load-tests/rate-limiter.k6.js
 *
 * Два сценария:
 *   1. normal   — 20 RPS в течение 30s, 429 не ожидается
 *   2. burst    — рост до 200 RPS, должны появиться 429
 *
 * Thresholds:
 *   - в normal: доля 429 < 1%
 *   - в burst:  доля 429 > 20% (подтверждает что rate limiter работает)
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom metrics ───────────────────────────────────────────────────────────
const rateLimitedRate = new Rate('rate_limited_rate'); // доля 429 от всех запросов
const rateLimitedTotal = new Counter('rate_limited_total'); // счётчик 429
const requestDuration = new Trend('request_duration_ms', true); // latency в ms

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'https://diploma.sewaca.ru';

// Несколько лёгких публичных эндпоинтов для теста
const ENDPOINTS = [
  { url: `${BASE_URL}/news`, label: 'news' },
  { url: `${BASE_URL}/login`, label: 'login' },
  { url: `${BASE_URL}/schedule`, label: 'schedule' },
];

// ─── Scenarios ────────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Сценарий 1: нормальный трафик — ниже лимита (30 RPS)
    normal: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 15,
      maxVUs: 30,
      tags: { scenario: 'normal' },
    },

    // Сценарий 2: burst — превышаем лимит, ждём 429
    burst: {
      executor: 'ramping-arrival-rate',
      startRate: 30,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 200,
      stages: [
        { target: 80, duration: '10s' }, // разгон
        { target: 200, duration: '15s' }, // хорошо выше лимита в 30 RPS
        { target: 200, duration: '20s' }, // держим
        { target: 0, duration: '5s' }, // спад
      ],
      startTime: '35s', // стартует после normal
      tags: { scenario: 'burst' },
    },
  },

  thresholds: {
    // normal: почти никаких 429
    'rate_limited_rate{scenario:normal}': ['rate<0.01'],

    // burst: rate limiter должен срабатывать
    'rate_limited_rate{scenario:burst}': ['rate>0.20'],

    // общие
    http_req_failed: ['rate<0.10'], // не более 10% сбоев (5xx, network errors)
    'request_duration_ms{scenario:normal}': ['p(95)<2000'], // p95 < 2s в нормальном режиме
  },
};

// ─── Main function ────────────────────────────────────────────────────────────
export default function () {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];

  const res = http.get(endpoint.url, {
    tags: { endpoint: endpoint.label },
    timeout: '10s',
  });

  const is429 = res.status === 429;

  // Записываем метрики
  rateLimitedRate.add(is429);
  rateLimitedTotal.add(is429 ? 1 : 0);
  requestDuration.add(res.timings.duration);

  check(res, {
    'не 500': (r) => r.status < 500,
    '200 или 429': (r) => r.status === 200 || r.status === 429 || r.status === 301 || r.status === 302,
    'latency < 3s': (r) => r.timings.duration < 3000,
  });

  // В нормальном сценарии небольшой sleep чтобы не перегружать
  if (__ENV.SCENARIO !== 'burst') {
    sleep(0.05);
  }
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────
export function setup() {
  console.log(`\n🚀 Rate limiter test`);
  console.log(`   BASE_URL : ${BASE_URL}`);
  console.log(`   Лимит    : 30 RPS / 20 connections / burst ×5`);
  console.log(`   Сценарий normal : 20 RPS × 30s → 429 < 1%`);
  console.log(`   Сценарий burst  : до 200 RPS × 50s → 429 > 20%\n`);
}

export function handleSummary(data) {
  const normal429 = data.metrics['rate_limited_rate']?.values?.rate ?? 0;
  const burst429 = data.metrics['rate_limited_rate']?.values?.rate ?? 0;
  const total429 = data.metrics['rate_limited_total']?.values?.count ?? 0;
  const p95 = data.metrics['request_duration_ms']?.values?.['p(95)'] ?? 0;

  const lines = [
    '',
    '═══════════════════════════════════════════════',
    '  Rate Limiter Test — Summary',
    '═══════════════════════════════════════════════',
    `  Всего 429 заблокировано : ${total429}`,
    `  p95 latency             : ${p95.toFixed(1)} ms`,
    '',
    '  Thresholds:',
  ];

  for (const [name, metric] of Object.entries(data.metrics)) {
    if (name.startsWith('rate_limited_rate')) {
      const passed = metric.thresholds
        ? Object.entries(metric.thresholds)
            .map(([expr, t]) => `    ${t.ok ? '✓' : '✗'} ${expr}`)
            .join('\n')
        : '';
      lines.push(passed);
    }
  }

  lines.push('═══════════════════════════════════════════════', '');

  return {
    stdout: lines.join('\n'),
  };
}
