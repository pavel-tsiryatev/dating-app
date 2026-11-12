import { router } from 'expo-router';
import { Ban, Bell, CreditCard, LogOut, Moon, Server, Shield, User } from 'lucide-react-native';
import { Alert } from 'react-native';
import { Button, ListRow, Screen, Small, Title, TopBar } from '../components/ui';
import { useSession } from '../lib/session';

export default function Settings() {
  const { me, signOut, demo, apiUrl } = useSession();
  const p = me?.profile;

  const logout = () => Alert.alert(demo ? 'Выйти из деморежима?' : 'Выйти из аккаунта?', demo ? 'Проверочные данные сбросятся.' : undefined, [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Выйти', style: 'destructive', onPress: async () => { await signOut(); router.dismissTo('/welcome'); } },
  ]);

  return (
    <Screen header={<TopBar back />} wave="right">
      <Title>Настройки</Title>
      <ListRow icon={Bell} title="Уведомления" subtitle="Симпатии, чаты, события" onPress={() => router.push('/preferences')} />
      <ListRow icon={Moon} title="Тема" subtitle={p?.theme === 'dark' ? 'Тёмная' : 'Светлая'} onPress={() => router.push('/preferences')} />
      <ListRow icon={Shield} title="Приватность" subtitle="Кто видит ваш профиль" onPress={() => router.push('/privacy')} />
      <ListRow icon={Ban} title="Заблокированные" subtitle="Управление блокировками" onPress={() => router.push('/blocks')} />
      <ListRow icon={CreditCard} title="История платежей" subtitle="Билеты и Premium" onPress={() => router.push('/history')} />
      <ListRow icon={User} title="Аккаунт" subtitle={me?.universityEmail ?? 'Почта, данные'} onPress={() => router.push('/privacy')} />
      {!demo && <ListRow icon={Server} title="Сервер" subtitle={apiUrl || 'не указан'} onPress={() => router.push('/server')} />}
      <Button title={demo ? 'Выйти из деморежима' : 'Выйти из аккаунта'} icon={LogOut} variant="soft" onPress={logout} style={{ marginTop: 8 }} />
      <Small style={{ textAlign: 'center', marginTop: 14 }}>CAMPUS 1.0 · учебный проект УрФУ</Small>
    </Screen>
  );
}
