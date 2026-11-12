import { router } from 'expo-router';
import { Sparkles, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RangeSlider } from '../components/RangeSlider';
import { Button, Chip, IconButton, Label, Select, Title } from '../components/ui';
import { goalShort, institutes, universities } from '../lib/format';
import { goalIcon } from '../lib/icons';
import { useSession } from '../lib/session';
import type { Goal } from '../lib/types';
import { colors, fonts } from '../theme';

const ANY = '';

/** Фильтры ленты — шторка поверх экрана. */
export default function Filters() {
  const insets = useSafeAreaInsets();
  const { filters, setFilters, me } = useSession();
  const [low, setLow] = useState(filters.minAge ?? 18);
  const [high, setHigh] = useState(filters.maxAge ?? 30);
  const [university, setUniversity] = useState(filters.university ?? me?.profile?.university ?? ANY);
  const [institute, setInstitute] = useState(filters.institute ?? ANY);
  const [goal, setGoal] = useState<Goal | undefined>(filters.goal);

  const apply = () => {
    setFilters({
      minAge: low,
      maxAge: high >= 40 ? undefined : high,
      university: university || undefined,
      institute: institute || undefined,
      goal,
    });
    router.back();
  };

  const reset = () => {
    setFilters({});
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} accessibilityLabel="Закрыть фильтры" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.head}>
            <Title size={32} style={{ flex: 1, marginBottom: 0 }}>Фильтры</Title>
            <IconButton icon={X} onPress={() => router.back()} label="Закрыть" />
          </View>
          <View style={styles.ageRow}>
            <Label style={{ marginBottom: 0 }}>Возраст</Label>
            <Text style={styles.ageValue}>{low} – {high >= 40 ? '40+' : high} лет</Text>
          </View>
          <RangeSlider min={18} max={40} low={low} high={high} onChange={(l, h) => { setLow(l); setHigh(h); }} />
          <Select
            label="Университет"
            value={university}
            onChange={setUniversity}
            options={[{ value: ANY, label: 'Любой' }, ...universities.map((u) => ({ value: u.short, label: u.full }))]}
          />
          <Select
            label="Институт / факультет"
            value={institute}
            onChange={setInstitute}
            options={[{ value: ANY, label: 'Любой' }, ...institutes.map((i) => ({ value: i, label: i }))]}
          />
          <Label>Цель знакомства</Label>
          <View style={styles.goals}>
            {(Object.keys(goalShort) as Goal[]).map((g) => (
              <Chip key={g} title={goalShort[g]} icon={goalIcon[g]} selected={goal === g} onPress={() => setGoal(goal === g ? undefined : g)} />
            ))}
            <Chip title="Без ярлыков" icon={Sparkles} selected={!goal} onPress={() => setGoal(undefined)} />
          </View>
          <Button title="Применить фильтры" arrow onPress={apply} />
          <View style={{ height: 10 }} />
          <Button title="Сбросить" variant="soft" onPress={reset} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.cream, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 10,
    maxHeight: '88%',
  },
  handle: { width: 48, height: 5, borderRadius: 3, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 8 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ageValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  goals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
});
