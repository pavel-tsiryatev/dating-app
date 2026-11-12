import { Ban } from 'lucide-react-native';
import { useAction } from '../components/toast';
import { Button, ErrorView, Lead, ListRow, Loading, Screen, Title, TopBar } from '../components/ui';
import { useSession } from '../lib/session';
import { useResource } from '../lib/useResource';

export default function Blocks() {
  const { api } = useSession();
  const action = useAction();
  const blocks = useResource(() => api.blocks(), [api]);
  return (
    <Screen header={<TopBar back />} refreshing={blocks.refreshing} onRefresh={blocks.reload}>
      <Title>Заблокированные</Title>
      {blocks.loading ? <Loading /> : blocks.error ? <ErrorView message={blocks.error} onRetry={blocks.reload} /> : !blocks.data?.length ? (
        <Lead>Ты никого не блокировал(а). Заблокировать можно из анкеты или чата через «…».</Lead>
      ) : blocks.data.map((b) => (
        <ListRow
          key={b.blocked.id}
          icon={Ban}
          title={b.blocked.profile?.name ?? 'Пользователь'}
          subtitle="Не видит тебя, ты не видишь его"
          right={(
            <Button
              title="Разблокировать"
              small
              variant="outline"
              onPress={action(async () => { await api.unblock(b.blocked.id); await blocks.reload(); })}
            />
          )}
        />
      ))}
    </Screen>
  );
}
