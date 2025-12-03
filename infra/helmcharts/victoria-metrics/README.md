# Victoria Metrics Configuration

This Helm chart deploys Victoria Metrics for metrics collection and storage.

## Service Discovery

The scrape configuration uses Kubernetes pod discovery with the following logic:

1. **Discovers pods** with annotation `prometheus.io/scrape: "true"`
2. **Filters by label** `app.kubernetes.io/name` matching the service name
3. **Uses annotations** for configuration:
   - `prometheus.io/port` - metrics port (e.g., "9464")
   - `prometheus.io/path` - metrics path (e.g., "/metrics")

## Configured Jobs

### Backend Service
- **Job name**: `backend`
- **Namespace**: `default`
- **Label filter**: `app.kubernetes.io/name=backend-service`
- **Metrics port**: From `prometheus.io/port` annotation
- **Metrics path**: From `prometheus.io/path` annotation

### Frontend Service
- **Job name**: `frontend`
- **Namespace**: `default`
- **Label filter**: `app.kubernetes.io/name=frontend-service`
- **Metrics port**: From `prometheus.io/port` annotation
- **Metrics path**: From `prometheus.io/path` annotation

## Troubleshooting

### Check if Victoria Metrics is running
```bash
kubectl get pods -n monitoring
kubectl logs -n monitoring victoria-metrics-victoria-metrics-single-server-0
```

### Check scrape targets
```bash
kubectl port-forward -n monitoring svc/victoria-metrics-victoria-metrics-single-server 8428:8428
```
Then open http://localhost:8428/targets in your browser to see all discovered targets.

### Check if backend pod exposes metrics
```bash
# Get backend pod name
kubectl get pods -l app.kubernetes.io/name=backend-service

# Test metrics endpoint
kubectl exec -it <backend-pod-name> -- wget -O- http://localhost:9464/metrics
```

### Check pod labels and annotations
```bash
kubectl get pods -l app.kubernetes.io/name=backend-service -o yaml | grep -A 10 "labels:\|annotations:"
```

### Query metrics directly from Victoria Metrics
```bash
kubectl port-forward -n monitoring svc/victoria-metrics-victoria-metrics-single-server 8428:8428
```
Then open http://localhost:8428/vmui and try queries like:
- `up` - shows all scraped targets
- `http_request_duration_seconds_count` - HTTP request metrics
- `process_cpu_seconds_total` - CPU usage

## Configuration Files

- `values.yaml` - Main configuration including scrape configs
- `Chart.yaml` - Chart metadata and dependencies

## Dependencies

This chart depends on:
- `victoria-metrics-single` from https://victoriametrics.github.io/helm-charts/

Update dependencies:
```bash
helm dependency update ./infra/helmcharts/victoria-metrics
```
