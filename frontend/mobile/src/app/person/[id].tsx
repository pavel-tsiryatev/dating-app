import { router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, ChevronLeft, ChevronRight, Ellipsis, GraduationCap, Heart, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAction, useToast } from '../../components/toast';
import { Button, Chip, ErrorView, IconButton, Lead, Screen, SectionTitle, TopBar } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { fallbackPhoto, goals, mediaSource } from '../../lib/format';
import { capitalize, interestIcon } from '../../lib/icons';
import { useSession } from '../../lib/session';
import { colors, fonts, radius, fill } from '../../theme';

export default function PersonScreen() {
  const { id, liked } = useLocalSearchParams<{ id: string; liked?: string }>();
  const { api, apiUrl, person: find, me } = useSession();
  const toast = useToast();
  const action = useAction();
  const person = find(id);
  const [index, setIndex] = useState(0);

  if (!person) {
    return <Screen header={<TopBar back center />}><ErrorView message="Анкета больше недоступна" onRetry={() => router.back()} /></Screen>;
  }
  const photos = person.photos.length ? person.photos : [{ id: 'none', storageKey: '' }];
  const source = mediaSource(photos[index].storageKey, apiUrl) ?? fallbackPhoto;
  const mine = new Set((me?.profile?.interests ?? []).map((i) => i.toLowerCase()));
  const interests = [...person.interests].sort((a, b) => Number(mine.has(b.toLowerCase())) - Number(mine.has(a.toLowerCase())));

  const like = action(async () => {
    try {
      const result = await api.like(person.userId, true);
      if (result.match && result.matchId) router.replace({ pathname: '/match/[id]', params: { id: result.matchId, user: person.userId } });
      else {
        toast(`Симпатия отправлена. Если ${person.name} ответит взаимностью — откроется чат`);
        router.back();
      }
    } catch (e) {
      if ((e as ApiError).code === 'LIKE_LIMIT') router.push('/premium');
      throw e;
    }
  });

  const menu = () => Alert.alert(person.name, undefined, [
    { text: 'Пожаловаться', onPress: () => router.push({ pathname: '/report/[id]', params: { id: person.userId, name: person.name } }) },
    {
      text: 'Заблокировать',
      style: 'destructive',
      onPress: () => Alert.alert(`Заблокировать ${person.name}?`, 'Вы перестанете видеть друг друга в ленте, симпатиях и чатах.', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Заблокировать', style: 'destructive', onPress: action(async () => { await api.block(person.userId); toast('Пользователь заблокирован'); router.back(); }) },
      ]),
    },
    { text: 'Отмена', style: 'cancel' },
  ]);

  return (
    <Screen
      header={<TopBar back center right={<IconButton icon={Ellipsis} onPress={menu} label="Ещё" />} />}
      blobTop={400}
      footer={liked ? undefined : <Button title="Поставить симпатию" icon={Heart} onPress={like} />}
    >
      <View style={styles.gallery}>
        <Image source={source} style={fill} resizeMode="cover" />
        <View style={styles.counter}><Text style={styles.counterText}>{index + 1}/{photos.length}</Text></View>
        {photos.length > 1 && (
          <>
            <Pressable style={[styles.arrow, { left: 10 }]} onPress={() => setIndex((i) => (i - 1 + photos.length) % photos.length)} accessibilityLabel="Предыдущее фото">
              <ChevronLeft color={colors.white} size={22} />
            </Pressable>
            <Pressable style={[styles.arrow, { right: 10 }]} onPress={() => setIndex((i) => (i + 1) % photos.length)} accessibilityLabel="Следующее фото">
              <ChevronRight color={colors.white} size={22} />
            </Pressable>
          </>
        )}
      </View>
      <View style={styles.nameRow}>
        <Text style={styles.name}>{person.name}{person.age ? `, ${person.age}` : ''}</Text>
        <BadgeCheck color={colors.white} fill="#2F80ED" size={28} />
      </View>
      <View style={styles.meta}><GraduationCap color={colors.red} size={19} /><Text style={styles.metaText}>{person.institute}</Text></View>
      <View style={styles.meta}><MapPin color={colors.red} size={19} /><Text style={styles.metaText}>{person.university}, Екатеринбург</Text></View>
      <View style={{ marginTop: 6 }}><Chip title={goals[person.goal]} size="sm" /></View>
      {!!person.about && <Lead style={{ marginTop: 14 }}>{person.about}</Lead>}
      {interests.length > 0 && (
        <>
          <SectionTitle>{person.common ? 'Общие интересы' : 'Интересы'}</SectionTitle>
          <View style={styles.chips}>
            {interests.map((i) => <Chip key={i} title={capitalize(i)} icon={interestIcon(i)} size="sm" />)}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gallery: { height: 300, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.line, marginBottom: 14 },
  counter: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(36,22,18,0.6)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  counterText: { color: colors.white, fontFamily: fonts.bold, fontSize: 13 },
  arrow: {
    position: 'absolute', top: '45%', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(36,22,18,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.display, fontSize: 32, color: colors.red },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  metaText: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
