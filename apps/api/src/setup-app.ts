import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IncomingMessage, ServerResponse } from 'http';

/** Общие настройки приложения — и для запуска, и для e2e-тестов. */
export function setupApp(app: INestApplication) {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  // В разработке разрешены любые адреса; в production список обязателен (проверяется в config.ts)
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) ?? true });
  app.enableShutdownHooks();
  // За reverse proxy (nginx, балансировщик) без этого лимиты запросов считаются по адресу прокси — общий лимит на всех.
  // TRUST_PROXY: число прокси-хопов (обычно 1) или список адресов, как в Express.
  if (process.env.TRUST_PROXY) {
    const value = /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY;
    (app as NestExpressApplication).set('trust proxy', value);
  }

  // Лог запросов (требование S3): метод, путь без параметров, статус и время. Тела запросов не пишем —
  // в них коды входа и переписка.
  const log = new Logger('HTTP');
  app.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const started = Date.now();
    res.on('finish', () => {
      const path = (req.url ?? '').split('?')[0];
      const line = `${req.method} ${path} ${res.statusCode} ${Date.now() - started}ms`;
      if (res.statusCode >= 500) log.error(line);
      else log.log(line);
    });
    next();
  });
}
