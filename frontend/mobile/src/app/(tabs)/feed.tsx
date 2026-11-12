import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Heart, RefreshCw, SlidersHorizontal, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { BrandBar } from '../../components/BrandBar';
import { EmptyCalendar } from '../../components/illustrations';
import { PersonCard } from '../../components/PersonCard';
import { useToast } from '../../components/toast';
import { Button, ErrorView, Lead, Loading, Screen, Title } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, shadow } from '../../theme';

export default function Feed() {
  const { api, apiUrl, filters, rememberPeople } = useSession();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const feed = useResource(async () => {
    const list = await api.feed(filters);
    rememberPeople(list);
    return list;
  }, [api, filters]);
  const person = feed.data?.[0];

  const decide = async (isLike: boolean) => {
    if (!person || busy) return;
    setBusy(true);
    try {
      void Haptics.impactAsync(isLike ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
      const result = await api.like(person.userId, isLike);
      feed.setData((list) => (list ?? []).filter((p) => p.userId !== person.userId));
      if (result.match && result.matchId) {
        router.push({ pathname: '/match/[id]', params: { id: result.matchId, user: person.userId } });
      }
    } catch (e) {
      const err = e as ApiError;
      if (err.code === 'LIKE_LIMIT') {
        Alert.alert('Лимит лайков на сегодня', 'С Premium лайки без лимита. Или загляни завтра — лимит обновится.', [
          { text: 'Позже', style: 'cancel' },
          { text: 'Узнать о Premium', onPress: () => router.push('/premium') },
        ]);
      } else {
        toast(err.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen header={<BrandBar />} tabs scroll={!person} blobTop={66} refreshing={feed.refreshing} onRefresh={feed.reload}>
      {feed.loading ? <Loading /> : feed.error ? <ErrorView message={feed.error} onRetry={feed.reload} /> : person ? (
        <View style={{ flex: 1, paddingBottom: 12 }}>
          <Title size={26}>{'Знакомься\nсо студентами\nтвоего университета'}</Title>
          <PersonCard
            key={person.userId}
            person={person}
            apiUrl={apiUrl}
            onOpen={() => router.push({ pathname: '/person/[id]', params: { id: person.userId } })}
          />
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.round, styles.skip, pressed && styles.pressed]}
              onPress={() => decide(false)}
              disabled={busy}
              accessibilityLabel="Пропустить"
            >
              <X color={colors.red} size={34} strokeWidth={3} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.round, styles.like, pressed && styles.pressed]}
              onPress={() => decide(true)}
              disabled={busy}
              accessibilityLabel="Поставить симпатию"
            >
              <Heart color={colors.white} fill={colors.white} size={34} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          <Title size={36}>Пока все, но ненадолго</Title>
          <EmptyCalendar />
          <Lead style={{ textAlign: 'center', marginBottom: 22 }}>
            Мы показали все анкеты по твоим фильтрам. Попробуй изменить настройки или загляни позже — новые студенты уже на подходе!
          </Lead>
          <Button title="Изменить фильтры" icon={SlidersHorizontal} arrow onPress={() => router.push('/filters')} />
          <View style={{ height: 10 }} />
          <Button title="Обновить" icon={RefreshCw} variant="outline" onPress={feed.reload} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 34, marginTop: -34 },
  round: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', ...shadow },
  skip: { backgroundColor: colors.blush, borderWidth: 3, borderColor: colors.cream },
  like: { backgroundColor: colors.red, borderWidth: 3, borderColor: colors.cream },
  pressed: { transform: [{ scale: 0.92 }] },
});
