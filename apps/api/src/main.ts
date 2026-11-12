import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const doc = new DocumentBuilder()
    .setTitle('CAMPUS API')
    .setDescription('Один API для сайта, приложения и бота. Модули соответствуют блокам A1–A5 модели ИС.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API: http://localhost:${port} · документация: http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap();
