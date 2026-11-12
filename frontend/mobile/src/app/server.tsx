import { router, useLocalSearchParams } from 'expo-router';
import { Globe, Server as ServerIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useToast } from '../components/toast';
import { Button, Field, Lead, Note, Screen, Title, TopBar } from '../components/ui';
import { normalizeApiUrl } from '../lib/format';
import { DEFAULT_API_URL, useSession } from '../lib/session';

/** Адрес бэкенда CAMPUS. В релизной сборке задаётся EXPO_PUBLIC_API_URL, здесь его можно поменять. */
export default function Server() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { apiUrl, setApiUrl } = useSession();
  const toast = useToast();
  const [value, setValue] = useState(apiUrl || DEFAULT_API_URL);
  const [status, setStatus] = useState<string | null>(null);

  const check = async () => {
    const url = normalizeApiUrl(value);
    if (!url) {
      setStatus('Укажи адрес сервера');
      return false;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(timer);
      const ok = response.ok && (await response.json().catch(() => null))?.ok === true;
      setStatus(ok ? 'Сервер CAMPUS отвечает' : `Сервер ответил с ошибкой (${response.status})`);
      return ok;
    } catch {
      setStatus('Сервер не отвечает. Проверь адрес и что телефон в той же сети.');
      return false;
    }
  };

  const save = async () => {
    if (!(await check())) return;
    await setApiUrl(value);
    toast('Сервер сохранён');
    if (next === 'birth' || next === 'email') router.replace(`/${next}`);
    else router.back();
  };

  return (
    <Screen header={<TopBar back />} footer={<Button title="Сохранить" arrow onPress={save} />}>
      <Title size={34}>Сервер CAMPUS</Title>
      <Lead style={{ marginBottom: 18 }}>
        Адрес API, к которому подключается приложение. Для проверки на своём компьютере: IP компьютера в локальной сети и порт 3000.
      </Lead>
      <Field
        label="Адрес сервера"
        icon={Globe}
        value={value}
        onChangeText={(t) => { setValue(t); setStatus(null); }}
        placeholder="http://192.168.1.10:3000"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        error={status && !status.startsWith('Сервер CAMPUS') ? status : null}
      />
      {status?.startsWith('Сервер CAMPUS') && <Note icon={ServerIcon}>{status}</Note>}
      <View style={{ height: 8 }} />
      <Button title="Проверить соединение" variant="outline" onPress={async () => { await check(); }} />
      <View style={{ height: 18 }} />
      <Note icon={ServerIcon} title="Без сервера">
        На первом экране есть «Посмотреть демо»: все сценарии работают на проверочных данных, без сети и оплаты.
      </Note>
    </Screen>
  );
}
