#!/bin/sh
set -e

echo "🚀 Starting Android Test Havuzu..."

mkdir -p /app/data

echo "📦 Running Prisma DB push..."
npx prisma db push --skip-generate --accept-data-loss

if [ ! -f /app/data/.seeded ]; then
  echo "🌱 Seeding initial database data..."
  npx tsx prisma/seed.ts || true
  touch /app/data/.seeded
fi

echo "✨ Starting Next.js production server on port 3000..."
exec npx next start -p 3000 -H 0.0.0.0
