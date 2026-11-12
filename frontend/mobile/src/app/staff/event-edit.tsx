import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Clock, Image as ImageIcon, Plus, Upload, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { DateTimeField } from '../../components/DateTimeField';
import { RoleBadge } from '../../components/RoleBadge';
import { useAction, useToast } from '../../components/toast';
import { Button, Card, Field, Label, Loading, Screen, Select, Small, Title, TopBar } from '../../components/ui';
import { dateShort, mediaSource, time } from '../../lib/format';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, radius } from '../../theme';

const categories = ['Концерты', 'Встречи', 'Вечеринки', 'Спорт', 'Кино', 'Лекции'];

function nextWeek() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(19, 0, 0, 0);
  return d;
}

/** Создание и редактирование события. Пустой `id` — новое событие. */
export default function EventEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { api, apiUrl } = useSession();
  const toast = useToast();
  const action = useAction();
  const data = useResource(async () => {
    const [partners, events] = await Promise.all([api.partners(), id ? api.adminEvents() : Promise.resolve([])]);
    return { partners, event: events.find((e) => e.id === id) };
  }, [api, id]);

  const [title, setTitle] = useState('');
  const [partnerId, setPartnerId] = useState<string>('');
  const [startsAt, setStartsAt] = useState(nextWeek());
  const [capacity, setCapacity] = useState('60');
  const [price, setPrice] = useState('450');
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [poster, setPoster] = useState('');
  const [newPartner, setNewPartner] = useState<{ name: string; address: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!data.data || loaded) return;
    const e = data.data.event;
    if (e) {
      setTitle(e.title);
      setPartnerId(e.partnerId ?? data.data.partners.find((p) => p.name === e.partner?.name)?.id ?? '');
      setStartsAt(new Date(e.startsAt));
      setCapacity(String(e.capacity));
      setPrice(String(Math.round(e.price / 100)));
      setCategory(e.category ?? categories[0]);
      setDescription(e.description ?? '');
      setPoster(e.posterUrl ?? '');
    } else if (data.data.partners[0]?.id) {
      setPartnerId(data.data.partners[0].id);
    }
    setLoaded(true);
  }, [data.data, loaded]);

  const save = (published: boolean) => action(async () => {
    if (title.trim().length < 3) return toast('Укажи название события', 'error');
    let partner = partnerId;
    if (newPartner) {
      if (newPartner.name.trim().length < 2 || newPartner.address.trim().length < 5) return toast('Заполни название и адрес площадки', 'error');
      partner = (await api.createPartner({ name: newPartner.name.trim(), address: newPartner.address.trim() })).id ?? '';
    }
    if (!partner) return toast('Выбери площадку', 'error');
    const input = {
      partnerId: partner,
      title: title.trim(),
      startsAt: startsAt.toISOString(),
      capacity: Math.max(1, Number(capacity) || 0),
      price: Math.max(0, Math.round((Number(price.replace(',', '.')) || 0) * 100)),
      category,
      description: description.trim(),
      posterUrl: poster.trim() || undefined,
      published,
    };
    if (id) await api.updateEvent(id, input);
    else await api.createEvent(input);
    toast(published ? 'Событие опубликовано' : 'Черновик сохранён');
    router.back();
  });

  if (data.loading || !loaded) return <Screen header={<TopBar back center />}><Loading /></Screen>;
  const posterSource = mediaSource(poster.trim(), apiUrl);
  const setDate = (d: Date) => setStartsAt((w) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), w.getHours(), w.getMinutes()));
  const setTime = (d: Date) => setStartsAt((w) => new Date(w.getFullYear(), w.getMonth(), w.getDate(), d.getHours(), d.getMinutes()));

  return (
    <Screen
      header={<TopBar back center />}
      footer={(
        <>
          <Button title="Опубликовать" icon={Upload} onPress={save(true)} />
          <Button title="Сохранить черновик" variant="soft" small onPress={save(false)} />
        </>
      )}
    >
      <RoleBadge role="organizer" />
      <Title size={30}>{id ? 'Редактирование события' : 'Новое событие'}</Title>
      <Field label="Название события *" value={title} onChangeText={setTitle} placeholder="Инди-вечер во дворе" maxLength={120} />
      {newPartner ? (
        <Card>
          <Label>Новая площадка</Label>
          <Field value={newPartner.name} onChangeText={(name) => setNewPartner({ ...newPartner, name })} placeholder="Студсовет УрФУ" />
          <Field value={newPartner.address} onChangeText={(address) => setNewPartner({ ...newPartner, address })} placeholder="Внутренний двор УрФУ, ул. Мира, 19" />
          <Button title="Выбрать из списка" variant="ghost" small onPress={() => setNewPartner(null)} />
        </Card>
      ) : (
        <>
          <Select
            label="Площадка и партнёр *"
            value={partnerId}
            onChange={setPartnerId}
            options={(data.data?.partners ?? []).map((p) => ({ value: p.id ?? '', label: p.name, hint: p.address }))}
          />
          <Button title="Новая площадка" icon={Plus} variant="ghost" small onPress={() => setNewPartner({ name: '', address: '' })} style={{ alignSelf: 'flex-start', marginTop: -8, marginBottom: 6 }} />
        </>
      )}
      <DateTimeField label="Дата" icon={CalendarDays} mode="date" value={startsAt} onChange={setDate} text={dateShort(startsAt.toISOString())} minimumDate={new Date()} />
      <DateTimeField label="Время" icon={Clock} mode="time" value={startsAt} onChange={setTime} text={time(startsAt.toISOString())} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><Field label="Вместимость *" icon={Users} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" /></View>
        <View style={{ flex: 1 }}><Field label="Цена, ₽" value={price} onChangeText={setPrice} keyboardType="decimal-pad" /></View>
      </View>
      <Select label="Категория" value={category} onChange={setCategory} options={categories.map((c) => ({ value: c, label: c }))} />
      <Field label="Описание" value={description} onChangeText={setDescription} multiline maxLength={2000} placeholder="Живой концерт, локальные группы, лаунж-зона…" />
      <Field label="Постер события (ссылка https)" icon={ImageIcon} value={poster} onChangeText={setPoster} autoCapitalize="none" keyboardType="url" placeholder="https://…/poster.jpg" />
      {posterSource ? <Image source={posterSource} style={styles.poster} /> : <Small>Без постера в приложении покажется стандартная картинка.</Small>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  poster: { width: '100%', height: 160, borderRadius: radius.lg, marginBottom: 12, backgroundColor: colors.line },
});
