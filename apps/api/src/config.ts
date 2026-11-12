const REQUIRED = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'UNIVERSITY_DOMAINS', 'PAYMENT_WEBHOOK_SECRET'] as const;

/** Падаем при старте, если не заданы обязательные переменные окружения (см. .env.example). */
export function validateEnv(env: Record<string, unknown>) {
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) throw new Error(`Не заданы переменные окружения: ${missing.join(', ')}`);
  if (env.NODE_ENV === 'production') {
    if (String(env.JWT_SECRET).length < 32) throw new Error('JWT_SECRET в production должен быть не короче 32 символов');
    if (!env.CORS_ORIGIN) throw new Error('В production задайте CORS_ORIGIN — адреса сайта через запятую');
    if (env.THROTTLE_DISABLED === '1') throw new Error('THROTTLE_DISABLED нельзя включать в production');
  }
  return env;
}
