import { Bell, Moon, Sun } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Card, ChoiceCard, Label, Screen, Small, Title, Toggle, TopBar } from '../components/ui';
import { useProfileUpdate } from '../lib/useProfileUpdate';
import { useSession } from '../lib/session';
import { colors, fonts } from '../theme';

export default function Preferences() {
  const { me } = useSession();
  const update = useProfileUpdate();
  const p = me?.profile;
  return (
    <Screen header={<TopBar back />}>
      <Title>Твой CAMPUS</Title>
      <Card>
        <View style={styles.row}>
          <Bell color={colors.red} size={26} />
          <Text style={styles.title}>Уведомления о совпадениях и сообщениях</Text>
          <Toggle value={p?.notifications !== false} onChange={(v) => void update({ notifications: v })} label="Уведомления" />
        </View>
        <Small style={{ marginTop: 8 }}>Симпатии, чаты, решения по жалобам и оплата.</Small>
      </Card>
      <Label style={{ marginTop: 8 }}>Тема</Label>
      <ChoiceCard title="Светлая" hint="Бежевый CAMPUS" checked={p?.theme !== 'dark'} onPress={() => void update({ theme: 'light' })} />
      <ChoiceCard title="Тёмная" hint="Сохраняется в аккаунте; в приложении появится в следующей версии" checked={p?.theme === 'dark'} onPress={() => void update({ theme: 'dark' })} />
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 8 }}>
        <Sun color={colors.muted} size={18} />
        <Moon color={colors.muted} size={18} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
});
