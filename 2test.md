✘  ~/Desktop/supreme-infra  k6 run load-test-har.js

         /\      Grafana   /‾‾/
    /\  /  \     |\  __   /  /

/ \/ \ | |/ / / ‾‾\
/ \ | ( | (‾) |
/ \***\*\_\_\*\*** \ |\_|\_\ \_\_\_\_\_/

     execution: local
        script: load-test-har.js
        output: -

     scenarios: (100.00%) 2 scenarios, 400 max VUs, 10m30s max duration (incl. graceful stop):
              * har_requests: 50.00 iterations/s for 10m0s (maxVUs: 100-200, gracefulStop: 30s)
              * recipes_random: 50.00 iterations/s for 10m0s (maxVUs: 100-200, gracefulStop: 30s)

WARN[0222] The test has generated metrics with 100039 unique time series, which is higher than the suggested limit of 100000 and could cause high memory usage. Consider not using high-cardinality values like unique IDs as metric tags or, if you need them in the URL, use the name metric tag or URL grouping. See https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/ for details. component=metrics-engine-ingester
WARN[0444] The test has generated metrics with 200020 unique time series, which is higher than the suggested limit of 100000 and could cause high memory usage. Consider not using high-cardinality values like unique IDs as metric tags or, if you need them in the URL, use the name metric tag or URL grouping. See https://grafana.com/docs/k6/latest/using-k6/tags-and-groups/ for details. component=metrics-engine-ingester

█ THRESHOLDS

    http_req_duration
    ✓ 'p(95)<2000' p(95)=414ms

    http_req_failed
    ✗ 'rate<0.01' rate=2.31%

█ TOTAL RESULTS

    checks_total.......: 59993  99.948934/s
    checks_succeeded...: 97.68% 58606 out of 59993
    checks_failed......: 2.31%  1387 out of 59993

    ✗ status is 200
      ↳  97% — ✓ 58606 / ✗ 1387

    HTTP
    http_req_duration..............: avg=139.83ms min=38.41ms med=69.13ms max=6.47s p(90)=256.9ms  p(95)=414ms
      { expected_response:true }...: avg=139.68ms min=38.41ms med=69.21ms max=6.47s p(90)=257.53ms p(95)=413.54ms
    http_req_failed................: 2.31%  1387 out of 59993
    http_reqs......................: 59993  99.948934/s

    EXECUTION
    dropped_iterations.............: 7      0.011662/s
    iteration_duration.............: avg=140.23ms min=38.56ms med=69.45ms max=6.47s p(90)=257.23ms p(95)=414.81ms
    iterations.....................: 59993  99.948934/s
    vus............................: 10     min=5             max=162
    vus_max........................: 207    min=200           max=207

    NETWORK
    data_received..................: 1.2 GB 2.0 MB/s
    data_sent......................: 41 MB  68 kB/s

running (10m00.2s), 000/207 VUs, 59993 complete and 0 interrupted iterations
har_requests ✓ [============================] 000/100 VUs 10m0s 50.00 iters/s
recipes_random ✓ [============================] 000/107 VUs 10m0s 50.00 iters/s
ERRO[0601] thresholds on metrics 'http_req_failed' have been crossed
