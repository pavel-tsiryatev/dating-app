import { router } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useToast } from '../components/toast';
import { Button, Lead, Note, Screen, TextLink, Title, TopBar } from '../components/ui';
import { DEMO_CODE } from '../lib/demo';
import { ApiError } from '../lib/api';
import { remaining } from '../lib/format';
import { useSession } from '../lib/session';
import { colors, fonts, radius } from '../theme';

export default function Code() {
  const { api, draft, setDraft, signIn, demo } = useSession();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const input = useRef<TextInput>(null);
  const resendAt = (draft.codeSentAt ?? 0) + 60_000;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const verify = async (value = code) => {
    if (value.length !== 6 || busy || !draft.email) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.verifyCode({
        email: draft.email,
        code: value,
        ...(draft.birthDate ? { birthDate: draft.birthDate, acceptTerms: !!draft.consent } : {}),
      });
      const me = await signIn(result.accessToken);
      if (result.isNew) router.replace('/verified');
      else router.replace(me.profile ? '/feed' : '/onboarding/about');
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 400 && /рождения|соглас|18/.test(err.message)) {
        // Новый пользователь пришёл через «Уже есть аккаунт»: сначала дата рождения и согласие
        toast('Похоже, ты у нас впервые. Укажи дату рождения — код останется действительным.');
        router.push('/birth');
      } else {
        setError(err.message);
        setCode('');
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await api.requestCode(draft.email!);
      setDraft({ codeSentAt: Date.now() });
      toast('Новый код отправлен');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  return (
    <Screen header={<TopBar back />} wave="right" footer={<Button title="Подтвердить" arrow loading={busy} disabled={code.length !== 6} onPress={() => verify()} />}>
      <Title>Введи код из письма</Title>
      <Lead style={{ marginBottom: 22 }}>
        Мы отправили шестизначный код на почту <Text style={{ fontFamily: fonts.bold }}>{draft.email}</Text>.
      </Lead>
      <Pressable style={styles.boxes} onPress={() => input.current?.focus()} accessibilityLabel="Код из письма">
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={[styles.box, code.length === i && styles.boxActive, !!error && styles.boxError]}>
            <Text style={styles.digit}>{code[i] ?? ''}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={input}
        value={code}
        onChangeText={(t) => {
          const digits = t.replace(/\D/g, '').slice(0, 6);
          setCode(digits);
          setError(null);
          if (digits.length === 6) void verify(digits);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        style={styles.hidden}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.resend}>
        Не пришёл код?{' '}
        {now < resendAt ? (
          <>Отправить ещё раз через <Text style={styles.timer}>{remaining(new Date(resendAt).toISOString(), now)}</Text></>
        ) : (
          <Text style={styles.resendLink} onPress={resend}>Отправить ещё раз</Text>
        )}
      </Text>
      <TextLink title="Изменить почту" icon={Pencil} onPress={() => router.back()} />
      {demo && (
        <View style={{ marginTop: 18 }}>
          <Note title="Деморежим">{`Письма не отправляются. Код — ${DEMO_CODE}.`}</Note>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  box: {
    flex: 1, aspectRatio: 0.82, maxHeight: 64, borderRadius: radius.sm, borderWidth: 1.4, borderColor: colors.line,
    backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center',
  },
  boxActive: { borderColor: colors.red, borderWidth: 2 },
  boxError: { borderColor: colors.red, backgroundColor: colors.blush },
  digit: { fontFamily: fonts.bold, fontSize: 26, color: colors.ink },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 14, marginBottom: 12 },
  resend: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink, lineHeight: 22, marginBottom: 14 },
  timer: { fontFamily: fonts.bold, color: colors.red },
  resendLink: { fontFamily: fonts.bold, color: colors.red, textDecorationLine: 'underline' },
});
