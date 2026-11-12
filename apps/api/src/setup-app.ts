import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Общие настройки приложения — и для запуска, и для e2e-тестов. */
export function setupApp(app: INestApplication) {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true });
  app.enableShutdownHooks();
}
