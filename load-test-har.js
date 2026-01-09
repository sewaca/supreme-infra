import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { check } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';

const baseUrl = 'http://84.252.134.216';
const authToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0';

const harRequests = [
  {
    method: 'GET',
    url: '/',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/login?from=%2F',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      'Upgrade-Insecure-Requests': '1',
      Priority: 'u=0, i',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/913cece3b2a065bd.css',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: 'text/css,*/*;q=0.1',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    cookies: {},
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/4c5a805a27b7d7c8.css',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: 'text/css,*/*;q=0.1',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    cookies: {},
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/10057a8ad3ce7b34.js',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/174bdf34df2006e0.js',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/ca8713d7b2f709e8.js',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/3723ff5f507c6ff5.js',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/turbopack-46978c92a4c3b8d1.js',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/a1740946de62ead4.js',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/a5961c21d32e3284.js',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/130c983f08012489.js',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
  {
    method: 'GET',
    url: '/_next/static/chunks/38e4390a39e8aff5.js',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
  {
    method: 'GET',
    url: '/recipes/76',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      rsc: '1',
      'next-router-prefetch': '1',
      'next-router-segment-prefetch': '/_tree',
      'next-url': '/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      Priority: 'u=5',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: '_rsc=1r34m',
  },
  {
    method: 'GET',
    url: '/recipes/77',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      rsc: '1',
      'next-router-prefetch': '1',
      'next-router-segment-prefetch': '/_tree',
      'next-url': '/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      Priority: 'u=5',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: '_rsc=1r34m',
  },
  {
    method: 'GET',
    url: '/recipes/78',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      rsc: '1',
      'next-router-prefetch': '1',
      'next-router-segment-prefetch': '/_tree',
      'next-url': '/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      Priority: 'u=5',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: '_rsc=1r34m',
  },
  {
    method: 'GET',
    url: '/recipes/79',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      rsc: '1',
      'next-router-prefetch': '1',
      'next-router-segment-prefetch': '/_tree',
      'next-url': '/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      Priority: 'u=5',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: '_rsc=1r34m',
  },
  {
    method: 'GET',
    url: '/recipes/80',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      rsc: '1',
      'next-router-prefetch': '1',
      'next-router-segment-prefetch': '/_tree',
      'next-url': '/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      Priority: 'u=5',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: '_rsc=1r34m',
  },
  {
    method: 'GET',
    url: '/recipes/81',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      rsc: '1',
      'next-router-prefetch': '1',
      'next-router-segment-prefetch': '/_tree',
      'next-url': '/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      Priority: 'u=5',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: '_rsc=1r34m',
  },
  {
    method: 'GET',
    url: '/proposed-recipes',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      rsc: '1',
      'next-router-prefetch': '1',
      'next-router-segment-prefetch': '/_tree',
      'next-url': '/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      Priority: 'u=5',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: '_rsc=1r34m',
  },
  {
    method: 'GET',
    url: '/submit-recipe',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      rsc: '1',
      'next-router-prefetch': '1',
      'next-router-segment-prefetch': '/_tree',
      'next-url': '/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      Priority: 'u=5',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: '_rsc=1r34m',
  },
  {
    method: 'GET',
    url: '/profile',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      rsc: '1',
      'next-router-prefetch': '1',
      'next-router-segment-prefetch': '/_tree',
      'next-url': '/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      Priority: 'u=5',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: '_rsc=1r34m',
  },
  {
    method: 'GET',
    url: '/favicon.ico',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:146.0) Gecko/20100101 Firefox/146.0',
      Accept: 'image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: 'http://84.252.134.216/',
      Cookie:
        'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
      Priority: 'u=6',
    },
    cookies: {
      auth_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJuYW1lIjoiQWRtaW4gVXNlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2Nzk2MjM1MCwiZXhwIjoxNzY4NTY3MTUwfQ.VfNXku6EQ4BqSRlaH47RJq_HYsXFt2xTc2FOM9mK0t0',
    },
    queryString: null,
  },
];

export const options = {
  scenarios: {
    har_requests: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
    recipes_random: {
      executor: 'constant-arrival-rate',
      rate: 50,
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

  const headers = {};
  for (const [key, value] of Object.entries(request.headers)) {
    headers[key] = value;
  }
  headers.Cookie = `auth_token=${authToken}`;

  const params = {
    headers: headers,
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
