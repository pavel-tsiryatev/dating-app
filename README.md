# CAMPUS

Сервис знакомств и совместных активностей для студентов вузов Екатеринбурга.
Учебный проект УрФУ: один бэкенд и три варианта клиента — сайт, мобильное приложение и Telegram.

- Модель ИС (IDEF0, IDEF1X, DFD, IDEF3, UML, ТЗ): [`docs/CAMPUS_IS_model.pdf`](docs/CAMPUS_IS_model.pdf)
- Бэкенд: [`backend`](backend) — NestJS, PostgreSQL (Prisma), Redis
- Клиенты: [`frontend/web`](frontend/web) (сайт), [`frontend/mobile`](frontend/mobile), [`frontend/telegram`](frontend/telegram)
- Аудит проекта и план по трём клиентам: [`docs/AUDIT.md`](docs/AUDIT.md)
- Документация API со сценариями и примерами: [`docs/API.md`](docs/API.md); схема OpenAPI: [`backend/openapi.json`](backend/openapi.json) — общий контракт для всех клиентов

## Структура

```
backend/            API (NestJS, Prisma, Redis) — один для всех клиентов
frontend/
├── web/            сайт: адаптивный веб-клиент, работает (телефон и компьютер)
├── mobile/         мобильное приложение (Expo) — пока только план
└── telegram/       бот + Mini App — пока только план
docs/               модель ИС, документация API, аудиты
docker-compose.yml  postgres + redis + api
```

## Запуск бэкенда

Нужны Node.js 20+ и pnpm (`corepack enable`).

**Вариант 1 — всё в Docker:**

```bash
cp backend/.env.example backend/.env     # и задать JWT_SECRET (от 32 символов)
docker compose up --build
```

**Вариант 2 — для разработки:**

```bash
pnpm install
cp backend/.env.example backend/.env     # задать JWT_SECRET
docker compose up -d postgres redis      # или свои Postgres и Redis
cd backend
pnpm prisma:migrate                      # создать таблицы
pnpm start:dev
```

API: http://localhost:3000, документация Swagger: http://localhost:3000/docs.
Без настроенного SMTP код входа выводится в лог сервера.

## Тесты

```bash
cd backend
pnpm test        # юнит-тесты бизнес-правил
pnpm test:e2e    # сквозные сценарии С1–С6; нужны Postgres, Redis и база campus_test:
                 # DATABASE_URL=postgresql://campus:campus@localhost:5432/campus_test pnpm prisma:deploy
```

## Сайт

Веб-клиент: [`frontend/web`](frontend/web/README.md). `pnpm web:dev` из корня (или `npm start` в папке) запускает http://localhost:5173 с прокси к API.

Дополнительные методы для фронтенда, результаты интеграционных проверок и ограничения: [`docs/WEB_INTEGRATION_AUDIT.md`](docs/WEB_INTEGRATION_AUDIT.md).
