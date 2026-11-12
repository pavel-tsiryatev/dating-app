# CAMPUS · mobile

Мобильное приложение (iOS / Android). **Пока не начато**: здесь будет второй из трёх клиентов, которые мы пробуем
(сайт — [`../web`](../web), бот — [`../telegram`](../telegram)).

Все три клиента работают с одним бэкендом [`../../backend`](../../backend) и одним контрактом —
[`backend/openapi.json`](../../backend/openapi.json).

## Предлагаемый стек

- **Expo (React Native) + TypeScript.** В `backend/.env.example` уже разрешён origin `http://localhost:8081`
  (Expo dev server), а `NotificationsService` написан с расчётом на Expo Push.
- Типизированный клиент API генерируется из `openapi.json` (например, `openapi-typescript` + `openapi-fetch`),
  а не пишется руками.
- Токен — в `expo-secure-store`, не в AsyncStorage.

## Что нужно от бэкенда до первого релиза

Подробности и приоритеты — в [`docs/AUDIT.md`](../../docs/AUDIT.md), раздел «Мобильное приложение».

1. Долгая сессия: refresh-токен и выход с устройства (сейчас только JWT на 7 дней без отзыва).
2. Push: таблица push-токенов устройств, отправка из `NotificationsService`.
3. Новые сообщения без опроса каждые 5 секунд: WebSocket или SSE.
4. Абсолютные адреса фото: API отдаёт `/api/media/…`, приложению нужен базовый URL.
5. Оплата: deep link возврата после оплаты; Premium в приложении для iOS/Android подпадает под правила
   встроенных покупок магазинов — решить до разработки экрана оплаты.
