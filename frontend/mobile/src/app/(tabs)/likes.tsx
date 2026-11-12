import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BadgeCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandBar } from '../../components/BrandBar';
import { Button, ErrorView, Lead, Loading, Screen, Segmented, Title } from '../../components/ui';
import { fallbackPhoto, mediaSource } from '../../lib/format';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, fonts, radius, fill } from '../../theme';

interface Tile {
  key: string;
  name: string;
  subtitle?: string;
  photo?: string | null;
  onPress: () => void;
}

export default function Likes() {
  const { api, apiUrl, rememberPeople } = useSession();
  const [tab, setTab] = useState<'mutual' | 'outgoing'>('mutual');
  const data = useResource(async () => {
    const [matches, outgoing] = await Promise.all([api.matches(), api.outgoingLikes()]);
    rememberPeople(outgoing);
    return { matches, outgoing };
  }, [api]);

  const tiles: Tile[] = tab === 'mutual'
    ? (data.data?.matches ?? []).map((m) => {
      const known = data.data?.outgoing.find((p) => p.userId === m.user.id);
      return {
        key: m.id,
        name: `${m.user.name ?? 'Собеседник'}${known?.age ? `, ${known.age}` : ''}`,
        subtitle: known?.institute,
        photo: m.user.photo ?? known?.photos[0]?.storageKey,
        onPress: () => router.push({ pathname: '/chat/[id]', params: { id: m.id } }),
      };
    })
    : (data.data?.outgoing ?? []).map((p) => ({
      key: p.userId,
      name: `${p.name}${p.age ? `, ${p.age}` : ''}`,
      subtitle: p.institute,
      photo: p.photos[0]?.storageKey,
      onPress: () => router.push({ pathname: '/person/[id]', params: { id: p.userId, liked: '1' } }),
    }));

  return (
    <Screen header={<BrandBar />} tabs blobTop={56} refreshing={data.refreshing} onRefresh={data.reload}>
      <Title>Симпатии</Title>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'mutual', label: 'Взаимные', count: data.data?.matches.length ?? 0 },
          { value: 'outgoing', label: 'Исходящие', count: data.data?.outgoing.length ?? 0 },
        ]}
      />
      {data.loading ? <Loading /> : data.error ? <ErrorView message={data.error} onRetry={data.reload} /> : (
        <>
          <Lead style={{ marginBottom: 14 }}>
            {tab === 'mutual' ? 'Вы нравитесь друг другу — напишите первым.' : 'Те, кому ты поставил(а) симпатию. Если ответят взаимностью — откроется чат.'}
          </Lead>
          {tiles.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Lead style={{ textAlign: 'center', marginBottom: 16 }}>
                {tab === 'mutual' ? 'Пока нет взаимных симпатий. Загляни в ленту!' : 'Ты ещё никому не ставил(а) симпатию.'}
              </Lead>
              <Button title="Открыть ленту" arrow onPress={() => router.navigate('/feed')} />
            </View>
          ) : (
            <View style={styles.grid}>
              {tiles.map((t) => (
                <Pressable key={t.key} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]} onPress={t.onPress} accessibilityLabel={t.name}>
                  <Image source={mediaSource(t.photo, apiUrl) ?? fallbackPhoto} style={fill} />
                  <LinearGradient colors={['rgba(20,10,6,0)', 'rgba(20,10,6,0.7)']} style={styles.shade} />
                  <View style={styles.caption}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>{t.name}</Text>
                      <BadgeCheck color={colors.white} fill="#2F80ED" size={18} />
                    </View>
                    {t.subtitle && <Text style={styles.subtitle} numberOfLines={1}>{t.subtitle}</Text>}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', aspectRatio: 0.92, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.line },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  caption: { position: 'absolute', left: 10, right: 10, bottom: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.white, flexShrink: 1 },
  subtitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.white, marginTop: 1 },
});
