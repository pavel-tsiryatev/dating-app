import { router } from 'expo-router';
import { GraduationCap, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { useAction } from '../components/toast';
import { Button, Field, Lead, Note, Screen, Title, TopBar } from '../components/ui';
import { useSession } from '../lib/session';

export default function Email() {
  const { api, draft, setDraft, demo } = useSession();
  const action = useAction();
  const [email, setEmail] = useState(draft.email ?? (demo ? 'anna@urfu.me' : ''));
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const send = action(async () => {
    const normalized = email.trim().toLowerCase();
    // Повторный заход на экран в течение минуты не шлёт второй код — сервер всё равно ответит 429
    if (draft.email === normalized && draft.codeSentAt && Date.now() - draft.codeSentAt < 60_000) {
      router.push('/code');
      return;
    }
    await api.requestCode(normalized);
    setDraft({ email: normalized, codeSentAt: Date.now() });
    router.push('/code');
  });

  return (
    <Screen header={<TopBar back />} wave="right" footer={<Button title="Получить код" arrow disabled={!valid} onPress={send} />}>
      <Title>Подтверди статус студента</Title>
      <Lead style={{ marginBottom: 22 }}>Введи свою университетскую почту, чтобы подтвердить, что ты действующий студент.</Lead>
      <Field
        label="Почта вуза"
        icon={Mail}
        value={email}
        onChangeText={setEmail}
        placeholder="anna@urfu.me"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => valid && void send()}
      />
      <Note icon={GraduationCap} title="Зачем это нужно?">
        Мы подтверждаем, что ты учишься в вузе. Так в CAMPUS только реальные студенты.
      </Note>
    </Screen>
  );
}
