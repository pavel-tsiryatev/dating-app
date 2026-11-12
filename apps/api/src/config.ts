const REQUIRED = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'UNIVERSITY_DOMAINS', 'PAYMENT_WEBHOOK_SECRET'] as const;

/** Падаем при старте, если не заданы обязательные переменные окружения (см. .env.example). */
export function validateEnv(env: Record<string, unknown>) {
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) throw new Error(`Не заданы переменные окружения: ${missing.join(', ')}`);
  if (env.NODE_ENV === 'production' && String(env.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET в production должен быть длиннее 32 символов');
  }
  return env;
}
