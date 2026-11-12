import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { BrandBar } from '../../components/BrandBar';
import { useToast } from '../../components/toast';
import { Button, Field, GoalPill, Label, Screen, Select, Title, TopBar } from '../../components/ui';
import { goals, institutes } from '../../lib/format';
import { useSession } from '../../lib/session';
import type { Goal } from '../../lib/types';

const courses = ['1 курс', '2 курс', '3 курс', '4 курс', '5 курс', '6 курс', 'Магистратура', 'Аспирантура'];

/** Шаг 1 анкеты: имя, факультет и курс, цель, «о себе». Тот же экран — для редактирования анкеты. */
export default function About() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { me, draft } = useSession();
  const toast = useToast();
  const p = me?.profile;
  const [name, setName] = useState(p?.name ?? '');
  // Институт и курс хранятся одной строкой «ИРИТ-РтФ · 3 курс»: по началу строки работает фильтр ленты
  const [savedInstitute, savedCourse] = (p?.institute ?? '').split(' · ');
  const [institute, setInstitute] = useState(savedInstitute || draft.institute || institutes[0]);
  const [course, setCourse] = useState(savedCourse || '1 курс');
  const [goal, setGoal] = useState<Goal>(p?.goal ?? 'DATING');
  const [about, setAbout] = useState(p?.about ?? '');

  const next = () => {
    if (!name.trim()) return toast('Как тебя зовут?', 'error');
    router.push({
      pathname: '/onboarding/interests',
      params: { edit: edit ?? '', draft: JSON.stringify({ name: name.trim(), institute: `${institute} · ${course}`, goal, about: about.trim() }) },
    });
  };

  return (
    <Screen
      header={edit ? <TopBar back /> : <BrandBar filters={false} />}
      blobTop={56}
      wave="left"
      footer={<Button title="Далее" arrow onPress={next} />}
    >
      <Title>Расскажи о себе</Title>
      <Field label="Имя" value={name} onChangeText={setName} placeholder="Аня" maxLength={40} autoCapitalize="words" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1.6 }}>
          <Select label="Факультет" value={institute} onChange={setInstitute} options={[...new Set([...institutes, institute])].map((i) => ({ value: i, label: i }))} />
        </View>
        <View style={{ flex: 1 }}>
          <Select label="Курс" value={course} onChange={setCourse} options={courses.map((c) => ({ value: c, label: c }))} />
        </View>
      </View>
      <Label>Цель на CAMPUS</Label>
      <View style={{ marginBottom: 10 }}>
        {(Object.keys(goals) as Goal[]).map((g) => (
          <GoalPill key={g} title={goals[g]} checked={goal === g} onPress={() => setGoal(g)} />
        ))}
      </View>
      <Field
        label="О себе"
        value={about}
        onChangeText={setAbout}
        placeholder="Дизайн, кофе и хорошие разговоры…"
        multiline
        maxLength={160}
        counter={160}
      />
    </Screen>
  );
}
