# CAMPUS

Сервис знакомств и совместных активностей для студентов вузов Екатеринбурга.
Учебный проект УрФУ: один бэкенд для сайта, мобильного приложения и (позже) Telegram-бота.

- Модель ИС (IDEF0, IDEF1X, DFD, IDEF3, UML, ТЗ): [`docs/CAMPUS_IS_model.pdf`](docs/CAMPUS_IS_model.pdf)
- Бэкенд: [`apps/api`](apps/api) — NestJS, PostgreSQL (Prisma), Redis

## Структура

```
apps/
└── api/            бэкенд (NestJS); сюда же добавятся mobile-web (Expo) и bot
docs/               модель ИС и её исходники
docker-compose.yml  postgres + redis + api
```

## Запуск бэкенда

Нужны Node.js 20+ и pnpm (`corepack enable`).

**Вариант 1 — всё в Docker:**

```bash
cp apps/api/.env.example apps/api/.env   # и задать JWT_SECRET (от 32 символов)
docker compose up --build
```

**Вариант 2 — для разработки:**

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # задать JWT_SECRET
docker compose up -d postgres redis      # или свои Postgres и Redis
cd apps/api
pnpm prisma:migrate                      # создать таблицы
pnpm start:dev
```

API: http://localhost:3000, документация Swagger: http://localhost:3000/docs.
Без настроенного SMTP код входа выводится в лог сервера.

## Тесты

```bash
cd apps/api
pnpm test        # юнит-тесты бизнес-правил
pnpm test:e2e    # сквозные сценарии С1–С6; нужны Postgres, Redis и база campus_test:
                 # DATABASE_URL=postgresql://campus:campus@localhost:5432/campus_test pnpm prisma:deploy
```

## Веб-клиент

Мобильный веб-фронтенд: [`mob-front`](mob-front/README.md). Из этой папки `npm start` запускает http://localhost:5173 с прокси к API.

Дополнительные методы для фронтенда, результаты интеграционных проверок и ограничения: [`docs/WEB_INTEGRATION_AUDIT.md`](docs/WEB_INTEGRATION_AUDIT.md).
