import { useLocalSearchParams } from 'expo-router';
import { Check, CircleCheck, FileText, TriangleAlert, User } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RoleBadge } from '../../../components/RoleBadge';
import { useAction, useToast } from '../../../components/toast';
import { Button, Card, ChoiceCard, ErrorView, Loading, Screen, SectionTitle, Small, StatusPill, Title, TopBar } from '../../../components/ui';
import { chatTime, dateTime } from '../../../lib/format';
import { decisions, priority, reportNumber } from '../../../lib/moderation';
import { useSession } from '../../../lib/session';
import { useResource } from '../../../lib/useResource';
import { colors, fonts, radius } from '../../../theme';

type Decision = keyof typeof decisions;

/** Рассмотрение жалобы: кто, что написал, причина — и решение модератора. */
export default function ReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const toast = useToast();
  const action = useAction();
  const [decision, setDecision] = useState<Decision>('BLOCKED');
  const report = useResource(() => api.adminReport(id), [api, id]);

  const confirm = action(async () => {
    await api.decide(id, decision);
    toast('Решение зафиксировано');
    await report.reload();
  });

  if (report.loading) return <Screen header={<TopBar back center />}><Loading /></Screen>;
  if (!report.data) return <Screen header={<TopBar back center />}><ErrorView message={report.error ?? 'Жалоба не найдена'} onRetry={report.reload} /></Screen>;
  const r = report.data;
  const p = priority(r.reason);
  const closed = r.status === 'CLOSED';

  return (
    <Screen
      header={<TopBar back center />}
      footer={closed ? undefined : <Button title="Подтвердить решение" icon={Check} onPress={confirm} />}
    >
      <RoleBadge role="moderator" />
      <Title size={30}>Рассмотрение жалобы</Title>
      <View style={styles.head}>
        <View>
          <Text style={styles.number}>Жалоба {reportNumber(r.id)}</Text>
          <Small>Получена {dateTime(r.createdAt)}</Small>
        </View>
        <StatusPill title={p.label} tone={p.tone} icon={TriangleAlert} />
      </View>
      <SectionTitle>Пользователь, на которого поступила жалоба</SectionTitle>
      <Card style={styles.user}>
        <View style={styles.avatar}><User color={colors.red} size={30} fill={colors.red} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{r.target?.profile?.name ?? 'Пользователь'}</Text>
          <Small>Статус: {r.target?.status === 'BLOCKED' ? 'заблокирован' : r.target?.status === 'HIDDEN' ? 'скрыт до решения' : 'активен'}</Small>
        </View>
      </Card>
      {!!r.messages?.length && (
        <>
          <SectionTitle>Сообщения из переписки</SectionTitle>
          {r.messages.slice(0, 5).map((m) => (
            <View key={m.id} style={[styles.quote, m.senderId === r.targetId && styles.quoteTarget]}>
              <Text style={styles.quoteText}>«{m.text}»</Text>
              <Small>{m.senderId === r.targetId ? 'Нарушитель' : 'Автор жалобы'} · {chatTime(m.sentAt)}</Small>
            </View>
          ))}
        </>
      )}
      <SectionTitle>Причина жалобы</SectionTitle>
      <Text style={styles.reason}>{r.reason}</Text>
      {closed ? (
        <Card style={styles.done}>
          <FileText color={colors.red} size={26} />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>Решение зафиксировано</Text>
            <Small>Жалоба {reportNumber(r.id)} · {decisions[r.decision as Decision]?.title ?? 'закрыта'}</Small>
          </View>
          <CircleCheck color={colors.green} size={24} />
        </Card>
      ) : (
        <>
          <SectionTitle>Результат модерации</SectionTitle>
          {(Object.keys(decisions) as Decision[]).map((d) => (
            <ChoiceCard key={d} title={decisions[d].title} hint={decisions[d].hint} checked={decision === d} danger={d === 'BLOCKED'} onPress={() => setDecision(d)} />
          ))}
          <Small style={{ textAlign: 'center' }}>Решение закроет все открытые жалобы на этого человека.</Small>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  number: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  user: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  userName: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  quote: { backgroundColor: colors.paper, borderRadius: radius.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.line },
  quoteTarget: { backgroundColor: colors.blush, borderColor: colors.blush },
  quoteText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, marginBottom: 4 },
  reason: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink, lineHeight: 21, marginBottom: 8 },
  done: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
});
