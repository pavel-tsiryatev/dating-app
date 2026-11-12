import { router } from 'expo-router';
import { BadgeCheck, Search } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { BrandBar } from '../../components/BrandBar';
import { Button, Card, ErrorView, Field, Lead, Loading, Screen, Title } from '../../components/ui';
import { chatTime } from '../../lib/format';
import { isUnread } from '../../lib/readState';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, fonts } from '../../theme';

export default function Chats() {
  const { api, apiUrl, me } = useSession();
  const [query, setQuery] = useState('');
  const matches = useResource(() => api.matches(), [api], 10_000);
  const q = query.trim().toLowerCase();
  const list = (matches.data ?? [])
    .filter((m) => !q || (m.user.name ?? '').toLowerCase().includes(q) || (m.lastMessage?.text ?? '').toLowerCase().includes(q))
    .sort((a, b) => (b.lastMessage?.sentAt ?? b.createdAt).localeCompare(a.lastMessage?.sentAt ?? a.createdAt));

  return (
    <Screen header={<BrandBar />} tabs blobTop={56} wave="right" refreshing={matches.refreshing} onRefresh={matches.reload}>
      <Title>Чаты</Title>
      <Field icon={Search} value={query} onChangeText={setQuery} placeholder="Поиск по чатам" />
      {matches.loading ? <Loading /> : matches.error ? <ErrorView message={matches.error} onRetry={matches.reload} /> : list.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Lead style={{ textAlign: 'center', marginBottom: 16 }}>
            {q ? 'Ничего не нашлось.' : 'Чат появится, когда симпатия станет взаимной.'}
          </Lead>
          {!q && <Button title="Смотреть анкеты" arrow onPress={() => router.navigate('/feed')} />}
        </View>
      ) : list.map((m) => {
        const last = m.lastMessage;
        const unread = !!last && last.senderId !== me?.id && isUnread(m.id, last.sentAt);
        return (
          <Card key={m.id} style={styles.row} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: m.id } })}>
            <Avatar photo={m.user.photo} name={m.user.name} apiUrl={apiUrl} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.top}>
                <Text style={styles.name} numberOfLines={1}>{m.user.name ?? 'Собеседник'}</Text>
                <BadgeCheck color={colors.white} fill={colors.red} size={18} />
                <View style={{ flex: 1 }} />
                <Text style={styles.time}>{chatTime(last?.sentAt ?? m.createdAt)}</Text>
              </View>
              <View style={styles.bottom}>
                <Text style={[styles.preview, unread && { color: colors.ink, fontFamily: fonts.semibold }]} numberOfLines={2}>
                  {last ? `${last.senderId === me?.id ? 'Вы: ' : ''}${last.text}` : 'Новая пара — напиши первым 👋'}
                </Text>
                {unread && <View style={styles.badge}><Text style={styles.badgeText}>1</Text></View>}
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink, flexShrink: 1 },
  time: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  bottom: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 8 },
  preview: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.muted, lineHeight: 19 },
  badge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.white },
});
