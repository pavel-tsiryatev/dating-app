import { router, useLocalSearchParams } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandBar } from '../../components/BrandBar';
import { HandHeart } from '../../components/decor';
import { useAction, useToast } from '../../components/toast';
import { Button, Chip, Field, Lead, Screen, Title, TopBar } from '../../components/ui';
import { interestOptions } from '../../lib/format';
import { capitalize, interestIcon } from '../../lib/icons';
import { useSession } from '../../lib/session';
import type { Goal } from '../../lib/types';
import { colors, fonts } from '../../theme';

/** Шаг 2 анкеты: 3–10 интересов. Здесь анкета сохраняется на сервере. */
export default function Interests() {
  const params = useLocalSearchParams<{ edit?: string; draft?: string }>();
  const { api, me, draft, refreshMe } = useSession();
  const toast = useToast();
  const action = useAction();
  const base = me?.profile;
  const [selected, setSelected] = useState<string[]>((base?.interests ?? []).map(capitalize));
  const [custom, setCustom] = useState('');
  const options = [...new Set([...interestOptions, ...selected])];

  const toggle = (name: string) => {
    setSelected((s) => {
      if (s.includes(name)) return s.filter((x) => x !== name);
      if (s.length >= 10) {
        toast('Можно выбрать до 10 интересов');
        return s;
      }
      return [...s, name];
    });
  };

  const addCustom = () => {
    const name = capitalize(custom.trim());
    if (name.length < 2) return;
    if (!selected.some((s) => s.toLowerCase() === name.toLowerCase())) toggle(name);
    setCustom('');
  };

  const save = action(async () => {
    const step = params.draft ? (JSON.parse(params.draft) as { name: string; institute: string; goal: Goal; about: string }) : null;
    await api.saveProfile({
      name: step?.name ?? base?.name ?? '',
      institute: step?.institute ?? base?.institute ?? '',
      goal: step?.goal ?? base?.goal ?? 'DATING',
      about: step?.about ?? base?.about ?? undefined,
      university: base?.university ?? draft.university ?? 'УрФУ',
      interests: selected,
      hideFromInstitute: base?.hideFromInstitute,
      isVisible: base?.isVisible,
      notifications: base?.notifications,
      theme: base?.theme,
    });
    await refreshMe();
    if (params.edit) {
      toast('Анкета сохранена');
      router.dismissTo('/profile');
    } else {
      router.replace('/onboarding/photos');
    }
  });

  return (
    <Screen
      header={params.edit ? <TopBar back /> : <BrandBar filters={false} />}
      blobTop={56}
      wave="left"
      footer={<Button title="Сохранить" onPress={save} disabled={selected.length < 3} />}
    >
      <Title>Что вас сблизит?</Title>
      <Lead style={{ marginBottom: 18 }}>Выбери от 3 до 10 интересов.</Lead>
      <View style={styles.grid}>
        {options.map((name) => (
          <Chip key={name} title={name} icon={interestIcon(name)} selected={selected.includes(name)} onPress={() => toggle(name)} />
        ))}
      </View>
      <View style={styles.custom}>
        <View style={{ flex: 1 }}>
          <Field value={custom} onChangeText={setCustom} placeholder="Свой интерес" maxLength={30} onSubmitEditing={addCustom} returnKeyType="done" />
        </View>
        <Button title="" icon={Plus} variant="outline" small onPress={addCustom} style={{ width: 54, marginBottom: 14 }} />
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.count}>Выбрано {selected.length} из 10</Text>
        <HandHeart size={60} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  custom: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  footerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  count: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
});
