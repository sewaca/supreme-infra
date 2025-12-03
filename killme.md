# 1. Victoria Metrics
helm repo add vm https://victoriametrics.github.io/helm-charts/
helm dependency update ./infra/helmcharts/victoria-metrics
helm install victoria-metrics ./infra/helmcharts/victoria-metrics --namespace monitoring --create-namespace

# 2. Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm dependency update ./infra/helmcharts/grafana
kubectl create configmap grafana-dashboards --from-file=./infra/helmcharts/grafana/dashboards/ --namespace monitoring
helm install grafana ./infra/helmcharts/grafana --namespace monitoring
# 3. Backend (если еще не развернут)
helm install backend ./infra/helmcharts/backend-service -f services/backend/service.yaml --namespace default


# Fixes Applied

## 1. Grafana - Removed deprecated alerting.enabled
**Error:** Legacy alerting is no longer supported in Grafana 11.4.0
**Fix:** Removed `alerting.enabled: true` from grafana.ini, kept only `unified_alerting.enabled: true`

## 2. Victoria Metrics - Removed evaluation_interval
**Error:** `evaluation_interval` is not supported in VictoriaMetrics scrape config
**Fix:** Removed `evaluation_interval: 15s` from global config (this is a Prometheus alerting feature)

## 3. Backend Service - Fixed metrics nil pointer
**Error:** Template tried to access `.Values.metrics.enabled` when metrics object didn't exist
**Fix:** Added defensive checks `{{- if and .Values.metrics .Values.metrics.enabled }}`

---

# Commands to upgrade the broken deployments:

# 1. Upgrade Victoria Metrics
helm upgrade victoria-metrics ./infra/helmcharts/victoria-metrics --namespace monitoring

# 2. Upgrade Grafana
helm upgrade grafana ./infra/helmcharts/grafana --namespace monitoring

# 3. Verify pods are running
kubectl get pods -n monitoring
