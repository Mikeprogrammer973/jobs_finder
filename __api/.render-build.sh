#!/bin/bash
# Versão corrigida para Render.com

# 1. Instala o Playwright e configura o browser
npm install
npx playwright install-deps chromium  # Instala dependências do sistema SEM sudo
npx playwright install chromium      # Instala o Chromium no cache do usuário

# 2. Define permissões para o cache do Playwright
mkdir -p ~/.cache/ms-playwright
chmod -R 755 ~/.cache