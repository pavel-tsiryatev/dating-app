import { router } from 'expo-router';
import { ChevronRight, TriangleAlert, User } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RoleBadge } from '../../components/RoleBadge';
import { Card, ErrorView, Lead, Loading, Screen, Segmented, StatusPill, Title, TopBar } from '../../components/ui';
import { chatTime } from '../../lib/format';
import { decisions, priority, reportNumber } from '../../lib/moderation';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, fonts } from '../../theme';

export default function Reports() {
  const { api } = useSession();
  const [tab, setTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const reports = useResource(() => api.adminReports('ALL'), [api]);
  const open = (reports.data ?? []).filter((r) => r.status === 'OPEN').sort((a, b) => priority(a.reason).rank - priority(b.reason).rank);
  const closed = (reports.data ?? []).filter((r) => r.status === 'CLOSED');
  const list = tab === 'OPEN' ? open : closed;

  return (
    <Screen header={<TopBar back />} refreshing={reports.refreshing} onRefresh={reports.reload}>
      <RoleBadge role="moderator" />
      <Title size={32}>Жалобы от пользователей</Title>
      <Segmented value={tab} onChange={setTab} options={[{ value: 'OPEN', label: 'Новые', count: open.length }, { value: 'CLOSED', label: 'Закрытые', count: closed.length }]} />
      {reports.loading ? <Loading /> : reports.error ? <ErrorView message={reports.error} onRetry={reports.reload} /> : list.length === 0 ? (
        <Lead>{tab === 'OPEN' ? 'Новых жалоб нет. Хорошая работа!' : 'Закрытых жалоб пока нет.'}</Lead>
      ) : list.map((r) => {
        const p = priority(r.reason);
        return (
          <Card key={r.id} style={styles.row} onPress={() => router.push({ pathname: '/staff/report/[id]', params: { id: r.id } })}>
            <View style={styles.avatar}><User color={colors.red} size={26} fill={colors.red} /></View>
            <View style={{ flex: 1 }}>
              <View style={styles.top}>
                <Text style={styles.title}>Жалоба {reportNumber(r.id)}</Text>
                <Text style={styles.time}>{chatTime(r.createdAt)}</Text>
              </View>
              <Text style={styles.sub}>На: {r.target?.profile?.name ?? 'пользователь'}</Text>
              <View style={{ marginVertical: 6 }}>
                {r.status === 'OPEN' ? <StatusPill title={p.label} tone={p.tone} icon={TriangleAlert} /> : <StatusPill title={decisions[r.decision as keyof typeof decisions]?.title ?? 'Закрыта'} tone="muted" />}
              </View>
              <Text style={styles.reason} numberOfLines={2}>{r.reason}</Text>
            </View>
            <ChevronRight color={colors.ink} size={22} />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  time: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  sub: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  reason: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
});
