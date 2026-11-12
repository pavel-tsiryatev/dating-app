import { router } from 'expo-router';
import { Check, GraduationCap } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { HandHeart, Scribble } from '../components/decor';
import { Button, Card, Lead, Screen, TopBar } from '../components/ui';
import { useSession } from '../lib/session';
import { colors, fonts, shadow } from '../theme';

export default function Verified() {
  const { me } = useSession();
  return (
    <Screen
      header={<TopBar center />}
      blobTop={20}
      wave="right"
      footer={<Button title={me?.profile ? 'Перейти к анкете' : 'Создать анкету'} arrow onPress={() => router.replace('/onboarding/about')} />}
    >
      <View style={styles.hero}>
        <Scribble size={44} style={{ transform: [{ scaleX: -1 }], marginTop: 6 }} />
        <View style={styles.circle}>
          <Check color={colors.white} size={78} strokeWidth={3.4} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <Text style={styles.title}>Теперь ты среди своих</Text>
        <HandHeart size={60} />
      </View>
      <Card style={styles.badge}>
        <GraduationCap color={colors.red} size={34} />
        <Text style={styles.badgeText}>Статус студента подтверждён</Text>
      </Card>
      <Lead>Тебя ждут знакомства, события на кампусе и новые люди из твоего университета.</Lead>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 26 },
  circle: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', ...shadow,
  },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 40, lineHeight: 42, color: colors.red, letterSpacing: -0.8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 20, borderRadius: 40, paddingHorizontal: 22 },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink, flex: 1 },
});
