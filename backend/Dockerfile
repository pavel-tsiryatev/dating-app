# Сборка из корня репозитория: docker build -f backend/Dockerfile .
FROM node:22-alpine
RUN apk add --no-cache openssl && corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile --filter @campus/api...

COPY backend backend
WORKDIR /app/backend
RUN pnpm exec prisma generate && pnpm build

ENV NODE_ENV=production
EXPOSE 3000
# Перед стартом применяем миграции базы
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
