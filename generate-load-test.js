import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const harPath = '/Users/sewaca/Downloads/84.252.134.216_Archive [26-01-09 16-38-45].har';
const harContent = JSON.parse(fs.readFileSync(harPath, 'utf8'));

const baseUrl = 'http://84.252.134.216';
const requests = new Map();

harContent.log.entries.forEach((entry) => {
  const url = entry.request.url;
  if (url.startsWith(baseUrl)) {
    const urlPath = url.replace(baseUrl, '') || '/';
    const method = entry.request.method;
    const key = `${method} ${urlPath.split('?')[0]}`;

    if (!requests.has(key)) {
      const headers = {};
      entry.request.headers.forEach((h) => {
        const name = h.name.toLowerCase();
        if (name !== 'host' && name !== 'connection' && name !== 'accept-encoding') {
          headers[h.name] = h.value;
        }
      });

      const cookies = {};
      if (entry.request.cookies) {
        entry.request.cookies.forEach((c) => {
          cookies[c.name] = c.value;
        });
      }

      requests.set(key, {
        method,
        url: urlPath.split('?')[0],
        headers,
        cookies,
        queryString: url.includes('?') ? url.split('?')[1] : null,
      });
    }
  }
});

const requestsArray = Array.from(requests.values());

const k6Script = `import { check } from 'k6';
import http from 'k6/http';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import exec from 'k6/execution';

const baseUrl = 'http://84.252.134.216';
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0';

const harRequests = ${JSON.stringify(requestsArray, null, 2)};

export const options = {
  scenarios: {
    har_requests: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
    recipes_random: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

function makeHarRequest() {
  const request = harRequests[Math.floor(Math.random() * harRequests.length)];
  const url = baseUrl + request.url;
  
  const params = {
    headers: {
      ...request.headers,
      Cookie: \`auth_token=\${authToken}\`,
    },
  };
  
  let fullUrl = url;
  if (request.queryString) {
    fullUrl += '?' + request.queryString;
  }
  
  const response = http.request(request.method, fullUrl, null, params);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}

function makeRecipesRequest() {
  const recipeId = randomIntBetween(1, 80);
  const rscValue = Math.random().toString(36).substring(7);
  const url = \`\${baseUrl}/recipes/\${recipeId}?_rsc=\${rscValue}\`;
  
  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      rsc: '1',
      'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22recipes%22%2C%7B%22children%22%3A%5B%5B%22id%22%2C%22' + recipeId + '%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%2Cfalse%5D%7D%2Cnull%2Cnull%2Cfalse%5D%7D%2Cnull%2C%22refetch%22%2Cfalse%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
      'next-url': '/',
      Priority: 'u=0',
      Referer: 'http://84.252.134.216/',
      Cookie: \`auth_token=\${authToken}\`,
    },
  };
  
  const response = http.get(url, params);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}

export default function () {
  const scenarioName = exec.scenario.name;
  if (scenarioName === 'har_requests') {
    makeHarRequest();
  } else if (scenarioName === 'recipes_random') {
    makeRecipesRequest();
  }
}
`;

fs.writeFileSync(join(__dirname, 'load-test-har.js'), k6Script);
console.log(`Generated load-test-har.js with ${requestsArray.length} unique requests from HAR file`);
