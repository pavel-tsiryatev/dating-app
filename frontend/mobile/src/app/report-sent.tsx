import { router, useLocalSearchParams } from 'expo-router';
import { EyeOff, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useToast } from '../components/toast';
import { Button, Card, Hero, Screen, Small, Toggle, TopBar } from '../components/ui';
import { useSession } from '../lib/session';
import { colors, fonts } from '../theme';

/** Жалоба отправлена. «Скрыть профиль» блокирует пользователя лично для себя. */
export default function ReportSent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const toast = useToast();
  const [hidden, setHidden] = useState(false);

  const toggle = async (value: boolean) => {
    setHidden(value);
    try {
      if (value) await api.block(id);
      else await api.unblock(id);
    } catch (e) {
      setHidden(!value);
      toast((e as Error).message, 'error');
    }
  };

  return (
    <Screen
      header={<TopBar />}
      wave="right"
      footer={<Button title="Вернуться в CAMPUS" onPress={() => router.dismissTo('/feed')} />}
    >
      <Hero icon={ShieldCheck} title="Жалоба отправлена" tone="soft">
        Мы рассмотрим её в течение 24 часов и примем меры, если найдём нарушение правил CAMPUS.
      </Hero>
      <Card style={styles.row}>
        <EyeOff color={colors.ink} size={26} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Скрыть профиль</Text>
          <Small>Он больше не будет показываться в ленте и симпатиях</Small>
        </View>
        <Toggle value={hidden} onChange={toggle} label="Скрыть профиль" />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
});
