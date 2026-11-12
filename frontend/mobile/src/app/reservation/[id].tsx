import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Clock, CreditCard, Search, TicketCheck, Timer } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EventRow } from '../../components/EventCard';
import { useAction } from '../../components/toast';
import { Button, Card, Divider, ErrorView, Hero, KeyValue, Loading, Screen, TopBar } from '../../components/ui';
import { money, remaining } from '../../lib/format';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, fonts } from '../../theme';

/** Бронь на 30 минут: таймер и переход к оплате. Когда время выходит — экран «Время брони вышло». */
export default function Reservation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, apiUrl } = useSession();
  const action = useAction();
  const [now, setNow] = useState(Date.now());
  const data = useResource(async () => {
    const [event, tickets] = await Promise.all([api.event(id), api.tickets()]);
    return { event, ticket: tickets.find((t) => t.eventId === id) };
  }, [api, id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (data.loading) return <Screen header={<TopBar close={() => router.back()} center />}><Loading /></Screen>;
  if (!data.data) return <Screen header={<TopBar close={() => router.back()} center />}><ErrorView message={data.error ?? 'Бронь не найдена'} onRetry={data.reload} /></Screen>;
  const { event, ticket } = data.data;
  const until = ticket?.reservedUntil ?? null;
  const expired = !ticket || ticket.status !== 'RESERVED' || new Date(until ?? 0).getTime() <= now;

  if (ticket?.status === 'PAID') return <Redirect href={{ pathname: '/ticket/[id]', params: { id } }} />;

  if (expired) {
    return (
      <Screen
        header={<TopBar close={() => router.back()} center />}
        wave="right"
        footer={<Button title="Проверить места" icon={Search} onPress={action(async () => { await api.reserve(id); await data.reload(); })} />}
      >
        <Hero icon={Timer} title="Время брони вышло" tone="soft">Место снова доступно другим участникам.</Hero>
        <Card><EventRow event={event} apiUrl={apiUrl} /></Card>
      </Screen>
    );
  }

  return (
    <Screen
      header={<TopBar close={() => router.back()} center />}
      footer={(
        <>
          <Button title="Перейти к оплате" icon={CreditCard} arrow onPress={() => router.push({ pathname: '/checkout', params: { kind: 'TICKET', eventId: id } })} />
          <Button title="Отменить бронь" variant="ghost" small onPress={action(async () => { await api.cancelReservation(id); router.back(); })} />
        </>
      )}
    >
      <Hero icon={TicketCheck} title="Место ждёт тебя 30 минут" tone="soft">Мы зарезервировали 1 билет на событие</Hero>
      <Card><EventRow event={event} apiUrl={apiUrl} /></Card>
      <View style={{ paddingHorizontal: 4 }}>
        <KeyValue label="Билет" value={`1 × ${money(event.price)}`} />
        <Divider />
        <KeyValue label="Итого" value={money(event.price)} strong />
      </View>
      <Card style={styles.timer}>
        <View style={styles.timerHead}>
          <Clock color={colors.red} size={22} />
          <Text style={styles.timerLabel}>Оплатить до</Text>
        </View>
        <Text style={styles.timerValue}>{remaining(until, now)}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: { alignItems: 'center', marginTop: 12 },
  timerHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerLabel: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  timerValue: { fontFamily: fonts.extrabold, fontSize: 52, color: colors.red, letterSpacing: 1 },
});
