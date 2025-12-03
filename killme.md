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