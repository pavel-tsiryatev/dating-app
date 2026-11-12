// e2e-тесты работают с отдельной базой и отдельной базой Redis, чтобы не трогать данные разработки.
// CI не имеет локального .env: тестовый провайдер задаётся явно.
process.env.NODE_ENV = 'test';
process.env.PAYMENT_PROVIDER = 'fake';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://campus:campus@localhost:5432/campus_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-secret';
process.env.UNIVERSITY_DOMAINS = 'urfu.me,urfu.ru';
process.env.PAYMENT_WEBHOOK_SECRET = 'webhook-test-secret';
process.env.PREMIUM_PRICE_KOPECKS = '34900';
// Лимит запросов с одного IP в тестах выключен; сам лимит проверяется отдельным тестом.
process.env.THROTTLE_DISABLED = '1';

// Suite truncates tables and flushes Redis: never accept a development/production target.
if (!/^\/campus_test(?:_[a-z0-9]+)?$/i.test(new URL(process.env.DATABASE_URL).pathname)) {
  throw new Error('E2E разрешён только в отдельной базе campus_test или campus_test_*');
}
if (!/^\/[1-9]\d*$/.test(new URL(process.env.REDIS_URL).pathname)) {
  throw new Error('E2E требует отдельный Redis DB > 0');
}
