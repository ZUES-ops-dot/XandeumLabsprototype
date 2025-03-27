# Kubernetes Manifests

Production deployment manifests for:
- API deployment + HPA
- TimescaleDB StatefulSet
- Redis cache sidecar

Apply with `kubectl apply -k infra/k8s/overlays/production`.
