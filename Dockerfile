FROM node:22-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
RUN chmod +x docker-entrypoint.sh
RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/prod.db"
ENV JWT_SECRET="android-testers-production-secret-2026-key"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
