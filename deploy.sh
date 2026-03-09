#!/bin/bash
set -e
cd /srv/watchkickoff

echo "📦 Pulling latest..."
git pull origin main

echo "🔧 Building shared..."
cd packages/shared && npm run build
cd /srv/watchkickoff

echo "🔧 Building API..."
cd apps/api && npx tsc --build tsconfig.json && npx tsc-alias -p tsconfig.json
cd /srv/watchkickoff

echo "🎨 Building Web..."
cd apps/web && npx next build
cd /srv/watchkickoff

echo "🚀 Restarting processes..."
pm2 restart wk-api wk-web wk-workers --update-env
pm2 save

echo "✅ Deploy done!"
