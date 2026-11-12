import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/** Описание API в формате OpenAPI. Используется для /docs, файла openapi.json и теста на расхождение. */
export function buildOpenApi(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('CAMPUS API')
    .setDescription(
      'Один API для сайта, приложения и бота. Модули соответствуют блокам A1–A5 модели ИС. '
      + 'Подробное описание со сценариями — в docs/API.md.',
    )
    .setVersion('0.2.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}
