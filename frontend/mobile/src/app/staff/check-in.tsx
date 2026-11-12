import { QrCode } from 'lucide-react-native';
import { useState } from 'react';
import { RoleBadge } from '../../components/RoleBadge';
import { useToast } from '../../components/toast';
import { Button, Field, Lead, Note, Screen, Title, TopBar } from '../../components/ui';
import { useSession } from '../../lib/session';

/** Отметка входа на событие по коду из QR билета. Каждый билет — один раз. */
export default function CheckIn() {
  const { api } = useSession();
  const toast = useToast();
  const [token, setToken] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const check = async () => {
    try {
      await api.checkIn(token.trim());
      setResult('Вход отмечен. Хорошего вечера!');
      toast('Билет действителен');
      setToken('');
    } catch (e) {
      setResult(null);
      toast((e as Error).message, 'error');
    }
  };

  return (
    <Screen header={<TopBar back />} footer={<Button title="Отметить вход" onPress={check} disabled={token.trim().length < 8} />}>
      <RoleBadge role="organizer" />
      <Title>Отметить вход</Title>
      <Lead style={{ marginBottom: 16 }}>Введи код из QR билета: его видно под QR или можно скопировать в приложении участника.</Lead>
      <Field label="Код билета" icon={QrCode} value={token} onChangeText={setToken} autoCapitalize="none" autoCorrect={false} placeholder="xxxxxxxx-xxxx-…" />
      {result && <Note>{result}</Note>}
    </Screen>
  );
}
