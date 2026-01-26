# PAYLISHER-SDK-JS

Paylisher Web SDK, web sitenizdeki kullanıcı etkileşimlerini takip etmek ve web-mobil uygulama dönüşümlerini (attribution) yönetmek için geliştirilmiş hafif bir JavaScript kütüphanesidir.

## Özellikler

* **Analitik**: Sayfa görüntülemeleri ve özel etkinlikleri Paylisher DataStudio'ya gönderir.
* **İlişkilendirme (Attribution)**: Ertelenmiş derin linkleme (Deferred Deep Linking) için "tıklama" ve "kurulum niyeti" verilerini işler.
* **Otomatik UTM Takibi**: URL'deki kampanya parametrelerini otomatik olarak algılar.
* **Hafif ve Hızlı**: Modern tarayıcılar için optimize edilmiştir.

## Kurulum

Sayfanızın `<head>` etiketleri arasına aşağıdaki kodu ekleyin:

```html
<script>
    !function(t,e){
        var o,n,p,r;e.__SV||(window.paylisher=e,e._i=[],e.init=function(i,s,a){
            function g(t,e){
                var o=e.split(".");
                2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){
                    t.push([e].concat(Array.prototype.slice.call(arguments,0)))
                }
            }
            var u=e;
            for(void 0!==a?u=e[a]=[]:a="paylisher",u.people=u.people||[],u.toString=function(t){
                var e="paylisher";return"paylisher"!==a&&(e+="."+a),t||(e+=" (stub)"),e
            },u.people.toString=function(){return u.toString(1)+".people (stub)"},
            o="init track identify deferredDeepLink".split(" "),n=0;n<o.length;n++)g(u,o[n]);
            e._i.push([i,s,a])
        },e.__SV=1)
    }(document,window.paylisher||[]);

    // Paylisher'ı Başlatın
    paylisher.init('API_ANAHTARINIZ', {
        api_host: 'https://ds.i.paylisher.com',
        // debug: true // Geliştirme aşamasında konsol çıktılarını görmek için açabilirsiniz
    });
    
    // SDK Dosyasını Yükleyin (CDN adresinizi güncelleyin)
    (function() {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        s.src = "https://cdn.example.com/paylisher.min.js"; // Burayı kendi CDN adresinizle değiştirin
        var x = document.getElementsByTagName("script")[0];
        x.parentNode.insertBefore(s, x);
    })();
</script>
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

### 3. Ertelenmiş Derin Link (Web'den Uygulamaya)

Kullanıcı "Uygulamayı İndir" butonuna tıkladığında, bu tıklamayı kaydetmek ve kullanıcı uygulamayı yüklediğinde doğru yere yönlendirmek için:

```javascript
function onDownloadClick() {
  // 1. Tıklamayı kaydet (Kampanya sistemine niyet bildirir)
  paylisher.deferredDeepLink('paylisher://urun/detay/123', 'yaz_kampanyasi');
  
  // 2. Ardından kullanıcıyı App Store / Play Store'a yönlendirin
  window.location.href = "https://apps.apple.com/app/id..."; 
}
```

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
