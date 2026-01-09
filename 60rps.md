 ~/Desktop/supreme-infra  k6 run load-test.js

         /\      Grafana   /‾‾/
    /\  /  \     |\  __   /  /

/ \/ \ | |/ / / ‾‾\
/ \ | ( | (‾) |
/ \***\*\_\_\*\*** \ |\_|\_\ \_\_\_\_\_/

     execution: local
        script: load-test.js
        output: -

     scenarios: (100.00%) 1 scenario, 100 max VUs, 10m30s max duration (incl. graceful stop):
              * constant_request_rate: 30.00 iterations/s for 10m0s (maxVUs: 50-100, gracefulStop: 30s)

█ THRESHOLDS

    http_req_duration
    ✓ 'p(95)<2000' p(95)=65.02ms

    http_req_failed
    ✓ 'rate<0.01' rate=0.00%

█ TOTAL RESULTS

    checks_total.......: 36000   59.994734/s
    checks_succeeded...: 100.00% 36000 out of 36000
    checks_failed......: 0.00%   0 out of 36000

    ✓ status is 200
    ✓ response time < 2s

    HTTP
    http_req_duration..............: avg=52.38ms  min=38.58ms med=48.43ms max=887.7ms p(90)=57.53ms  p(95)=65.02ms
      { expected_response:true }...: avg=52.38ms  min=38.58ms med=48.43ms max=887.7ms p(90)=57.53ms  p(95)=65.02ms
    http_req_failed................: 0.00%  0 out of 36000
    http_reqs......................: 36000  59.994734/s

    EXECUTION
    iteration_duration.............: avg=105.12ms min=84.71ms med=97.16ms max=1.12s   p(90)=111.81ms p(95)=144.02ms
    iterations.....................: 18000  29.997367/s
    vus............................: 3      min=2          max=12
    vus_max........................: 50     min=50         max=50

    NETWORK
    data_received..................: 159 MB 266 kB/s
    data_sent......................: 13 MB  21 kB/s

running (10m00.1s), 000/050 VUs, 18000 complete and 0 interrupted iterations
constant_request_rate ✓ [============] 000/050 VUs 10m0s 30.00 iters/s
