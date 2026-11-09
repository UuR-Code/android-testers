FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

RUN chmod +x docker-entrypoint.sh
RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/prod.db"
ENV JWT_SECRET="android-testers-production-secret-2026-key"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
