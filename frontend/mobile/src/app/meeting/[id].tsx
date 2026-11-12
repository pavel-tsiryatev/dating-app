import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Clock, MapPin, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DateTimeField } from '../../components/DateTimeField';
import { useAction, useToast } from '../../components/toast';
import { Button, Card, Chip, Field, Screen, Title, TopBar } from '../../components/ui';
import { dateShort, makeId, time } from '../../lib/format';
import { useSession } from '../../lib/session';
import { colors, fonts } from '../../theme';

const places = ['Кофейня у главного корпуса', 'Центр культуры', 'Парк Маяковского', 'Антикафе «Циферблат»'];

function tomorrowAt(hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 30, 0, 0);
  return d;
}

/** Предложить встречу в совпадении: место, дата, время, заметка. Заметка уходит обычным сообщением. */
export default function ProposeMeeting() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const toast = useToast();
  const action = useAction();
  const [place, setPlace] = useState(places[0]);
  const [when, setWhen] = useState(tomorrowAt(18));
  const [note, setNote] = useState('');

  const setDate = (d: Date) => setWhen((w) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), w.getHours(), w.getMinutes()));
  const setTime = (d: Date) => setWhen((w) => new Date(w.getFullYear(), w.getMonth(), w.getDate(), d.getHours(), d.getMinutes()));

  const submit = action(async () => {
    if (place.trim().length < 3) return toast('Укажи место встречи', 'error');
    if (when <= new Date()) return toast('Выбери время в будущем', 'error');
    await api.proposeMeeting(id, place.trim(), when.toISOString());
    if (note.trim()) await api.sendMessage(id, makeId(), note.trim());
    toast('Предложение отправлено');
    router.back();
  });

  return (
    <Screen header={<TopBar back />} wave="right" footer={<Button title="Предложить встречу" onPress={submit} />}>
      <Title size={32}>Предложить встречу</Title>
      <Field label="Место" icon={MapPin} value={place} onChangeText={setPlace} maxLength={200} placeholder="Кофейня у главного корпуса" />
      <View style={styles.suggestions}>
        {places.map((p) => <Chip key={p} title={p} size="sm" selected={p === place} onPress={() => setPlace(p)} />)}
      </View>
      <DateTimeField label="Дата" icon={CalendarDays} mode="date" value={when} onChange={setDate} text={dateShort(when.toISOString())} minimumDate={new Date()} />
      <DateTimeField label="Время" icon={Clock} mode="time" value={when} onChange={setTime} text={time(when.toISOString())} />
      <Card>
        <View style={styles.noteHead}>
          <Pencil color={colors.red} size={18} />
          <Text style={styles.noteTitle}>Заметка <Text style={styles.optional}>(необязательно)</Text></Text>
        </View>
        <Field value={note} onChangeText={setNote} placeholder="Выпьем кофе перед концертом?" multiline maxLength={160} counter={160} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -4, marginBottom: 16 },
  noteHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  noteTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.red },
  optional: { fontFamily: fonts.medium, color: colors.muted },
});
