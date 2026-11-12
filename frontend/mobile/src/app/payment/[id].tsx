import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Check, Clock, CreditCard, Crown, FileText, FlaskConical, RefreshCw, Ticket, Timer, TriangleAlert, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { EventRow } from '../../components/EventCard';
import { useAction } from '../../components/toast';
import { Button, Card, Divider, ErrorView, Hero, KeyValue, Loading, Note, Screen, StatusPill, TopBar } from '../../components/ui';
import { money, remaining } from '../../lib/format';
import { forgetPaymentKey, isSandboxUrl, paymentKey } from '../../lib/payments';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, fonts } from '../../theme';

/** Статус платежа: проверка → успех / отказ / истёкшая бронь. Пока платёж ожидает, экран опрашивает сервер. */
export default function PaymentScreen() {
  const params = useLocalSearchParams<{ id: string; eventId?: string }>();
  const { id } = params;
  const { api, apiUrl, demo, refreshMe } = useSession();
  const action = useAction();
  const [now, setNow] = useState(Date.now());
  const data = useResource(async () => {
    const payment = await api.payment(id);
    // Из истории платежей экран открывается без eventId — берём его из самого платежа
    const evId = params.eventId || payment.ticket?.eventId;
    const event = evId ? await api.event(evId).catch(() => null) : null;
    const ticket = evId ? (await api.tickets()).find((t) => t.eventId === evId) : undefined;
    return { payment, event, ticket, eventId: evId };
  }, [api, id, params.eventId], 3000);
  const eventId = data.data?.eventId;

  const status = data.data?.payment.status;
  const kind = data.data?.payment.kind ?? 'TICKET';

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (status === 'SUCCEEDED' || status === 'FAILED') forgetPaymentKey(kind, eventId || undefined);
    if (status === 'SUCCEEDED' && kind === 'PREMIUM') void refreshMe();
  }, [status, kind, eventId, refreshMe]);

  if (data.loading) return <Screen header={<TopBar back />}><Loading label="Проверяем оплату…" /></Screen>;
  if (!data.data) return <Screen header={<TopBar back />}><ErrorView message={data.error ?? 'Платёж не найден'} onRetry={data.reload} /></Screen>;
  const { payment, event, ticket } = data.data;
  const reservationLeft = ticket?.status === 'RESERVED' ? new Date(ticket.reservedUntil ?? 0).getTime() - now : 0;
  const expired = kind === 'TICKET' && payment.status !== 'SUCCEEDED' && ticket?.status !== 'PAID' && reservationLeft <= 0;
  const orderNo = `#CMP-${payment.id.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase()}`;
  const eventCard = event && <Card><EventRow event={event} apiUrl={apiUrl} /></Card>;

  const retry = action(async () => {
    forgetPaymentKey(kind, eventId || undefined);
    if (kind === 'TICKET' && eventId) await api.reserve(eventId);
    const next = await api.createPayment(kind, eventId || undefined, paymentKey(kind, eventId || undefined));
    if (!isSandboxUrl(next.confirmationUrl) && next.confirmationUrl) await WebBrowser.openBrowserAsync(next.confirmationUrl);
    router.replace({ pathname: '/payment/[id]', params: { id: next.id, eventId: eventId ?? '' } });
  });

  // ── Успех ──
  if (payment.status === 'SUCCEEDED') {
    if (payment.requiresRefund) {
      return (
        <Screen header={<TopBar back />} wave="right" footer={<Button title="К событиям" onPress={() => router.dismissTo('/events')} />}>
          <Hero icon={TriangleAlert} title="Нужна сверка" tone="soft">
            Оплата пришла, но бронь к этому моменту истекла и билет выдать нельзя. Организатор вернёт деньги.
          </Hero>
          {eventCard}
          <Note>{`Номер заказа ${orderNo}. Сохрани его для обращения к организатору.`}</Note>
        </Screen>
      );
    }
    return (
      <Screen
        header={<TopBar />}
        wave="right"
        footer={kind === 'PREMIUM'
          ? <Button title="Вернуться к анкетам" arrow onPress={() => router.dismissTo('/feed')} />
          : <Button title="Открыть билет" icon={Ticket} onPress={() => router.replace({ pathname: '/ticket/[id]', params: { id: eventId! } })} />}
      >
        <Hero icon={Check} title={kind === 'PREMIUM' ? 'Premium активирован!' : 'Готово, ты идёшь!'} tone="soft">
          {kind === 'PREMIUM' ? 'Лайки без лимита на 30 дней.' : 'Оплата прошла успешно. Билет на событие уже в твоём аккаунте.'}
        </Hero>
        {eventCard}
        <Card style={{ paddingVertical: 6 }}>
          <KeyValue label="Сумма оплаты" value={money(payment.amount)} />
          <Divider />
          <KeyValue label="Номер заказа" value={orderNo} />
          <Divider />
          <KeyValue label="Статус" value={<StatusPill title="Оплачено" icon={Check} />} />
        </Card>
      </Screen>
    );
  }

  // ── Бронь истекла ──
  if (expired) {
    return (
      <Screen header={<TopBar back />} wave="right" footer={<Button title="Проверить места" onPress={() => router.replace({ pathname: '/event/[id]', params: { id: eventId! } })} />}>
        <Hero icon={Timer} title="Время брони вышло" tone="soft">Место снова доступно другим участникам.</Hero>
        {eventCard}
      </Screen>
    );
  }

  // ── Отказ ──
  if (payment.status === 'FAILED') {
    return (
      <Screen
        header={<TopBar back />}
        wave="right"
        footer={(
          <>
            <Button title="Повторить оплату" icon={RefreshCw} onPress={retry} />
            <Button title="Посмотреть заказ" icon={FileText} variant="outline" onPress={() => router.back()} />
          </>
        )}
      >
        <Hero icon={X} title="Оплата не прошла" tone="soft">
          Не удалось списать деньги с карты. Проверь баланс, лимит или данные карты и попробуй ещё раз.
        </Hero>
        {kind === 'TICKET' && reservationLeft > 0 && (
          <Card style={styles.left}>
            <Clock color={colors.red} size={22} />
            <Text style={styles.leftText}>Бронь действует ещё</Text>
            <Text style={styles.leftValue}>{remaining(ticket?.reservedUntil, now)}</Text>
          </Card>
        )}
      </Screen>
    );
  }

  // ── Ожидание ──
  const sandbox = isSandboxUrl(payment.confirmationUrl);
  return (
    <Screen
      header={<TopBar back />}
      wave="right"
      footer={!sandbox && payment.confirmationUrl
        ? <Button title="Открыть страницу оплаты" icon={CreditCard} variant="outline" onPress={() => void WebBrowser.openBrowserAsync(payment.confirmationUrl!)} />
        : undefined}
    >
      <Hero icon={kind === 'PREMIUM' ? Crown : CreditCard} title="Проверяем оплату" tone="soft">
        Подтверждение придёт автоматически — обычно это занимает до 1 минуты.
      </Hero>
      <ActivityIndicator color={colors.red} style={{ marginBottom: 18 }} />
      {sandbox && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <FlaskConical color={colors.red} size={24} />
            <Text style={styles.sandboxTitle}>{demo ? 'Деморежим' : 'Тестовая оплата'}</Text>
          </View>
          <Text style={styles.sandboxText}>Деньги не списываются, данные карты не нужны. Выбери результат платежа:</Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            <Button title="Подтвердить оплату" small onPress={action(async () => { await api.simulatePayment(id, 'succeeded'); await data.reload(); })} />
            <Button title="Имитировать отказ" small variant="outline" onPress={action(async () => { await api.simulatePayment(id, 'canceled'); await data.reload(); })} />
          </View>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  leftText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, flex: 1 },
  leftValue: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.red },
  sandboxTitle: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink },
  sandboxText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink, lineHeight: 20 },
});
