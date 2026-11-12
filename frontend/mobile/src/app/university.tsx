import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Checkbox, Field, Lead, Radio, Screen, Select, Title, TopBar } from '../components/ui';
import { institutes, universities } from '../lib/format';
import { useSession } from '../lib/session';
import { colors, fonts, radius } from '../theme';

export default function University() {
  const { draft, setDraft } = useSession();
  const [query, setQuery] = useState('');
  const [university, setUniversity] = useState(draft.university ?? 'УрФУ');
  const [institute, setInstitute] = useState(draft.institute ?? 'ИнЭУ');
  const q = query.trim().toLowerCase();
  const list = universities.filter((u) => !q || u.short.toLowerCase().includes(q) || u.full.toLowerCase().includes(q));

  return (
    <Screen
      header={<TopBar back />}
      footer={<Button title="Продолжить" arrow onPress={() => { setDraft({ university, institute }); router.push('/email'); }} />}
    >
      <Title>Какой у тебя университет?</Title>
      <Lead style={{ marginBottom: 16 }}>Выбери свой вуз и факультет, чтобы находить своих.</Lead>
      <Field icon={Search} value={query} onChangeText={setQuery} placeholder="Поиск по вузам" />
      {list.map((u) => {
        const active = u.short === university;
        return (
          <Pressable
            key={u.short}
            onPress={() => setUniversity(u.short)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.option, active && styles.optionActive]}
          >
            {active ? <Checkbox checked /> : <Radio checked={false} />}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.short}>{u.short}</Text>
              <Text style={styles.full}>{u.full}</Text>
            </View>
          </Pressable>
        );
      })}
      {list.length === 0 && <Lead style={{ marginBottom: 12 }}>Такого вуза пока нет в списке.</Lead>}
      <View style={{ height: 8 }} />
      <Select
        label="Факультет / институт"
        value={institute}
        onChange={setInstitute}
        options={institutes.map((i) => ({ value: i, label: i }))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: radius.md, borderWidth: 1.2,
    borderColor: colors.line, backgroundColor: colors.paper, marginBottom: 10,
  },
  optionActive: { backgroundColor: colors.blush, borderColor: colors.blush },
  short: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink },
  full: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, marginTop: 2 },
});
