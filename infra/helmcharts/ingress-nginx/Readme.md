# Ingress-nginx chart


```
helm dependency build
```

```
helm upgrade ingress-nginx . -n production --install
```

```
kubectl describe ingress ingress-hello -n production
```
