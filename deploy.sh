#!/bin/bash
cd /srv/watchkickoff
git pull origin main
cd apps/api && npx tsc --build tsconfig.json && npx tsc-alias -p tsconfig.json
cd /srv/watchkickoff
pm2 restart wk-api wk-web wk-workers --update-env
pm2 save
echo "✅ Deploy done!"
