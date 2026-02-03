# Paylisher Web SDK

Web sitenizdeki kullanıcı etkileşimlerini takip etmek ve web-mobil uygulama dönüşümlerini (attribution) yönetmek için geliştirilmiş hafif bir JavaScript kütüphanesidir.

## ✨ Özellikler

- **📊 Analytics**: Sayfa görüntülemeleri ve custom event'leri Paylisher DataStudio'ya gönderir
- **🔗 Attribution**: Deferred deep linking ile web-to-app dönüşüm tracking
- **🚀 Auto-Capture**: URL'de `keyName` veya `jid` varsa "Deep Link Opened" event'i otomatik gönderir
- **📱 Esnek URL Tracking**: UTM, fbclid, gclid, ttclid ve tüm custom parametreleri yakalar
- **🎯 Person Properties**: $set/$set_once ile kullanıcı özelliklerini günceller
- **⚡ Hafif**: Gzip ile ~5-7KB (minified)

## 🚀 Hızlı Başlangıç

### 1. Vanilla JavaScript Web Siteleri İçin

**Kullanım Senaryosu:** HTML/CSS/JavaScript web siteleri, WordPress, Squarespace, Wix

**Entegrasyon Noktası:** Global `<head>` veya `<body>` sonunda (tüm sayfalarda)

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>

  <!-- Paylisher SDK -->
  <script src="https://cdn.paylisher.com/paylisher.min.js"></script>
  <script>
    window.paylisher.init('YOUR_API_KEY', {
      dataStudioHost: 'https://ds.paylisher.com',
      campaignHost: 'https://links.paylisher.com',
      debug: false
    });

    // Otomatik pageview tracking aktif
    // Opsiyonel: Custom event tracking
    document.getElementById('signup-btn')?.addEventListener('click', function() {
      paylisher.track('signup_button_clicked', { page: 'homepage' });
    });
  </script>
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

**WordPress için:**
- Tema'nın `header.php` dosyasına ekle (tüm sayfalarda çalışır)
- Veya plugin kullan: "Insert Headers and Footers"

---

### 2. Modern Framework'ler İçin (React, Vue, Next.js, React Native)

**Kullanım Senaryosu:** React, Vue, Angular, Next.js, Nuxt.js, React Native uygulamaları

#### A. React/Next.js

**Entegrasyon Noktası:** Root component (`_app.tsx` veya `App.tsx`)

```bash
npm install paylisher-sdk
```

**Next.js (_app.tsx):**
```tsx
// pages/_app.tsx
import { useEffect } from 'react';
import Paylisher from 'paylisher-sdk';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    Paylisher.init('YOUR_API_KEY', {
      dataStudioHost: 'https://ds.paylisher.com',
      campaignHost: 'https://links.paylisher.com'
    });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

**React (App.tsx):**
```tsx
// src/App.tsx
import { useEffect } from 'react';
import Paylisher from 'paylisher-sdk';

function App() {
  useEffect(() => {
    Paylisher.init('YOUR_API_KEY', {
      dataStudioHost: 'https://ds.paylisher.com',
      campaignHost: 'https://links.paylisher.com'
    });
  }, []);

  return <div>Your App</div>;
}
```

#### B. Vue/Nuxt.js

**Entegrasyon Noktası:** Main entry (`main.js` veya `plugins/paylisher.js`)

```bash
npm install paylisher-sdk
```

**Vue (main.js):**
```javascript
import { createApp } from 'vue';
import App from './App.vue';
import Paylisher from 'paylisher-sdk';

Paylisher.init('YOUR_API_KEY', {
  dataStudioHost: 'https://ds.paylisher.com',
  campaignHost: 'https://links.paylisher.com'
});

createApp(App).mount('#app');
```

**Nuxt.js (plugins/paylisher.js):**
```javascript
import Paylisher from 'paylisher-sdk';

export default defineNuxtPlugin(() => {
  Paylisher.init('YOUR_API_KEY', {
    dataStudioHost: 'https://ds.paylisher.com',
    campaignHost: 'https://links.paylisher.com'
  });
});
```

#### C. React Native

**Entegrasyon Noktası:** App root (`App.tsx`)

```bash
npm install paylisher-sdk
npm install @react-native-async-storage/async-storage react-native-device-info
```

```tsx
// App.tsx
import { useEffect } from 'react';
import Paylisher from 'paylisher-sdk';

export default function App() {
  useEffect(() => {
    Paylisher.init('YOUR_API_KEY', {
      dataStudioHost: 'https://ds.paylisher.com',
      campaignHost: 'https://links.paylisher.com'
    });
  }, []);

  return <YourApp />;
}
```

---

## 📚 Event Tracking

### Basit Event

```javascript
paylisher.track('purchase_completed');
```

### Properties ile Event

```javascript
paylisher.track('purchase_completed', {
  amount: 99.99,
  currency: 'TRY',
  product_id: '12345',
  category: 'electronics'
});
```

### Person Properties ile Event

```javascript
paylisher.track('user_signed_up',
  { plan: 'premium' },  // Event properties
  { 
    email: 'user@example.com',  // $set (her seferinde güncelle)
    name: 'John Doe',
    subscription_tier: 'premium'
  },
  { 
    signup_date: '2026-02-03',  // $set_once (ilk seferinde set et)
    initial_referrer: 'google'
  }
);
```

---

## 🔗 Deferred Deep Link

**Senaryo:** Kullanıcı web sitesinde bir linke tıklıyor, app'i yüklüyor, app açılınca doğru sayfaya yönleniyor.

**Web sitesinde:**
```javascript
// "Install App" butonuna tıklandığında
document.getElementById('install-btn').addEventListener('click', async () => {
  // Deep link kaydı oluştur
  await paylisher.campaign.recordClick(
    'https://app.example.com/promo/summer',  // Deep link URL
    'summer-campaign-2026'  // Campaign key
  );

  // App Store'a yönlendir
  window.location.href = 'https://apps.apple.com/app/your-app';
});
```

**Mobile app'te (iOS/Android/React Native):**
```javascript
// App ilk açıldığında
const result = await paylisher.campaign.fetchDeferredDeeplink();

if (result.matched) {
  console.log('Matched deeplink:', result.deeplink_url);
  // Navigate: https://app.example.com/promo/summer
  navigation.navigate('PromoScreen', { campaign: 'summer' });
}
```

---

## 🛠️ Development

### Lokal Build

```bash
npm install
npm run build
# Output: dist/paylisher.min.js
```

### Environment Configuration

```bash
cp .env.example .env
```

```env
DATA_STUDIO_HOST=http://localhost:8000
CAMPAIGN_HOST=http://localhost:4040
```

```bash
npm run build
```

---

## 🐳 Docker Deployment

### Quick Start

```bash
docker build \
  --build-arg DATA_STUDIO_HOST=https://ds.paylisher.com \
  --build-arg CAMPAIGN_HOST=https://links.paylisher.com \
  -f Dockerfile.improved \
  -t paylisher-sdk:1.1.0 \
  .

docker run -d -p 8080:8080 paylisher-sdk:1.1.0
curl http://localhost:8080/paylisher.min.js
```

### docker-compose (Multi-Environment)

```bash
cp .env.docker.example .env.docker

# Development
docker-compose up -d sdk-dev

# Test
docker-compose up -d sdk-test

# Production
docker-compose up -d sdk-prod-saas
```

---

## 🏢 On-Premise Deployment

Kurumsal müşteriler (örn: A Bankası, B Bankası) için:

```bash
# Otomatik build script
./build-for-customer.sh

# Interactive input:
# - Müşteri adı (örn: banka-a)
# - DataStudio Host (örn: https://analytics.banka-a.com)
# - Campaign Host (örn: https://links.banka-a.com)

# Output: dist/banka-a/
#   - paylisher.min.js
#   - Integration guide
```

---

## 📖 Detaylı Dokümantasyon

Kapsamlı dokümantasyon: [paylisher.backend.docs/web-sdk](https://github.com/softmarketsolution/paylisher.backend.docs/tree/main/web-sdk)

### Dokümantasyon İndeksi

- **[TESTING.md](https://github.com/softmarketsolution/paylisher.backend.docs/blob/main/web-sdk/TESTING.md)** - Test senaryoları, DevOps guide
- **[SECURITY.md](https://github.com/softmarketsolution/paylisher.backend.docs/blob/main/web-sdk/SECURITY.md)** - Güvenlik best practices
- **[FAQ.md](https://github.com/softmarketsolution/paylisher.backend.docs/blob/main/web-sdk/FAQ.md)** - Sıkça sorulan sorular
- **[DOCKER_DEEP_DIVE.md](https://github.com/softmarketsolution/paylisher.backend.docs/blob/main/web-sdk/DOCKER_DEEP_DIVE.md)** - Docker derinlemesine
- **[architecture.md](https://github.com/softmarketsolution/paylisher.backend.docs/blob/main/web-sdk/architecture.md)** - SDK mimarisi

### CI/CD

- **[Jenkinsfile](./Jenkinsfile)** - Multi-environment pipeline

---

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
├── rollup.config.mjs      # Bundler config
└── build-for-customer.sh  # On-premise build
```

---

## 🧪 Test

```bash
# Lokal test
npm run build
python3 -m http.server 8080
open http://localhost:8080/test.html

# Docker test
docker-compose up -d sdk-dev
curl http://localhost:8081/health
```

Test senaryoları: [TESTING.md](https://github.com/softmarketsolution/paylisher.backend.docs/blob/main/web-sdk/TESTING.md)

---

## 📦 Build Output

| File | Format | Size | Kullanım |
|------|--------|------|----------|
| `paylisher.min.js` | UMD | ~5-7KB (gzip) | Production (HTML `<script>`) |
| `paylisher.js` | UMD | ~40KB | Development |
| `paylisher.esm.js` | ESM | ~40KB | Modern bundlers |

---

## 🤝 Katkıda Bulunma

```bash
git clone https://github.com/paylisher/PAYLISHER-SDK-JS.git
git checkout -b feature/amazing-feature
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
# Pull Request aç
```

---

## 📄 Lisans

ISC

---

## 🆘 Destek

- **Dokümantasyon**: [paylisher.backend.docs/web-sdk](https://github.com/softmarketsolution/paylisher.backend.docs/tree/main/web-sdk)
- **Issues**: [GitHub Issues](https://github.com/paylisher/PAYLISHER-SDK-JS/issues)
- **Email**: support@paylisher.com
