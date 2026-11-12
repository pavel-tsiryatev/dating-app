import { Redirect, router } from 'expo-router';
import { CalendarDays, ChartColumn, QrCode, Shield } from 'lucide-react-native';
import { ListRow, Screen, Title, TopBar } from '../../components/ui';
import { useSession } from '../../lib/session';

/** Вход в инструменты команды. Права всё равно проверяет сервер. */
export default function Staff() {
  const { me } = useSession();
  if (!me || me.role === 'STUDENT') return <Redirect href="/profile" />;
  const admin = me.role === 'ADMIN';
  return (
    <Screen header={<TopBar back />} wave="right">
      <Title>Команда CAMPUS</Title>
      <ListRow icon={Shield} title="Жалобы" subtitle="Очередь модерации" onPress={() => router.push('/staff/reports')} />
      {admin && (
        <>
          <ListRow icon={CalendarDays} title="События" subtitle="Публикация и черновики" onPress={() => router.push('/staff/events')} />
          <ListRow icon={QrCode} title="Отметить вход" subtitle="Код билета с QR" onPress={() => router.push('/staff/check-in')} />
          <ListRow icon={ChartColumn} title="Отчёты" subtitle="Регистрации, матчи, выручка" onPress={() => router.push('/staff/stats')} />
        </>
      )}
    </Screen>
  );
}
