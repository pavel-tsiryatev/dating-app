import { router } from 'expo-router';
import { Eye, GraduationCap, Info, Trash2 } from 'lucide-react-native';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useToast } from '../components/toast';
import { Card, ListRow, Note, Screen, Small, Title, Toggle, TopBar } from '../components/ui';
import { useProfileUpdate } from '../lib/useProfileUpdate';
import { useSession } from '../lib/session';
import { colors, fonts } from '../theme';

export default function Privacy() {
  const { me, api, signOut } = useSession();
  const toast = useToast();
  const update = useProfileUpdate();
  const p = me?.profile;

  const remove = () => Alert.alert(
    'Удалить аккаунт?',
    'Анкета, фото, симпатии, переписка, билеты и платежи будут удалены без возможности восстановления.',
    [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить навсегда',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteAccount();
            await signOut();
            toast('Аккаунт удалён');
            router.dismissTo('/welcome');
          } catch (e) {
            toast((e as Error).message, 'error');
          }
        },
      },
    ],
  );

  return (
    <Screen header={<TopBar back />} wave="right">
      <Title>Приватность</Title>
      <Card>
        <View style={styles.row}>
          <GraduationCap color={colors.ink} size={28} />
          <Text style={styles.title}>Скрыть от своего института</Text>
          <Toggle value={!!p?.hideFromInstitute} onChange={(v) => void update({ hideFromInstitute: v })} label="Скрыть от своего института" />
        </View>
        <Small style={styles.hint}>
          Твой профиль не будет показываться студентам твоего института ({p?.university ?? 'вуз'}).
        </Small>
      </Card>
      <Card>
        <View style={styles.row}>
          <Eye color={colors.ink} size={28} />
          <Text style={styles.title}>Видимость профиля</Text>
          <Toggle value={p?.isVisible !== false} onChange={(v) => void update({ isVisible: v })} label="Видимость профиля" />
        </View>
        <Small style={styles.hint}>Кто может видеть твою анкету в ленте и симпатиях. Выключи, чтобы взять паузу.</Small>
      </Card>
      <Note icon={Info}>Ты по-прежнему можешь общаться с теми, кому уже поставил(а) симпатию.</Note>
      <Card>
        <Text style={styles.title}>Почта вуза</Text>
        <Small style={{ marginTop: 4 }}>{me?.universityEmail}</Small>
      </Card>
      <ListRow icon={Trash2} title="Удалить аккаунт" danger onPress={remove} />
      <Small style={{ textAlign: 'center' }} >
        <Text onPress={() => router.push('/policy')} style={{ textDecorationLine: 'underline' }}>Политика конфиденциальности</Text>
      </Small>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontFamily: fonts.displaySoft, fontSize: 17, color: colors.ink },
  hint: { marginTop: 8, color: colors.ink },
});
