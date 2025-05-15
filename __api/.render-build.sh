#!/bin/bash
set -euo pipefail

# 1. Instala dependências normais
npm install

# 2. Baixa o Chromium Linux x64 (versão compatível com Puppeteer)
echo "➡️ Baixando Chromium..."

CHROMIUM_URL="https://commondatastorage.googleapis.com/chromium-browser-snapshots/Linux_x64/1460435/chrome-linux.zip"
wget "$CHROMIUM_URL" -O /tmp/chromium.zip
unzip /tmp/chromium.zip -d ./local-chromium
rm /tmp/chromium.zip

# 3. Garante permissões de execução
chmod +x ./local-chromium/chrome-linux/chrome

echo "✅ Chromium instalado em: ./local-chromium/chrome-linux/chrome"