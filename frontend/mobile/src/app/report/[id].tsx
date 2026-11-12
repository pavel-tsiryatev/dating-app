import { router, useLocalSearchParams } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAction } from '../../components/toast';
import { Button, Card, ChoiceCard, Field, Lead, Screen, Title, TopBar } from '../../components/ui';
import { useSession } from '../../lib/session';
import { colors, fonts } from '../../theme';

const reasons = [
  { title: 'Оскорбления', hint: 'Грубое или неуважительное общение' },
  { title: 'Спам', hint: 'Навязчивые сообщения или реклама' },
  { title: 'Чужие фото', hint: 'Похоже, что фото принадлежат не ему/ей' },
  { title: 'Другое', hint: 'Опиши ситуацию подробнее' },
];

export default function ReportScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { api } = useSession();
  const action = useAction();
  const [reason, setReason] = useState(reasons[0].title);
  const [comment, setComment] = useState('');

  const submit = action(async () => {
    const hint = reasons.find((r) => r.title === reason)?.hint;
    const text = comment.trim() ? `${reason}: ${comment.trim()}` : `${reason}: ${hint}`;
    await api.report(id, text.slice(0, 500));
    router.replace({ pathname: '/report-sent', params: { id, name: name ?? '' } });
  });

  return (
    <Screen header={<TopBar back />} wave="right" footer={<Button title="Отправить жалобу" onPress={submit} />}>
      <Title size={32}>Что случилось?</Title>
      <Lead style={{ marginBottom: 16 }}>
        Расскажи, что не так {name ? `с профилем ${name}` : 'с этим профилем'}. Мы рассмотрим жалобу и примем меры.
      </Lead>
      {reasons.map((r) => (
        <ChoiceCard key={r.title} title={r.title} hint={r.hint} checked={reason === r.title} onPress={() => setReason(r.title)} compact />
      ))}
      <Card style={{ marginTop: 6 }}>
        <View style={styles.head}>
          <Pencil color={colors.red} size={18} />
          <Text style={styles.title}>Комментарий <Text style={styles.optional}>(необязательно)</Text></Text>
        </View>
        <Field value={comment} onChangeText={setComment} placeholder="Переходит на личные темы, несмотря на просьбу прекратить." multiline maxLength={300} counter={300} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  optional: { fontFamily: fonts.medium, color: colors.muted },
});
