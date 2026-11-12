import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { HandHeart, Scribble } from '../../components/decor';
import { Button, Lead, Screen, TopBar } from '../../components/ui';
import { fallbackPhoto, mediaSource, nameCase } from '../../lib/format';
import { useSession } from '../../lib/session';
import { colors, fonts, shadow } from '../../theme';

export default function MatchScreen() {
  const { id, user } = useLocalSearchParams<{ id: string; user?: string }>();
  const { person, me, apiUrl } = useSession();
  const other = user ? person(user) : undefined;
  const name = other?.name ?? 'собеседник';
  const theirs = mediaSource(other?.photos[0]?.storageKey, apiUrl) ?? fallbackPhoto;
  const mine = mediaSource(me?.profile?.photos[0]?.storageKey, apiUrl) ?? fallbackPhoto;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <Screen
      header={<TopBar />}
      blobTop={false}
      footer={(
        <>
          <Button title={`Написать ${nameCase(name, 'dative')}`} icon={MessageCircle} arrow onPress={() => router.replace({ pathname: '/chat/[id]', params: { id } })} />
          <Button title="Продолжить смотреть" variant="soft" onPress={() => router.back()} />
        </>
      )}
    >
      <View style={{ flexDirection: 'row' }}>
        <Text style={styles.title}>Это{'\n'}взаимно!</Text>
        <Scribble size={52} style={{ marginTop: 6 }} />
      </View>
      <Lead style={{ textAlign: 'center', fontSize: 18, marginTop: 8 }}>
        Вы с {nameCase(name, 'instrumental')} понравились друг другу.
      </Lead>
      <View style={styles.photos}>
        <View style={styles.redLeft} />
        <View style={styles.redRight} />
        <Image source={mine} style={[styles.photo, styles.left]} />
        <Image source={theirs} style={[styles.photo, styles.right]} />
        <HandHeart size={96} style={styles.heart} />
        <Scribble size={40} style={{ position: 'absolute', left: 18, top: -6, transform: [{ scaleX: -1 }] }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 54, lineHeight: 56, color: colors.red, letterSpacing: -1.2 },
  photos: { height: 290, marginTop: 30 },
  photo: { position: 'absolute', width: 168, height: 210, borderRadius: 18, borderWidth: 5, borderColor: colors.paper, ...shadow },
  left: { left: 4, top: 30, transform: [{ rotate: '-7deg' }] },
  right: { right: 4, top: 14, transform: [{ rotate: '6deg' }] },
  redLeft: { position: 'absolute', left: -40, top: 120, width: 120, height: 150, borderRadius: 70, backgroundColor: colors.red },
  redRight: { position: 'absolute', right: -40, top: 0, width: 130, height: 120, borderRadius: 70, backgroundColor: colors.red },
  heart: { position: 'absolute', left: '38%', bottom: 4 },
});
