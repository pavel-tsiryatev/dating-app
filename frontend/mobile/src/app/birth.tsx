import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useToast } from '../components/toast';
import { Button, Card, Checkbox, Lead, Screen, Select, Title, TopBar } from '../components/ui';
import { age, months, plural } from '../lib/format';
import { useSession } from '../lib/session';
import { colors, fonts } from '../theme';

const thisYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => String(thisYear - 17 - i));
const days = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

export default function Birth() {
  const { draft, setDraft } = useSession();
  const toast = useToast();
  const initial = draft.birthDate ? new Date(draft.birthDate) : null;
  const [day, setDay] = useState(initial ? String(initial.getDate()) : '14');
  const [month, setMonth] = useState(initial ? String(initial.getMonth()) : '7');
  const [year, setYear] = useState(initial ? String(initial.getFullYear()) : String(thisYear - 22));
  const [consent, setConsent] = useState(!!draft.consent);

  const maxDay = days(Number(month), Number(year));
  const safeDay = Math.min(Number(day), maxDay);
  const iso = `${year}-${String(Number(month) + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
  const years18 = age(iso);
  const adult = years18 >= 18;

  const next = () => {
    if (!adult) return toast('CAMPUS доступен только с 18 лет', 'error');
    if (!consent) return toast('Нужно согласие на обработку персональных данных', 'error');
    setDraft({ birthDate: iso, consent: true });
    router.push('/university');
  };

  return (
    <Screen header={<TopBar back />} footer={<Button title="Продолжить" arrow onPress={next} disabled={!adult || !consent} />}>
      <Title>Когда ты родился(ась)?</Title>
      <Lead style={{ marginBottom: 22 }}>Знакомства для студентов от 18 лет.</Lead>
      <View style={styles.row}>
        <View style={{ flex: 0.8 }}>
          <Select label="День" value={String(safeDay)} onChange={setDay} options={Array.from({ length: maxDay }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} />
        </View>
        <View style={{ flex: 1.4 }}>
          <Select label="Месяц" value={month} onChange={setMonth} options={months.map((m, i) => ({ value: String(i), label: m }))} />
        </View>
        <View style={{ flex: 1.1 }}>
          <Select label="Год" value={year} onChange={setYear} options={years.map((y) => ({ value: y, label: y }))} />
        </View>
      </View>
      <Card style={styles.ageCard}>
        <View style={[styles.badge, !adult && { borderColor: colors.muted }]}>
          <Text style={[styles.badgeText, !adult && { color: colors.muted }]}>18+</Text>
        </View>
        <Text style={styles.ageText}>
          {adult
            ? <>Тебе уже <Text style={{ fontFamily: fonts.extrabold }}>{years18} {plural(years18, 'год', 'года', 'лет')}</Text> — можно продолжать!</>
            : 'CAMPUS доступен только с 18 лет'}
        </Text>
        {adult && <Check color={colors.ink} size={22} strokeWidth={2.6} />}
      </Card>
      <Pressable style={styles.consent} onPress={() => setConsent(!consent)} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
        <Checkbox checked={consent} />
        <Text style={styles.consentText}>
          Соглашаюсь с{' '}
          <Text style={styles.link} onPress={() => router.push('/policy')}>
            Политикой конфиденциальности
          </Text>
          {' '}и обработкой персональных данных
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  ageCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  badge: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.extrabold, color: colors.red, fontSize: 14 },
  ageText: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink, lineHeight: 22 },
  consent: { flexDirection: 'row', gap: 12, marginTop: 18, alignItems: 'flex-start' },
  consentText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.ink },
  link: { color: colors.red, textDecorationLine: 'underline', fontFamily: fonts.semibold },
});
