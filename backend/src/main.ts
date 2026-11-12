import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildOpenApi } from './openapi';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  SwaggerModule.setup('docs', app, buildOpenApi(app));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'));
  Logger.log(`API: http://localhost:${port} · документация: http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap();
