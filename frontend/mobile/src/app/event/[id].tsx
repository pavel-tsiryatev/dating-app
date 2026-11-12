import { router, useLocalSearchParams } from 'expo-router';
import { Armchair, CalendarDays, CalendarPlus, MapPin, Music, Ticket, Users } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAction } from '../../components/toast';
import { Button, Card, ErrorView, Loading, Screen, Title, TopBar } from '../../components/ui';
import { dateLong, fallbackPoster, mediaSource, money, plural } from '../../lib/format';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, fonts, radius } from '../../theme';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, apiUrl } = useSession();
  const action = useAction();
  const data = useResource(async () => {
    const [event, tickets] = await Promise.all([api.event(id), api.tickets()]);
    return { event, ticket: tickets.find((t) => t.eventId === id) };
  }, [api, id]);

  const reserve = action(async () => {
    await api.reserve(id);
    router.push({ pathname: '/reservation/[id]', params: { id } });
  });

  if (data.loading) return <Screen header={<TopBar back center />}><Loading /></Screen>;
  if (!data.data) return <Screen header={<TopBar back center />}><ErrorView message={data.error ?? 'Событие не найдено'} onRetry={data.reload} /></Screen>;
  const { event, ticket } = data.data;
  const reserved = ticket?.status === 'RESERVED' && new Date(ticket.reservedUntil ?? 0) > new Date();
  const paid = ticket?.status === 'PAID';
  const soldOut = event.freeSeats <= 0 && !reserved && !paid;

  const footer = paid ? (
    <Button title="Мой билет" icon={Ticket} arrow onPress={() => router.push({ pathname: '/ticket/[id]', params: { id } })} />
  ) : reserved ? (
    <Button title="Продолжить оплату" icon={Ticket} arrow onPress={() => router.push({ pathname: '/reservation/[id]', params: { id } })} />
  ) : soldOut ? (
    <Button title="Другие события" icon={CalendarPlus} arrow onPress={() => router.back()} />
  ) : (
    <Button title="Забронировать место" icon={Ticket} arrow onPress={reserve} />
  );

  return (
    <Screen header={<TopBar back center />} blobTop={330} footer={footer} refreshing={data.refreshing} onRefresh={data.reload}>
      <Image source={mediaSource(event.posterUrl, apiUrl) ?? fallbackPoster} style={styles.poster} />
      <Title size={34}>{event.title}</Title>
      <Info icon={<CalendarDays color={colors.red} size={20} />} text={dateLong(event.startsAt)} />
      {event.partner && <Info icon={<MapPin color={colors.red} size={20} />} text={`${event.partner.name}\n${event.partner.address}`} />}
      {!!event.description && <Info icon={<Music color={colors.red} size={20} />} text={event.description} />}
      {soldOut ? (
        <Card style={styles.soldOut}>
          <Users color={colors.red} size={34} fill={colors.red} />
          <View style={{ flex: 1 }}>
            <Text style={styles.soldTitle}>Все места заняты</Text>
            <Text style={styles.soldText}>Продано {event.capacity} из {event.capacity} билетов</Text>
          </View>
        </Card>
      ) : (
        <Card style={styles.priceCard}>
          <View style={styles.half}>
            <Ticket color={colors.red} size={28} />
            <View>
              <Text style={styles.big}>{money(event.price)}</Text>
              <Text style={styles.caption}>Входной билет</Text>
            </View>
          </View>
          <View style={styles.sep} />
          <View style={styles.half}>
            <Armchair color={colors.red} size={28} />
            <View>
              <Text style={styles.caption}>Осталось</Text>
              <Text style={styles.seats}>{event.freeSeats} {plural(event.freeSeats, 'место', 'места', 'мест')}</Text>
            </View>
          </View>
        </Card>
      )}
    </Screen>
  );
}

function Info({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <View style={styles.info}>
      {icon}
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  poster: { width: '100%', height: 230, borderRadius: radius.xl, marginBottom: 16, backgroundColor: colors.line },
  info: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.ink },
  priceCard: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  half: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sep: { width: 1, alignSelf: 'stretch', backgroundColor: colors.line, marginHorizontal: 10 },
  big: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.ink },
  caption: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  seats: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  soldOut: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  soldTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.red },
  soldText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
});
