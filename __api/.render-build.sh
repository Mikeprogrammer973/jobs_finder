#!/bin/bash
# Script otimizado para Render sem root

# 1. Instala as dependências do Node
npm install

# 2. Configura o Playwright para usar cache sem privilégios
export PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright
npx playwright install --with-deps chromium