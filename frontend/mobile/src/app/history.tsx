import { router } from 'expo-router';
import { Check, Clock, Crown, Ticket, X } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Card, ErrorView, Lead, Loading, Screen, StatusPill, Title, TopBar } from '../components/ui';
import { dateTime, money } from '../lib/format';
import { useSession } from '../lib/session';
import { useResource } from '../lib/useResource';
import { colors, fonts } from '../theme';

export default function History() {
  const { api } = useSession();
  const payments = useResource(() => api.payments(), [api]);
  return (
    <Screen header={<TopBar back />} refreshing={payments.refreshing} onRefresh={payments.reload}>
      <Title>История платежей</Title>
      {payments.loading ? <Loading /> : payments.error ? <ErrorView message={payments.error} onRetry={payments.reload} /> : !payments.data?.length ? (
        <Lead>Платежей пока нет.</Lead>
      ) : payments.data.map((p) => (
        <Card key={p.id} style={styles.row} onPress={p.status === 'PENDING' ? () => router.push({ pathname: '/payment/[id]', params: { id: p.id } }) : undefined}>
          {p.kind === 'PREMIUM' ? <Crown color={colors.red} size={28} /> : <Ticket color={colors.red} size={28} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{p.kind === 'PREMIUM' ? 'CAMPUS Premium' : 'Билет на событие'}</Text>
            {p.createdAt && <Text style={styles.date}>{dateTime(p.createdAt)}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.amount}>{money(p.amount)}</Text>
            {p.status === 'SUCCEEDED' ? <StatusPill title="Оплачено" icon={Check} />
              : p.status === 'FAILED' ? <StatusPill title="Отклонён" tone="red" icon={X} />
                : <StatusPill title="Ожидает" tone="amber" icon={Clock} />}
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  date: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, marginTop: 2 },
  amount: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
});
