# Victoria Metrics Configuration

This Helm chart deploys Victoria Metrics for metrics collection and storage.

## Service Discovery

The scrape configuration uses Kubernetes pod discovery with the following logic:

1. **Discovers all pods** in the `default` namespace
2. **Filters by annotation**: `prometheus.io/scrape: "true"`
3. **Filters by port name**: Only scrapes ports named `metrics` (ignores `http` ports)
4. **Uses annotations** for configuration:
   - `prometheus.io/path` - metrics path (default: "/metrics")

## Configured Jobs

### kubernetes-pods

- **Job name**: `kubernetes-pods`
- **Namespace**: `default`
- **Scrapes**: All pods with `prometheus.io/scrape=true` annotation
- **Port filter**: Only ports named `metrics` (e.g., 9464)
- **Services**: Automatically includes backend, frontend, and any future services

**Labels added**:

- `pod` - Pod name
- `namespace` - Namespace name
- `service` - From `app.kubernetes.io/name` label

**Why one job?**

- ✅ Less configuration duplication
- ✅ Automatically discovers new services
- ✅ No duplicate scrape targets
- ✅ Consistent labeling across all services

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
