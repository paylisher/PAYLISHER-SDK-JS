#!/bin/bash

# Paylisher Web SDK - Customer Build Script
# On-premise müşteriler için özelleştirilmiş SDK build scripti

set -e

echo "🏢 Paylisher SDK - Customer Build Script"
echo "=========================================="

# Müşteri bilgilerini al
read -p "Müşteri adı (örn: akbank): " CUSTOMER_NAME
read -p "DataStudio Host (örn: https://analytics.akbank.com): " DATA_STUDIO_HOST
read -p "Campaign Host (örn: https://links.akbank.com): " CAMPAIGN_HOST

# Validate URLs
if [[ ! $DATA_STUDIO_HOST =~ ^https?:// ]]; then
    echo "❌ Hata: DataStudio Host geçerli bir URL olmalı (https://...)"
    exit 1
fi

if [[ ! $CAMPAIGN_HOST =~ ^https?:// ]]; then
    echo "❌ Hata: Campaign Host geçerli bir URL olmalı (https://...)"
    exit 1
fi

# .env dosyası oluştur
echo ""
echo "📝 .env dosyası oluşturuluyor..."
cat > .env << EOF
# Paylisher SDK - Customer Build Configuration
# Customer: ${CUSTOMER_NAME}
# Build Date: $(date)

DATA_STUDIO_HOST=${DATA_STUDIO_HOST}
CAMPAIGN_HOST=${CAMPAIGN_HOST}
EOF

echo "✅ .env dosyası oluşturuldu"

# Build
echo ""
echo "🔨 SDK build ediliyor..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build başarılı!"

    # Customer-specific output directory oluştur
    CUSTOMER_DIR="dist/${CUSTOMER_NAME}"
    mkdir -p "$CUSTOMER_DIR"

    # Build dosyalarını customer directory'ye kopyala
    cp dist/paylisher.min.js "$CUSTOMER_DIR/"
    cp dist/paylisher.js "$CUSTOMER_DIR/"
    cp dist/paylisher.esm.js "$CUSTOMER_DIR/"

    # README oluştur
    cat > "$CUSTOMER_DIR/README.txt" << EOF
Paylisher Web SDK - ${CUSTOMER_NAME}
Build Date: $(date)
=====================================

Build Configuration:
- DataStudio Host: ${DATA_STUDIO_HOST}
- Campaign Host: ${CAMPAIGN_HOST}

Files:
- paylisher.min.js (Production - Minified)
- paylisher.js (Development - Readable)
- paylisher.esm.js (ES Module)

Integration:
1. paylisher.min.js dosyasını web sunucunuza yükleyin
2. Web sitenizin <head> bölümüne şu kodu ekleyin:

<script src="/path/to/paylisher.min.js"></script>
<script>
  paylisher.init('API_KEY_BURAYA', {
    dataStudioHost: '${DATA_STUDIO_HOST}',
    campaignHost: '${CAMPAIGN_HOST}',
    debug: false
  });
</script>

Test:
- Browser console'da "Paylisher: Tracking event" mesajını görmelisiniz
- Network tab'ında ${DATA_STUDIO_HOST}/batch endpoint'ine request gitmeli

Destek: support@paylisher.com
EOF

    echo ""
    echo "📦 Customer build paketi hazır:"
    echo "   📁 ${CUSTOMER_DIR}/"
    echo "   📄 ${CUSTOMER_DIR}/paylisher.min.js"
    echo "   📄 ${CUSTOMER_DIR}/paylisher.js"
    echo "   📄 ${CUSTOMER_DIR}/paylisher.esm.js"
    echo "   📄 ${CUSTOMER_DIR}/README.txt"
    echo ""
    echo "✅ Tamamlandı! Dosyaları müşteriye teslim edebilirsiniz."
else
    echo "❌ Build başarısız oldu!"
    exit 1
fi
