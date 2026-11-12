import { router } from 'expo-router';
import { Ticket } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BrandBar } from '../../components/BrandBar';
import { EventCard } from '../../components/EventCard';
import { Button, Chip, ErrorView, Lead, Loading, Screen, Title } from '../../components/ui';
import { categoryIcon } from '../../lib/icons';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';

export default function Events() {
  const { api, apiUrl } = useSession();
  const [category, setCategory] = useState<string | null>(null);
  const events = useResource(() => api.events(), [api]);
  const upcoming = (events.data ?? []).filter((e) => new Date(e.startsAt) > new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const categories = [...new Set(upcoming.map((e) => e.category).filter((c): c is string => !!c))];
  const list = upcoming.filter((e) => !category || e.category === category);

  return (
    <Screen header={<BrandBar filters={false} />} tabs blobTop={66} refreshing={events.refreshing} onRefresh={events.reload}>
      <Title size={32}>{'События\nв твоём университете'}</Title>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginBottom: 14 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        <Chip title="Все" selected={!category} onPress={() => setCategory(null)} />
        {categories.map((c) => <Chip key={c} title={c} icon={categoryIcon(c)} selected={category === c} onPress={() => setCategory(c)} />)}
        <Chip title="Мои билеты" icon={Ticket} onPress={() => router.push('/tickets')} />
      </ScrollView>
      {events.loading ? <Loading /> : events.error ? <ErrorView message={events.error} onRetry={events.reload} /> : list.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
          <Lead style={{ textAlign: 'center', marginBottom: 16 }}>Скоро здесь появятся новые события. Загляни чуть позже!</Lead>
          <Button title="Мои билеты" icon={Ticket} variant="outline" onPress={() => router.push('/tickets')} />
        </View>
      ) : list.map((e) => (
        <EventCard key={e.id} event={e} apiUrl={apiUrl} onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })} />
      ))}
    </Screen>
  );
}
