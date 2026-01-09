import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';

const baseUrl = 'http://84.252.134.216';
const loggerUrl = 'http://localhost:3001/register';
const authToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0';

const existingUsers = [
  { email: 'admin@example.com', password: 'admin@example.com', name: '' },
  { email: 'testuser1@example.com', password: 'testuser1@example.com', name: '' },
  { email: 'testuser2@example.com', password: 'testuser2@example.com', name: '' },
  { email: 'testuser3@example.com', password: 'testuser3@example.com', name: '' },
  { email: 'testuser4@example.com', password: 'testuser4@example.com', name: '' },
];

function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUniqueEmail() {
  const timestamp = Date.now();
  const randomStr = generateRandomString(6);
  return `loadtestreg${timestamp}${randomStr}@example.com`;
}

export const options = {
  scenarios: {
    login: {
      executor: 'constant-arrival-rate',
      rate: 150,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 75,
      maxVUs: 300,
    },
    register: {
      executor: 'constant-arrival-rate',
      rate: 150,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 75,
      maxVUs: 300,
    },
    recipes_random: {
      executor: 'constant-arrival-rate',
      rate: 150,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 75,
      maxVUs: 300,
    },
    homepage: {
      executor: 'constant-arrival-rate',
      rate: 150,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 75,
      maxVUs: 300,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

function makeLoginRequest() {
  const user = existingUsers[Math.floor(Math.random() * existingUsers.length)];
  const url = `${baseUrl}/core-auth-bff/auth/login`;

  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
    name: user.name,
  });

  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Content-Type': 'application/json',
      Priority: 'u=0',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      Referer: 'http://84.252.134.216/login?from=%2F',
    },
  };

  const response = http.post(url, payload, params);

  check(response, {
    'login status is 200': (r) => r.status === 200,
  });
}

function makeRegisterRequest() {
  const email = generateUniqueEmail();
  const password = email;
  const name = email;
  const url = `${baseUrl}/core-auth-bff/auth/register`;

  const payload = JSON.stringify({
    email: email,
    password: password,
    name: name,
  });

  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      'Content-Type': 'application/json',
      Priority: 'u=0',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
      Referer: 'http://84.252.134.216/register',
    },
  };

  const response = http.post(url, payload, params);

  if (response.status === 200 || response.status === 201) {
    const userData = { email, password, name };
    try {
      http.post(loggerUrl, JSON.stringify(userData), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '1s',
      });
    } catch {
      // Ignore logger errors
    }
  }

  check(response, {
    'register status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });
}

function makeRecipesRequest() {
  const recipeId = randomIntBetween(1, 80);
  const rscValue = Math.random().toString(36).substring(7);
  const url = `${baseUrl}/recipes/${recipeId}?_rsc=${rscValue}`;

  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      rsc: '1',
      'next-router-state-tree':
        '%5B%22%22%2C%7B%22children%22%3A%5B%22recipes%22%2C%7B%22children%22%3A%5B%5B%22id%22%2C%22' +
        recipeId +
        '%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%2Cfalse%5D%7D%2Cnull%2Cnull%2Cfalse%5D%7D%2Cnull%2C%22refetch%22%2Cfalse%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
      'next-url': '/',
      Priority: 'u=0',
      Referer: 'http://84.252.134.216/',
      Cookie: `auth_token=${authToken}`,
    },
  };

  const response = http.get(url, params);

  check(response, {
    'recipes status is 200': (r) => r.status === 200,
  });
}

function makeHomepageRequest() {
  const url = `${baseUrl}/`;

  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Upgrade-Insecure-Requests': '1',
      Priority: 'u=0, i',
      Referer: 'http://84.252.134.216/login?from=%2F',
      Cookie: `auth_token=${authToken}`,
    },
  };

  const response = http.get(url, params);

  check(response, {
    'homepage status is 200': (r) => r.status === 200,
  });
}

export default function () {
  const scenarioName = exec.scenario.name;
  if (scenarioName === 'login') {
    makeLoginRequest();
  } else if (scenarioName === 'register') {
    makeRegisterRequest();
  } else if (scenarioName === 'recipes_random') {
    makeRecipesRequest();
  } else if (scenarioName === 'homepage') {
    makeHomepageRequest();
  }
}

export function handleSummary() {
  return {};
}
