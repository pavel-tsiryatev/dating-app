/**
 * Записывает описание API в openapi.json: pnpm openapi
 * Запускать после любого изменения эндпоинтов. База и Redis для этого не нужны.
 * Тест e2e проверяет, что файл не расходится с кодом.
 */
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { join } from 'path';

const defaults: Record<string, string> = {
  DATABASE_URL: 'postgresql://campus:campus@localhost:5432/campus',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'openapi-generation-only',
  UNIVERSITY_DOMAINS: 'urfu.me',
  PAYMENT_WEBHOOK_SECRET: 'openapi-generation-only',
};
for (const [k, v] of Object.entries(defaults)) process.env[k] ??= v;

async function main() {
  // Импорт после установки переменных: модуль читает их при загрузке
  const { AppModule } = await import('../src/app.module');
  const { buildOpenApi } = await import('../src/openapi');
  const app = await NestFactory.create(AppModule, { logger: false });
  const file = join(__dirname, '..', 'openapi.json');
  writeFileSync(file, JSON.stringify(buildOpenApi(app), null, 2) + '\n');
  console.log(`Записано: ${file}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
