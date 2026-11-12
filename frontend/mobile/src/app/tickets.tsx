import { router } from 'expo-router';
import { Check, ChevronRight, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { EventRow } from '../components/EventCard';
import { Button, Card, ErrorView, Lead, Loading, Screen, SectionTitle, Segmented, StatusPill, Title, TopBar } from '../components/ui';
import { time } from '../lib/format';
import { useSession } from '../lib/session';
import type { Ticket } from '../lib/types';
import { useResource } from '../lib/useResource';

export default function Tickets() {
  const { api, apiUrl } = useSession();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const tickets = useResource(() => api.tickets(), [api]);
  const now = new Date();
  const withEvent = (tickets.data ?? []).filter((t): t is Ticket & { event: NonNullable<Ticket['event']> } => !!t.event);
  const active = withEvent.filter((t) =>
    (t.status === 'PAID' && new Date(t.event.startsAt) > now) || (t.status === 'RESERVED' && new Date(t.reservedUntil ?? 0) > now));
  const past = withEvent.filter((t) => t.status === 'PAID' && new Date(t.event.startsAt) <= now);
  const list = tab === 'active' ? active : past;

  const open = (t: Ticket) => router.push(
    t.status === 'PAID' ? { pathname: '/ticket/[id]', params: { id: t.eventId } } : { pathname: '/reservation/[id]', params: { id: t.eventId } },
  );

  return (
    <Screen header={<TopBar back />} refreshing={tickets.refreshing} onRefresh={tickets.reload}>
      <Title>Мои билеты</Title>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[{ value: 'active', label: 'Активные', count: active.length }, { value: 'past', label: 'Прошедшие', count: past.length }]}
      />
      {tickets.loading ? <Loading /> : tickets.error ? <ErrorView message={tickets.error} onRetry={tickets.reload} /> : list.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Lead style={{ textAlign: 'center', marginBottom: 16 }}>
            {tab === 'active' ? 'Пока нет билетов. Выбери событие — встретимся там!' : 'Здесь появятся события, на которых ты был(а).'}
          </Lead>
          {tab === 'active' && <Button title="К событиям" arrow onPress={() => router.navigate('/events')} />}
        </View>
      ) : (
        <>
          <SectionTitle>{tab === 'active' ? 'Активные билеты' : 'Прошедшие события'}</SectionTitle>
          {list.map((t) => (
            <Card key={t.eventId} onPress={() => open(t)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <EventRow event={t.event} apiUrl={apiUrl}>
                  <View style={{ marginTop: 8 }}>
                    {t.status === 'RESERVED'
                      ? <StatusPill title={`Бронь до ${time(t.reservedUntil!)}`} tone="amber" icon={Clock} />
                      : tab === 'past'
                        ? <StatusPill title={t.checkedInAt ? 'Посещён' : 'Прошло'} tone="muted" icon={Check} />
                        : <StatusPill title="Оплачен" icon={Check} />}
                  </View>
                </EventRow>
              </View>
              <ChevronRight color="#241612" size={22} />
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
