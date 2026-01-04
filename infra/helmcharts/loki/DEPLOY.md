# Grafana Loki Deployment Guide

This guide explains how to deploy Grafana Loki for log aggregation from microservices.

## Overview

Grafana Loki is a log aggregation system that collects logs from your microservices via OpenTelemetry Protocol (OTLP). The logs are then available for querying in Grafana.

## Architecture

```
Microservices (backend/frontend)
    |
    | OTLP HTTP (logs)
    v
Loki Gateway (port 80)
    |
    v
Loki SingleBinary (port 3100)
    |
    v
Persistent Volume (filesystem storage)
```

## Prerequisites

1. Kubernetes cluster with monitoring namespace
2. Helm 3.x installed
3. Grafana already deployed (will be configured as datasource)
4. Storage class available for persistent volumes

## Installation Steps

### 1. Add Grafana Helm Repository

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### 2. Install Loki

```bash
# Install Loki in monitoring namespace
helm install loki ./infra/helmcharts/loki \
  --namespace monitoring \
  --create-namespace
```

### 3. Verify Installation

```bash
# Check Loki pods
kubectl get pods -n monitoring -l app.kubernetes.io/name=loki

# Check Loki gateway
kubectl get svc -n monitoring loki-gateway

# Check logs
kubectl logs -n monitoring -l app.kubernetes.io/name=loki --tail=50
```

### 4. Update Grafana Datasource

The Grafana datasource configuration is already included in the Grafana Helm chart. If you need to update it manually:

```bash
# Upgrade Grafana with Loki datasource
helm upgrade grafana ./infra/helmcharts/grafana \
  --namespace monitoring
```

### 5. Install Dependencies in Microservices

```bash
# Install OpenTelemetry logs dependencies
pnpm install
```

### 6. Deploy Microservices

After installing dependencies, rebuild and redeploy your microservices:

```bash
# Build services
cd services/backend && pnpm run build
cd services/frontend && pnpm run build

# Deploy via your CI/CD pipeline or manually
# The services will automatically start sending logs to Loki
```

## Configuration

### Loki Configuration

Key configuration options in `values.yaml`:

- **Retention**: 31 days (744h)
- **Storage**: Filesystem with 10Gi persistent volume
- **Deployment Mode**: SingleBinary (simplified deployment)
- **Ingestion Rate**: 10MB/s with 20MB burst

### Microservice Configuration

Each microservice is configured to send logs via OTLP:

- **Backend**: Sends logs from NestJS application
- **Frontend**: Sends logs from Next.js application
- **Endpoint**: `http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs`

The endpoint can be customized via environment variable:
```yaml
env:
  LOKI_ENDPOINT: "http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs"
```

## Querying Logs in Grafana

### Access Grafana

1. Get Grafana service endpoint:
```bash
kubectl get svc -n monitoring grafana
```

2. Port-forward if needed:
```bash
kubectl port-forward -n monitoring svc/grafana 3000:80
```

3. Open http://localhost:3000 (default credentials: admin/admin)

### LogQL Query Examples

In Grafana Explore, select "Loki" datasource and try these queries:

```logql
# All logs from backend service
{service_name="backend"}

# All logs from frontend service
{service_name="frontend"}

# Error logs from backend
{service_name="backend"} |= "error"

# Logs with specific log level
{service_name="backend", level="error"}

# Logs from specific route
{service_name="backend"} |= "/api/recipes"

# Logs with JSON parsing
{service_name="backend"} | json | level="error"

# Rate of errors per minute
rate({service_name="backend"} |= "error" [1m])

# Count logs by service
sum by (service_name) (count_over_time({service_name=~".+"}[5m]))
```

### Creating Dashboards

1. Go to Dashboards → New Dashboard
2. Add panel
3. Select Loki datasource
4. Enter LogQL query
5. Configure visualization (logs, time series, etc.)
6. Save dashboard

## Troubleshooting

### Loki Not Receiving Logs

1. Check Loki is running:
```bash
kubectl get pods -n monitoring -l app.kubernetes.io/name=loki
```

2. Check Loki logs:
```bash
kubectl logs -n monitoring -l app.kubernetes.io/name=loki
```

3. Test Loki endpoint from within cluster:
```bash
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n monitoring -- \
  curl http://loki-gateway/ready
```

### Microservices Not Sending Logs

1. Check microservice logs for OTLP errors:
```bash
kubectl logs -n <namespace> <pod-name>
```

2. Verify LOKI_ENDPOINT environment variable:
```bash
kubectl get deployment <service-name> -n <namespace> -o yaml | grep LOKI_ENDPOINT
```

3. Test connectivity from microservice pod:
```bash
kubectl exec -it <pod-name> -n <namespace> -- \
  curl http://loki-gateway.monitoring.svc.cluster.local/ready
```

### No Logs in Grafana

1. Verify Loki datasource in Grafana:
   - Go to Configuration → Data Sources
   - Check Loki datasource URL: `http://loki-gateway.monitoring.svc.cluster.local`
   - Click "Test" button

2. Check if logs are being ingested:
```bash
# Port-forward to Loki
kubectl port-forward -n monitoring svc/loki-gateway 3100:80

# Query all logs
curl -G -s "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={service_name=~".+"}' \
  --data-urlencode 'limit=10' | jq
```

3. Check time range in Grafana (logs might be outside selected range)

### Storage Issues

1. Check persistent volume:
```bash
kubectl get pvc -n monitoring
```

2. Check storage usage:
```bash
kubectl exec -n monitoring <loki-pod-name> -- df -h
```

3. Increase storage if needed:
```bash
# Edit values.yaml
# loki.singleBinary.persistence.size: 20Gi

# Upgrade
helm upgrade loki ./infra/helmcharts/loki -n monitoring
```

## Performance Tuning

### Increase Ingestion Rate

If you see ingestion errors, increase limits in `values.yaml`:

```yaml
loki:
  loki:
    limits_config:
      ingestion_rate_mb: 20
      ingestion_burst_size_mb: 40
      per_stream_rate_limit: 5MB
      per_stream_rate_limit_burst: 20MB
```

### Adjust Retention

To change log retention period:

```yaml
loki:
  loki:
    limits_config:
      retention_period: 168h  # 7 days
```

### Scale Resources

For higher load, increase resources:

```yaml
loki:
  singleBinary:
    resources:
      limits:
        cpu: 2000m
        memory: 2Gi
      requests:
        cpu: 500m
        memory: 512Mi
```

## Monitoring Loki

Loki exposes Prometheus metrics at `/metrics`. These are automatically scraped by Victoria Metrics.

Key metrics to monitor:
- `loki_ingester_bytes_received_total` - Bytes ingested
- `loki_distributor_lines_received_total` - Log lines received
- `loki_request_duration_seconds` - Query performance

## Upgrading

```bash
# Update values.yaml as needed
# Upgrade Loki
helm upgrade loki ./infra/helmcharts/loki -n monitoring

# Verify upgrade
kubectl rollout status deployment/loki -n monitoring
```

## Uninstalling

```bash
# Uninstall Loki
helm uninstall loki -n monitoring

# Delete PVC if needed
kubectl delete pvc -n monitoring -l app.kubernetes.io/name=loki
```

## Additional Resources

- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [LogQL Documentation](https://grafana.com/docs/loki/latest/logql/)
- [OpenTelemetry Logs](https://opentelemetry.io/docs/specs/otel/logs/)

