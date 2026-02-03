# Stage 1: Build Stage
# Node.js imajını kullanıyoruz çünkü projeyi derlemek (build) için npm ve node gerekli.
# 'AS builder' diyerek bu aşamaya bir isim veriyoruz, sonraki aşamada buradan dosya kopyalayacağız.
FROM node:18-alpine AS builder

# Çalışma dizinini belirliyoruz
WORKDIR /app

# Önce sadece package dosyalarını kopyalıyoruz.
# Bu, Docker'ın cache mekanizmasını verimli kullanmasını sağlar.
# Kodda bir satır değişse bile dependency'ler değişmediyse 'npm ci' adımı cache'den gelir, tekrar çalışmaz.
COPY package*.json ./

# Bağımlılıkları yüklüyoruz (npm install yerine ci daha güvenli ve hızlıdır CI/CD için)
RUN npm ci

# Şimdi tüm proje dosyalarını kopyalıyoruz
COPY . .

# Build Argümanları (ARG)
# rollup.config.js dosyasında 'process.env.DATA_STUDIO_HOST' kullanıldığını gördük.
# Bu değişkenlerin build anında (runtime'da değil) kodun içine gömülmesi gerekiyor.
ARG DATA_STUDIO_HOST
ARG CAMPAIGN_HOST

# ARG değişkenlerini ENV olarak atıyoruz ki 'npm run build' komutu bunları görebilsin
ENV DATA_STUDIO_HOST=$DATA_STUDIO_HOST
ENV CAMPAIGN_HOST=$CAMPAIGN_HOST

# Projeyi derliyoruz. Bu işlem sonucunda 'dist' klasörü oluşacak.
RUN npm run build

# Stage 2: Production Stage
# Artık Node.js'e ihtiyacımız yok, sadece statik dosyaları (js, html) sunacağız.
# Nginx çok daha hafif ve hızlıdır.
FROM nginx:alpine

# Builder aşamasından (COPY --from=builder) sadece oluşturulan 'dist' klasörünü alıyoruz.
# node_modules veya kaynak kodları buraya gelmiyor, imaj boyutu çok küçük kalıyor.
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx varsayılan olarak 80 portunu açar
EXPOSE 80

# Konteyner başladığında Nginx çalışsın
CMD ["nginx", "-g", "daemon off;"]
