# PAYLISHER-SDK-JS

Paylisher Web SDK, web sitenizdeki kullanıcı etkileşimlerini takip etmek ve web-mobil uygulama dönüşümlerini (attribution) yönetmek için geliştirilmiş hafif bir JavaScript kütüphanesidir.

## Özellikler

* **Analitik**: Sayfa görüntülemeleri ve özel etkinlikleri Paylisher DataStudio'ya gönderir.
* **İlişkilendirme (Attribution)**: Ertelenmiş derin linkleme (Deferred Deep Linking) için "tıklama" kaydı ve eşleşme sorgulama işlemlerini destekler.
* **Otomatik UTM Takibi**: URL'deki kampanya parametrelerini otomatik olarak algılar.
* **Web Kaynak Tanımlama**: Tüm eventlerde `$source: 'web'` ve `$is_web_sdk: true` flag'leri ile web kaynaklı verileri işaretler.
* **Hafif ve Hızlı**: Modern tarayıcılar için optimize edilmiştir.

## Kurulum

### Web (JavaScript)

DataStudio'ya veri göndermek için sayfanızın `<head>` etiketleri arasına aşağıdaki kodu ekleyin. Bu kod, SDK'yı asenkron olarak yükler ve `paylisher` global nesnesini başlatır.

```html
<script>
    !function(t,e){var o,n,p,r;e.__SV||(window.paylisher=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.paylisher.com","-assets.i.paylisher.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="paylisher",u.people=u.people||[],u.toString=function(t){var e="paylisher";return"paylisher"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init Re Ms Fs Pe Rs Cs capture Ve calculateEventProperties Ds register register_once register_for_session unregister unregister_for_session zs getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty Ls As createPersonProfile Ns Is Us opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing is_capturing clear_opt_in_out_capturing Os debug I js getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.paylisher||[]);
    
    paylisher.init('phc_G0n3BSxS2uWyQmyfaFKPy8YNTxrkgxaGYWtp4NOlvsn', {
        api_host: 'https://ds.i.paylisher.com',
        defaults: '2025-05-24',
        person_profiles: 'identified_only',
    })
</script>
```

### React Native

React Native projelerinde SDK'yı npm paketi olarak kullanmanız önerilir.

**1. Kurulum**

Gerekli paketleri projenize ekleyin:

```bash
npm install paylisher-web-sdk @react-native-async-storage/async-storage react-native-device-info
```

**2. Başlatma (Initialization)**

Uygulamanızın giriş dosyasında (örneğin `App.tsx` veya `index.js`) SDK'yı başlatın:

```javascript
import Paylisher from 'paylisher-web-sdk';

// Uygulama açılışında başlatın
Paylisher.init('phc_G0n3BSxS2uWyQmyfaFKPy8YNTxrkgxaGYWtp4NOlvsn', {
    api_host: 'https://ds.i.paylisher.com', // Verilen DataStudio adresi
});
```

## Kullanım

### 1. Etkinlik Gönderme (Track)

Özel bir etkinliği takip etmek için:

```javascript
// Basit etkinlik
paylisher.track('signup_button_clicked');

// Özelliklerle birlikte
paylisher.track('purchase', {
  price: 99.90,
  currency: 'TRY',
  item_id: 'p-123'
});
```

### 2. Kullanıcı Tanımlama (Identify)

Kullanıcı giriş yaptığında:

```javascript
paylisher.identify('kullanici_id_12345');
```

### 3. Ertelenmiş Derin Link Kaydı (Web'den Uygulamaya)

Kullanıcı "Uygulamayı İndir" butonuna tıkladığında, bu tıklamayı kaydetmek ve kullanıcı uygulamayı yüklediğinde doğru yere yönlendirmek için:

```javascript
function onDownloadClick() {
  // 1. Tıklamayı kaydet (Kampanya sistemine niyet bildirir)
  paylisher.deferredDeepLink('paylisher://urun/detay/123', 'yaz_kampanyasi');

  // 2. Ardından kullanıcıyı App Store / Play Store'a yönlendirin
  window.location.href = "https://apps.apple.com/app/id...";
}
```

### 4. Ertelenmiş Derin Link Sorgulama

Bir cihaz için eşleşen ertelenmiş derin linki sorgulamak için (genellikle mobil uygulamalar tarafından kullanılır, ancak web'de de kullanılabilir):

```javascript
// Deferred deeplink sorgula
paylisher.fetchDeferredDeeplink().then(result => {
  if (result && result.matched) {
    console.log('Eşleşen deeplink bulundu:', result.deeplink_url);
    console.log('Kampanya:', result.campaign_key);
    console.log('Metadata:', result.metadata);

    // Kullanıcıyı ilgili sayfaya yönlendir
    // window.location.href = result.deeplink_url;
  } else {
    console.log('Eşleşen deeplink bulunamadı');
  }
});
```

**Not:** Bu metod, cihazın fingerprint'ini kullanarak kampanya backend'inde eşleşme arar. Eğer daha önce bu cihazdan bir deeplink tıklaması kaydedilmişse, ilgili deeplink bilgilerini döndürür.

## Geliştirme

Projeyi yerel ortamda geliştirmek için:

```bash
# Bağımlılıkları yükle
npm install

# Derle (Build)
npm run build
```

Çıktı dosyaları `dist/` klasöründe oluşturulacaktır. `dist/paylisher.min.js` dosyasını sunucunuza yükleyerek kullanabilirsiniz.

## İnşa Yapılandırması (Build Configuration)

SDK'yı farklı ortamlar (Prodüksiyon, Test, On-Premise Müşteri) için derlerken hedef sunucu adreslerini `.env` dosyası ile değiştirebilirsiniz.

1. `.env.example` dosyasını `.env` olarak kopyalayın:

   ```bash
   cp .env.example .env
   ```

2. `.env` dosyasını düzenleyerek hedef sunucu adreslerini girin:

   ```env
   # Analitik Sunucusu (DataStudio)
   DATA_STUDIO_HOST=https://datastudio.musteri-domain.com
   
   # Kampanya & Link Sunucusu
   CAMPAIGN_HOST=https://link.musteri-domain.com
   ```

3. SDK'yı derleyin:

   ```bash
   npm run build
   ```

Derlenen `paylisher.js` dosyası artık bu tanımladığınız sunuculara istek atacaktır.
