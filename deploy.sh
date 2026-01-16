#!/bin/bash
# Deploy script per Time Report

set -e

SERVER="root@185.192.97.108"
REMOTE_DIR="/root/time-report"

echo "=== Building Frontend ==="
cd frontend
npm run build
cd ..

echo "=== Syncing Backend ==="
rsync -avz --exclude 'node_modules' --exclude '.env' --exclude 'dist' \
  backend/ $SERVER:$REMOTE_DIR/backend/

echo "=== Syncing Frontend Build ==="
rsync -avz frontend/dist/ $SERVER:/var/www/time-report/

echo "=== Remote Setup ==="
ssh $SERVER << 'ENDSSH'
cd /root/time-report/backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build
npm run build

# Run migrations (solo se necessario)
npx prisma migrate deploy

# Restart PM2
pm2 restart time-report 2>/dev/null || pm2 start dist/main.js --name time-report

pm2 save

echo "Deploy completed!"
ENDSSH

echo "=== Done! ==="
