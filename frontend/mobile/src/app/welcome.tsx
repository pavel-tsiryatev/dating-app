import { router } from 'expo-router';
import { Server } from 'lucide-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import { HandHeart, Scribble } from '../components/decor';
import { Button, Lead, Screen, TextLink, Wordmark } from '../components/ui';
import { useSession } from '../lib/session';
import { colors, fonts, shadow } from '../theme';

export default function Welcome() {
  const { apiUrl, startDemo, setDraft } = useSession();

  const start = (existing: boolean) => {
    setDraft({ birthDate: undefined, consent: undefined });
    if (!apiUrl) {
      router.push({ pathname: '/server', params: { next: existing ? 'email' : 'birth' } });
      return;
    }
    router.push(existing ? '/email' : '/birth');
  };

  return (
    <Screen
      blobTop={false}
      header={<View style={{ paddingHorizontal: 20, paddingTop: 14 }}><Wordmark size={34} /></View>}
      footer={(
        <>
          <Button title="Начать знакомиться" arrow onPress={() => start(false)} />
          <View style={styles.row}>
            <Button title="Посмотреть демо" variant="outline" small style={{ flex: 1.5 }} onPress={() => { startDemo(); router.push('/birth'); }} />
            <Button title="Войти" variant="soft" small style={{ flex: 1 }} onPress={() => start(true)} />
          </View>
          <View style={styles.bottomRow}>
            <View style={styles.age}><Text style={styles.ageText}>18+</Text></View>
            <TextLink title={apiUrl ? 'Сервер' : 'Указать сервер'} icon={Server} onPress={() => router.push('/server')} />
          </View>
        </>
      )}
    >
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Твой человек где-то между парами</Text>
        <Scribble size={40} style={styles.scribble} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Lead style={{ flex: 1 }}>Знакомства для студентов. Учёба, тусовки, события и отношения на кампусе.</Lead>
        <HandHeart size={64} style={{ marginTop: -6 }} />
      </View>
      <View style={styles.collage}>
        <View style={styles.blob} />
        <Image source={require('../../assets/anya.jpg')} style={[styles.photo, styles.photoMain]} />
        <Image source={require('../../assets/mark.jpg')} style={[styles.photo, styles.photoLeft]} />
        <Image source={require('../../assets/lena.jpg')} style={[styles.photo, styles.photoRight]} />
        <Scribble size={36} style={{ position: 'absolute', left: 6, top: 64, transform: [{ scaleX: -1 }] }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleWrap: { flexDirection: 'row', marginTop: 14, marginBottom: 12 },
  title: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, color: colors.red, flex: 1, letterSpacing: -0.8 },
  scribble: { marginLeft: -10, marginTop: -8 },
  collage: { height: 330, marginTop: 18 },
  blob: {
    position: 'absolute', right: -40, top: 20, width: 220, height: 260, borderRadius: 120, backgroundColor: colors.red,
    transform: [{ rotate: '24deg' }],
  },
  photo: { position: 'absolute', borderRadius: 16, borderWidth: 4, borderColor: colors.paper, ...shadow },
  photoMain: { width: 230, height: 230, left: 70, top: 6, transform: [{ rotate: '4deg' }] },
  photoLeft: { width: 130, height: 160, left: 0, top: 140, transform: [{ rotate: '-6deg' }] },
  photoRight: { width: 150, height: 130, right: 0, top: 196, transform: [{ rotate: '-4deg' }] },
  row: { flexDirection: 'row', gap: 10 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  age: { borderWidth: 1.2, borderColor: colors.ink, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  ageText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
});

