import { CalendarDays, Download, Heart, TrendingUp, Users, Wallet } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { RoleBadge } from '../../components/RoleBadge';
import { useAction } from '../../components/toast';
import { Button, Card, ErrorView, Loading, Screen, Select, SectionTitle, Small, Title, TopBar } from '../../components/ui';
import { compactMoney } from '../../lib/format';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, fonts, radius } from '../../theme';

type Period = 'month' | '30' | '7';
const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function range(period: Period) {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const from = period === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(to.getTime() - Number(period) * 86_400_000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function Stats() {
  const { api } = useSession();
  const action = useAction();
  const [period, setPeriod] = useState<Period>('month');
  const data = useResource(async () => {
    const { from, to } = range(period);
    const [stats, daily] = await Promise.all([api.stats(from, to), api.dailyStats(from, to)]);
    return { stats, daily };
  }, [api, period]);
  const now = new Date();
  const periods = [
    { value: 'month' as const, label: `1 – ${now.getDate()} ${months[now.getMonth()]}` },
    { value: '30' as const, label: 'Последние 30 дней' },
    { value: '7' as const, label: 'Последние 7 дней' },
  ];
  const max = Math.max(1, ...(data.data?.daily ?? []).map((d) => d.registrations));

  const exportCsv = action(async () => {
    if (!data.data) return;
    const { stats, daily } = data.data;
    const rows = [
      'Показатель;Значение',
      `Регистрации;${stats.newUsers}`, `Матчи;${stats.matches}`, `Встречи;${stats.meetingsAccepted}`,
      `Билеты;${stats.ticketsPaid}`, `Premium;${stats.premiumBought}`, `Выручка, ₽;${Math.round(stats.revenueKopecks / 100)}`,
      '', 'День;Регистрации', ...daily.map((d) => `${d.day};${d.registrations}`),
    ];
    await Share.share({ title: 'Отчёт CAMPUS', message: rows.join('\n') });
  });

  return (
    <Screen header={<TopBar back center />} refreshing={data.refreshing} onRefresh={data.reload}
      footer={<Button title="Экспорт отчёта (CSV)" icon={Download} variant="soft" onPress={exportCsv} disabled={!data.data} />}>
      <RoleBadge role="admin" />
      <Title>Отчёты команды</Title>
      <Select icon={CalendarDays} value={period} onChange={setPeriod} options={periods} />
      {data.loading ? <Loading /> : data.error || !data.data ? <ErrorView message={data.error ?? 'Нет данных'} onRetry={data.reload} /> : (
        <>
          <View style={styles.tiles}>
            <Tile icon={<Users color={colors.red} size={22} />} label="Новые" value={String(data.data.stats.newUsers)} />
            <Tile icon={<Heart color={colors.red} size={22} />} label="Матчи" value={String(data.data.stats.matches)} />
            <Tile icon={<Wallet color={colors.red} size={22} />} label="Выручка" value={compactMoney(data.data.stats.revenueKopecks)} />
          </View>
          <View style={styles.tiles}>
            <Small>Встреч: {data.data.stats.meetingsAccepted}</Small>
            <Small>Билетов: {data.data.stats.ticketsPaid}</Small>
            <Small>Premium: {data.data.stats.premiumBought}</Small>
          </View>
          <SectionTitle>Регистрации по дням</SectionTitle>
          <Card>
            <View style={styles.chart}>
              {data.data.daily.map((d) => (
                <View key={d.day} style={styles.barSlot}>
                  <View style={[styles.bar, { height: `${(d.registrations / max) * 100}%` }]} />
                </View>
              ))}
            </View>
            <View style={styles.axis}>
              <Small>{data.data.daily[0]?.day.slice(8)}.{data.data.daily[0]?.day.slice(5, 7)}</Small>
              <TrendingUp color={colors.red} size={18} />
              <Small>{data.data.daily.at(-1)?.day.slice(8)}.{data.data.daily.at(-1)?.day.slice(5, 7)}</Small>
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card style={styles.tile}>
      {icon}
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  tile: { flex: 1, padding: 12 },
  tileLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.ink, marginTop: 6 },
  tileValue: { fontFamily: fonts.display, fontSize: 24, color: colors.red },
  chart: { height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { backgroundColor: colors.red, borderTopLeftRadius: radius.sm / 3, borderTopRightRadius: radius.sm / 3, minHeight: 2 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
});
