# Paylisher Web SDK - Docker Deployment Guide

Bu rehber, Paylisher Web SDK'nın Docker ile nasıl deploy edileceğini açıklar.

## 📋 İçindekiler
- [Mimari Kararlar](#mimari-kararlar)
- [Ortam Yapılandırması](#ortam-yapılandırması)
- [Build ve Deploy](#build-ve-deploy)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring ve Health Checks](#monitoring-ve-health-checks)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Mimari Kararlar

### Multi-Stage Build

**Neden kullanıyoruz?**
- **Stage 1 (Builder)**: TypeScript → JavaScript derleme için Node.js gerekli (~1GB)
- **Stage 2 (Production)**: Sadece statik JS dosyaları için Nginx (~30MB)
- **Sonuç**: %97 daha küçük image (1GB → 30MB)

```dockerfile
FROM node:18-alpine AS builder  # Build için
# ... build işlemleri ...
FROM nginx:alpine               # Production için
COPY --from=builder /app/dist   # Sadece dist/ kopyala
```

### Neden Nginx?

**Alternatifler**: Node.js serve, Apache, Caddy

**Neden Nginx seçtik:**
- ✅ Çok hafif (20-30MB vs Node.js 1GB)
- ✅ Statik dosya sunmada en hızlı
- ✅ Production-ready (rate limiting, caching, CORS)
- ✅ Minimal attack surface

### Build-Time vs Runtime Variables

**Critical:** SDK'daki `DATA_STUDIO_HOST` ve `CAMPAIGN_HOST` değişkenleri **build-time'da** kodun içine gömülüyor (hardcoded).

**Neden?**
- `rollup.config.js` bu değişkenleri build sırasında okur ve JS koduna yazar
- Runtime'da değiştiremezsiniz!

**Sonuç:** Her ortam için (dev/test/prod/on-prem) **ayrı build** gereklidir.

```bash
# ❌ YANLIŞ: Runtime'da env değiştirme
docker run -e DATA_STUDIO_HOST=https://new-host.com paylisher-sdk

# ✅ DOĞRU: Build-time'da belirtme
docker build --build-arg DATA_STUDIO_HOST=https://new-host.com -t paylisher-sdk .
```

---

## ⚙️ Ortam Yapılandırması

### 1. Development (Lokal Geliştirme)

```bash
# .env.docker dosyası oluştur
cp .env.docker.example .env.docker

# Değişkenleri düzenle
nano .env.docker
```

```env
DEV_DATA_STUDIO_HOST=http://localhost:8000
DEV_CAMPAIGN_HOST=http://localhost:4040
```

```bash
# Build ve run
docker-compose up sdk-dev

# Test
curl http://localhost:8081/paylisher.min.js
```

### 2. Test Environment (Dünya Katılım Test)

```bash
# .env.docker dosyasını düzenle
nano .env.docker
```

```env
TEST_DATA_STUDIO_HOST=https://analytics-test.dunyadkatilim.com.tr
TEST_CAMPAIGN_HOST=https://links-test.dunyadkatilim.com.tr
VERSION=1.1.0-test
```

```bash
# Build
docker-compose build sdk-test

# Run
docker-compose up -d sdk-test

# Logs
docker-compose logs -f sdk-test

# Health check
curl http://localhost:8082/health
```

### 3. Production SaaS

```bash
# .env.docker dosyasını düzenle
nano .env.docker
```

```env
PROD_DATA_STUDIO_HOST=https://analytics.paylisher.com
PROD_CAMPAIGN_HOST=https://your.campaign.host
VERSION=1.1.0
VCS_REF=$(git rev-parse --short HEAD)
```

```bash
# Build
docker-compose build sdk-prod-saas

# Run
docker-compose up -d sdk-prod-saas

# Health check
curl http://localhost:8080/health
curl http://localhost:8080/paylisher.min.js
```

### 4. On-Premise (Dünya Katılım Prod)

```bash
# .env.docker dosyasını düzenle
nano .env.docker
```

```env
ONPREM_DATA_STUDIO_HOST=https://analytics.dunyadkatilim.com.tr
ONPREM_CAMPAIGN_HOST=https://links.dunyadkatilim.com.tr
VERSION=1.1.0-onprem
```

```bash
# Build
docker-compose build sdk-onprem-dunyadkatilim

# Image'ı export et (müşteriye teslim için)
docker save paylisher/web-sdk:onprem-dunyadkatilim | gzip > paylisher-sdk-dunyadkatilim.tar.gz

# Müşteri sunucusunda load et
docker load < paylisher-sdk-dunyadkatilim.tar.gz

# Run
docker run -d -p 8080:8080 --name paylisher-sdk paylisher/web-sdk:onprem-dunyadkatilim
```

---

## 🚀 Build ve Deploy

### Manuel Build (Dockerfile.improved)

```bash
# Development build
docker build \
  --build-arg DATA_STUDIO_HOST=http://localhost:8000 \
  --build-arg CAMPAIGN_HOST=http://localhost:4040 \
  --build-arg VERSION=1.1.0-dev \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  -f Dockerfile.improved \
  -t paylisher/web-sdk:dev \
  .

# Production build
docker build \
  --build-arg DATA_STUDIO_HOST=https://analytics.paylisher.com \
  --build-arg CAMPAIGN_HOST=https://your.campaign.host \
  --build-arg VERSION=1.1.0 \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  -f Dockerfile.improved \
  -t paylisher/web-sdk:1.1.0 \
  -t paylisher/web-sdk:latest \
  .

# Run
docker run -d -p 8080:8080 --name paylisher-sdk paylisher/web-sdk:latest

# Health check
docker exec paylisher-sdk curl -f http://localhost:8080/health
```

### Docker Compose ile Build

```bash
# Tüm ortamları build et
docker-compose build

# Sadece bir ortamı build et
docker-compose build sdk-prod-saas

# Run
docker-compose up -d sdk-prod-saas

# Logs
docker-compose logs -f sdk-prod-saas

# Stop
docker-compose down
```

### Registry'ye Push (Docker Hub / Private Registry)

```bash
# Docker Hub'a login
docker login

# Tag
docker tag paylisher/web-sdk:latest your-registry.com/paylisher/web-sdk:1.1.0

# Push
docker push your-registry.com/paylisher/web-sdk:1.1.0

# Pull (başka sunucuda)
docker pull your-registry.com/paylisher/web-sdk:1.1.0
```

---

## ☸️ Kubernetes Deployment

### Deployment Manifest

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: paylisher-web-sdk
  namespace: paylisher
  labels:
    app: web-sdk
    environment: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-sdk
  template:
    metadata:
      labels:
        app: web-sdk
    spec:
      containers:
      - name: web-sdk
        image: paylisher/web-sdk:1.1.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /paylisher.min.js
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        resources:
          requests:
            cpu: 100m
            memory: 64Mi
          limits:
            cpu: 500m
            memory: 128Mi
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
---
apiVersion: v1
kind: Service
metadata:
  name: paylisher-web-sdk
  namespace: paylisher
spec:
  type: LoadBalancer
  selector:
    app: web-sdk
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: paylisher-web-sdk
  namespace: paylisher
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - your.sdk.host
    secretName: your-sdk-tls-secret
  rules:
  - host: your.sdk.host
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: paylisher-web-sdk
            port:
              number: 80
```

### Deploy to Kubernetes

```bash
# Apply
kubectl apply -f k8s/deployment.yaml

# Check pods
kubectl get pods -n paylisher

# Check logs
kubectl logs -f deployment/paylisher-web-sdk -n paylisher

# Scale
kubectl scale deployment paylisher-web-sdk --replicas=5 -n paylisher

# Rollout update
kubectl set image deployment/paylisher-web-sdk web-sdk=paylisher/web-sdk:1.2.0 -n paylisher
kubectl rollout status deployment/paylisher-web-sdk -n paylisher

# Rollback
kubectl rollout undo deployment/paylisher-web-sdk -n paylisher
```

---

## 📊 Monitoring ve Health Checks

### Health Check Endpoints

```bash
# Basic health
curl http://localhost:8080/health
# Response: healthy

# SDK file check
curl -I http://localhost:8080/paylisher.min.js
# Response: 200 OK

# Docker health check
docker ps
# STATUS column should show "healthy"
```

### Prometheus Metrics (İleride eklenebilir)

```nginx
# nginx.conf'a ekle
location /metrics {
    stub_status on;
    access_log off;
    allow 10.0.0.0/8;  # Internal network only
    deny all;
}
```

### Logging

```bash
# Container logs
docker logs -f paylisher-sdk

# Nginx access logs
docker exec paylisher-sdk tail -f /var/log/nginx/access.log

# Nginx error logs
docker exec paylisher-sdk tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting

### Problem: Build Args eksik hatası

```
Error: DATA_STUDIO_HOST build arg is required
```

**Çözüm:**
```bash
docker build --build-arg DATA_STUDIO_HOST=https://... --build-arg CAMPAIGN_HOST=https://... .
```

### Problem: Permission denied (nginx user)

```
nginx: [emerg] open() "/var/run/nginx/nginx.pid" failed (13: Permission denied)
```

**Çözüm:** Dockerfile.improved'da zaten non-root user yapılandırması var. Mevcut Dockerfile'ı kullanıyorsanız:
```dockerfile
RUN chown -R nginx-user:nginx-user /var/run/nginx
```

### Problem: CORS hatası

```
Access to fetch at 'http://localhost:8080/paylisher.min.js' from origin 'http://localhost:3000' has been blocked by CORS
```

**Çözüm:** `nginx.conf` dosyasında CORS headers zaten yapılandırılmış. nginx.conf'u container'a kopyaladığınızdan emin olun:
```dockerfile
COPY nginx.conf /etc/nginx/nginx.conf
```

### Problem: Health check failing

```bash
# Container içinde debug
docker exec -it paylisher-sdk sh

# Health check manuel test
curl http://localhost:8080/health

# Nginx status
ps aux | grep nginx

# Logs
tail -f /var/log/nginx/error.log
```

### Problem: SDK file not found (404)

```bash
# Check file exists
docker exec paylisher-sdk ls -lh /usr/share/nginx/html/

# Expected output:
# paylisher.min.js
# paylisher.js
# paylisher.esm.js
```

---

## 📦 Müşteriye Teslim (On-Premise)

### 1. Build Customer-Specific Image

```bash
# Build
docker build \
  --build-arg DATA_STUDIO_HOST=https://analytics.dunyadkatilim.com.tr \
  --build-arg CAMPAIGN_HOST=https://links.dunyadkatilim.com.tr \
  --build-arg VERSION=1.1.0-dunyadkatilim \
  -f Dockerfile.improved \
  -t paylisher/web-sdk:dunyadkatilim \
  .
```

### 2. Export Image

```bash
# Export to tar.gz
docker save paylisher/web-sdk:dunyadkatilim | gzip > paylisher-sdk-dunyadkatilim-v1.1.0.tar.gz

# Check size
ls -lh paylisher-sdk-dunyadkatilim-v1.1.0.tar.gz
# Should be ~15-20MB
```

### 3. Deployment Instructions (Müşteriye verin)

```bash
# Load image
docker load < paylisher-sdk-dunyadkatilim-v1.1.0.tar.gz

# Run
docker run -d \
  --name paylisher-sdk \
  --restart always \
  -p 8080:8080 \
  paylisher/web-sdk:dunyadkatilim

# Verify
curl http://localhost:8080/health
curl http://localhost:8080/paylisher.min.js

# Check logs
docker logs -f paylisher-sdk
```

### 4. Teslim Edilecek Dosyalar

- ✅ `paylisher-sdk-dunyadkatilim-v1.1.0.tar.gz` (Docker image)
- ✅ `DOCKER_DEPLOYMENT.md` (Bu dokümantasyon)
- ✅ `docker-compose.yml` (Optional - kolay deployment için)
- ✅ `.env.docker.example` (Configuration template)
- ✅ Integration guide (HTML snippet örnekleri)

---

## 🔐 Security Best Practices

✅ **Non-root user**: Container nginx-user (UID 1001) ile çalışır
✅ **Read-only filesystem**: Nginx için read-only root filesystem
✅ **Health checks**: Liveness ve readiness probes
✅ **Security headers**: X-Frame-Options, X-Content-Type-Options, CSP
✅ **HTTPS only**: Production'da sadece HTTPS (nginx reverse proxy veya ingress ile)
✅ **Minimal attack surface**: Alpine base image (minimal packages)
✅ **No secrets in image**: API keys environment'da, image'da değil

---

## 📚 Kaynaklar

- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Nginx Alpine Image](https://hub.docker.com/_/nginx)
- [JavaScript SDK Reference Example](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [OCI Image Spec](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
