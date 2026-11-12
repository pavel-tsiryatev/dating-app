import { router } from 'expo-router';
import { ChevronRight, Plus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EventRow } from '../../components/EventCard';
import { RoleBadge } from '../../components/RoleBadge';
import { Button, Card, ErrorView, Lead, Loading, Screen, Segmented, StatusPill, Title, TopBar } from '../../components/ui';
import { plural } from '../../lib/format';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, fonts } from '../../theme';

export default function StaffEvents() {
  const { api, apiUrl } = useSession();
  const [tab, setTab] = useState<'published' | 'drafts'>('published');
  const events = useResource(() => api.adminEvents(), [api]);
  const published = (events.data ?? []).filter((e) => e.published !== false);
  const drafts = (events.data ?? []).filter((e) => e.published === false);
  const list = tab === 'published' ? published : drafts;

  return (
    <Screen
      header={<TopBar back />}
      refreshing={events.refreshing}
      onRefresh={events.reload}
      footer={<Button title="Создать событие" icon={Plus} onPress={() => router.push('/staff/event-edit')} />}
    >
      <RoleBadge role="organizer" />
      <Title size={32}>Управление событиями</Title>
      <Segmented value={tab} onChange={setTab} options={[{ value: 'published', label: 'Опубликовано', count: published.length }, { value: 'drafts', label: 'Черновики', count: drafts.length }]} />
      {events.loading ? <Loading /> : events.error ? <ErrorView message={events.error} onRetry={events.reload} /> : list.length === 0 ? (
        <Lead>{tab === 'published' ? 'Опубликованных событий нет.' : 'Черновиков нет.'}</Lead>
      ) : list.map((e) => {
        const going = e.capacity - e.freeSeats;
        return (
          <Card key={e.id} style={styles.row} onPress={() => router.push({ pathname: '/staff/event-edit', params: { id: e.id } })}>
            <View style={{ flex: 1 }}>
              <EventRow event={e} apiUrl={apiUrl}>
                <View style={styles.going}>
                  <Users color={colors.red} size={15} />
                  <Text style={styles.goingText}>{going} {plural(going, 'участник', 'участника', 'участников')} из {e.capacity}</Text>
                </View>
                <View style={{ marginTop: 6 }}>
                  {e.published === false ? <StatusPill title="Черновик" tone="muted" /> : <StatusPill title="Опубликовано" />}
                </View>
              </EventRow>
            </View>
            <ChevronRight color={colors.ink} size={22} />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  going: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  goingText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
});
