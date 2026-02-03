# Paylisher Web SDK

Paylisher Web SDK, web sitenizdeki kullanıcı etkileşimlerini takip etmek ve web-mobil uygulama dönüşümlerini (attribution) yönetmek için geliştirilmiş hafif bir JavaScript kütüphanesidir.

## ✨ Özellikler

- **📊 Analytics**: Sayfa görüntülemeleri ve custom event'leri Paylisher DataStudio'ya gönderir
- **🔗 Attribution**: Deferred deep linking ile web-to-app dönüşüm tracking
- **🚀 Auto-Capture**: URL'de `keyName` veya `jid` varsa "Deep Link Opened" event'i otomatik gönderir
- **📱 Esnek URL Tracking**: UTM, fbclid, gclid, ttclid ve tüm custom parametreleri yakalar
- **🎯 Person Properties**: $set/$set_once ile kullanıcı özelliklerini günceller
- **⚡ Hafif**: Gzip ile ~5-7KB (minified)

## 🚀 Hızlı Başlangıç

### 1. HTML'e Ekle

Web sitenizin `<head>` bölümüne:

```html
<script src="https://cdn.paylisher.com/paylisher.min.js"></script>
<script>
  window.paylisher.init('YOUR_API_KEY', {
    dataStudioHost: 'https://ds.paylisher.com',
    campaignHost: 'https://links.paylisher.com',
    debug: false  // Production'da false
  });

  // Otomatik pageview tracking aktif
  // Custom event tracking:
  paylisher.track('button_clicked', { button: 'signup' });
</script>
```

### 2. npm ile Yükle (React/Vue/Next.js için)

```bash
npm install paylisher-sdk
```

```javascript
import Paylisher from 'paylisher-sdk';

Paylisher.init('YOUR_API_KEY', {
  dataStudioHost: 'https://ds.paylisher.com',
  campaignHost: 'https://links.paylisher.com'
});

// Track event
Paylisher.track('page_view');
```

## 📚 Temel Kullanım

### Event Tracking

```javascript
// Basit event
paylisher.track('purchase_completed');

// Properties ile
paylisher.track('purchase_completed', {
  amount: 99.99,
  currency: 'TRY',
  product_id: '12345'
});

// Person properties ile
paylisher.track('user_signed_up',
  { plan: 'premium' },  // Event properties
  { email: 'user@example.com', name: 'John Doe' },  // $set (update always)
  { signup_date: '2026-02-03' }  // $set_once (first time only)
);
```

### Deferred Deep Link

**Web sitesinde (Campaign click):**
```javascript
// Kullanıcı "Install App" butonuna tıkladığında
document.getElementById('install-btn').addEventListener('click', async () => {
  await paylisher.campaign.recordClick(
    'https://app.example.com/promo',  // Deep link URL
    'summer-campaign'  // Campaign key
  );

  // App Store'a yönlendir
  window.location.href = 'https://apps.apple.com/app/...';
});
```

**Mobile app'te (İlk açılış):**
```javascript
// App ilk açıldığında deferred deeplink'i al
const result = await paylisher.campaign.fetchDeferredDeeplink();

if (result.matched) {
  console.log('Matched deeplink:', result.deeplink_url);
  // Navigate to deeplink
}
```

## 🛠️ Development

### Lokal Build

```bash
# Dependencies
npm install

# Build
npm run build

# Output: dist/paylisher.min.js
```

### Environment Configuration

`.env` dosyası oluştur:

```bash
cp .env.example .env
```

```env
# .env
DATA_STUDIO_HOST=http://localhost:8000
CAMPAIGN_HOST=http://localhost:4040
```

```bash
npm run build
```

## 🐳 Docker Deployment

### Quick Start

```bash
# Build
docker build \
  --build-arg DATA_STUDIO_HOST=https://ds.paylisher.com \
  --build-arg CAMPAIGN_HOST=https://links.paylisher.com \
  -f Dockerfile.improved \
  -t paylisher-sdk:1.1.0 \
  .

# Run
docker run -d -p 8080:8080 paylisher-sdk:1.1.0

# Test
curl http://localhost:8080/paylisher.min.js
```

### docker-compose (Multi-Environment)

```bash
# .env.docker oluştur
cp .env.docker.example .env.docker

# Development
docker-compose up -d sdk-dev

# Test
docker-compose up -d sdk-test

# Production
docker-compose up -d sdk-prod-saas
```

**Dockerfile versiyonları:**
- `Dockerfile` - Basit versiyon (development)
- `Dockerfile.improved` - Production-ready ✅ (önerilen)

## 🏢 On-Premise Deployment

Kurumsal müşteriler (bankalar, finans kurumları) için:

```bash
# Otomatik build script
./build-for-customer.sh

# Interactive input:
# - Müşteri adı (örn: akbank)
# - DataStudio Host
# - Campaign Host

# Output: dist/MUSTERI_ADI/
#   - paylisher.min.js
#   - Integration guide
```

## 📖 Detaylı Dokümantasyon

Kapsamlı dokümantasyon için: [docs-basic/research-web-sdk](../../docs-basic/research-web-sdk/)

### Dokümantasyon İndeksi

- **[TESTING.md](../../docs-basic/research-web-sdk/TESTING.md)** - Test senaryoları, DevOps için test guide
- **[SECURITY.md](../../docs-basic/research-web-sdk/SECURITY.md)** - Güvenlik best practices, CSP, security headers
- **[FAQ.md](../../docs-basic/research-web-sdk/FAQ.md)** - Sıkça sorulan sorular (rollup, output formats, etc.)
- **[DOCKER_DEEP_DIVE.md](../../docs-basic/research-web-sdk/DOCKER_DEEP_DIVE.md)** - Docker derinlemesine açıklama
- **[web-sdk-architecture.md](../../docs-basic/research-web-sdk/web-sdk-architecture.md)** - SDK mimarisi

### CI/CD

- **[Jenkinsfile](./Jenkinsfile)** - Multi-environment CI/CD pipeline örneği

## 🔐 Güvenlik

### API Key Public mi?

✅ **Evet, normal!** Web SDK browser'da çalışır, API key görünür.

**Public Key (Web SDK):**
- Analytics tracking ✅
- Event capture ✅
- Public data queries ✅

**Private Key (Backend):**
- Admin işlemleri ❌ ASLA browser'da!
- Kullanıcı silme ❌
- Ödeme işlemleri ❌

**Güvenlik:**
- CORS restrictions
- Rate limiting
- IP whitelist
- Referrer check

Detaylı bilgi: [SECURITY.md](../../docs-basic/research-web-sdk/SECURITY.md)

## 🏗️ Proje Yapısı

```
paylisher-sdk-js/
├── src/                    # TypeScript source
│   ├── index.ts           # Main entry
│   ├── tracker.ts         # Event tracking
│   ├── campaign.ts        # Deferred deeplink
│   └── platform/          # Platform adapters
├── dist/                   # Build output
│   ├── paylisher.min.js   # UMD minified (production)
│   ├── paylisher.js       # UMD (development)
│   └── paylisher.esm.js   # ES Module
├── Dockerfile.improved     # Production Docker
├── docker-compose.yml      # Multi-environment
├── Jenkinsfile            # CI/CD pipeline
├── rollup.config.mjs      # Rollup bundler config
└── build-for-customer.sh  # On-premise build script
```

## 🧪 Test

```bash
# Lokal test
npm run build
python3 -m http.server 8080 &
open http://localhost:8080/test.html

# Docker test
docker-compose up -d sdk-dev
curl http://localhost:8081/health
curl http://localhost:8081/paylisher.min.js
```

Detaylı test senaryoları: [TESTING.md](../../docs-basic/research-web-sdk/TESTING.md)

## 📦 Build Output

| File | Format | Size | Kullanım |
|------|--------|------|----------|
| `paylisher.min.js` | UMD | ~5-7KB (gzip) | Production (HTML `<script>`) |
| `paylisher.js` | UMD | ~40KB | Development (readable) |
| `paylisher.esm.js` | ESM | ~40KB | Modern bundlers (webpack/vite) |

## 🤝 Katkıda Bulunma

```bash
# Fork & clone
git clone https://github.com/paylisher/PAYLISHER-SDK-JS.git

# Branch oluştur
git checkout -b feature/amazing-feature

# Commit
git commit -m "feat: add amazing feature"

# Push
git push origin feature/amazing-feature

# Pull Request aç
```

## 📄 Lisans

ISC

## 🆘 Destek

- **Dokümantasyon**: [docs-basic/research-web-sdk](../../docs-basic/research-web-sdk/)
- **Issues**: [GitHub Issues](https://github.com/paylisher/PAYLISHER-SDK-JS/issues)
- **Email**: support@paylisher.com

---

**Not:** Bu SDK PostHog tabanlı analytics ve Paylisher Campaign servisini kullanır. Detaylı mimari bilgi için [web-sdk-architecture.md](../../docs-basic/research-web-sdk/web-sdk-architecture.md) dosyasına bakın.
