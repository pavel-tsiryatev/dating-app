import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiResponse } from '@nestjs/swagger';

/** Единый формат ошибки для всех эндпоинтов. */
export class ErrorDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({
    description: 'Текст для пользователя. При ошибке проверки полей (400) — массив строк',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Вы уже оценили эту анкету',
  })
  message: string | string[];

  @ApiPropertyOptional({ example: 'Conflict', description: 'Название HTTP-статуса' })
  error?: string;

  @ApiPropertyOptional({ example: 'LIKE_LIMIT', description: 'Машинный код ошибки, если клиент должен на неё реагировать' })
  code?: string;

  @ApiPropertyOptional({ example: 2, description: 'Сколько попыток ввода кода осталось (только для 422)' })
  attemptsLeft?: number;
}

/** Описывает возможные ошибки эндпоинта: `@ApiErrors({ 404: 'Анкета недоступна', 409: '…' })`. */
export function ApiErrors(errors: Record<number, string>) {
  return applyDecorators(
    ...Object.entries(errors).map(([status, description]) =>
      ApiResponse({ status: Number(status), description, type: ErrorDto }),
    ),
  );
}

/** Ошибки, общие для всех эндпоинтов, где нужен вход. */
export function ApiAuthErrors() {
  return ApiErrors({
    401: 'Нет токена, токен недействителен или пользователь удалён',
    403: 'Аккаунт заблокирован или недостаточно прав',
    429: 'Слишком много запросов с одного адреса (120 в минуту)',
  });
}
