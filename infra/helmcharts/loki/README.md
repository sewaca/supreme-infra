# Grafana Loki Helm Chart

This Helm chart deploys Grafana Loki in SingleBinary mode for log aggregation.

## Prerequisites

- Kubernetes cluster
- Helm 3.x
- Storage class for persistent volumes

## Installation

```bash
# Add Grafana Helm repository
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Loki
helm install loki . -n monitoring --create-namespace
```

## Configuration

### Key Features

- **SingleBinary mode**: Simplified deployment with all Loki components in one binary
- **Filesystem storage**: Uses persistent volumes for log storage
- **31-day retention**: Logs are kept for 31 days by default
- **OTLP support**: Accepts logs via OpenTelemetry Protocol
- **No caching**: Memcached and chunk caching disabled for simplicity
- **No canary**: Loki canary monitoring disabled

### Storage

The chart uses persistent volumes for log storage:
- Default size: 10Gi
- Can be configured via `loki.singleBinary.persistence.size`

### Resource Limits

Default resource configuration:
- Loki: 1 CPU / 1Gi memory (limit), 250m CPU / 256Mi memory (request)
- Gateway: 200m CPU / 256Mi memory (limit), 50m CPU / 64Mi memory (request)

### Accessing Loki

Loki is accessible within the cluster at:
- Gateway: `http://loki-gateway.monitoring.svc.cluster.local`
- Direct (SingleBinary): `http://loki.monitoring.svc.cluster.local:3100`

For OTLP logs, use:
- Endpoint: `http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs`

## Integration with Grafana

Loki is automatically configured as a datasource in Grafana. You can query logs using LogQL:

```logql
{service_name="backend"} |= "error"
{service_name="frontend", level="info"}
```

## Upgrading

```bash
helm upgrade loki . -n monitoring
```

## Uninstalling

```bash
helm uninstall loki -n monitoring
```

## Troubleshooting

### Check Loki status

```bash
kubectl get pods -n monitoring -l app.kubernetes.io/name=loki
kubectl logs -n monitoring -l app.kubernetes.io/name=loki
```

### Test Loki endpoint

```bash
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n monitoring -- \
  curl http://loki-gateway/ready
```

### Check logs ingestion

```bash
# Port-forward to Loki
kubectl port-forward -n monitoring svc/loki-gateway 3100:80

# Query logs
curl -G -s "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query={service_name="backend"}' | jq
```

