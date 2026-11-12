import { CalendarDays, Check, CircleCheck, Clock, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dateShort, time } from '../lib/format';
import type { Meeting } from '../lib/types';
import { colors, fonts, radius } from '../theme';
import { Button } from './ui';

/** Предложение о встрече внутри переписки. */
export function MeetingCard({ meeting, mine, onAccept, onDecline }: {
  meeting: Meeting; mine: boolean; onAccept: () => Promise<void>; onDecline: () => Promise<void>;
}) {
  if (meeting.status === 'ACCEPTED') {
    return (
      <View style={[styles.card, styles.accepted]}>
        <View style={styles.head}>
          <CircleCheck color={colors.red} size={22} />
          <Text style={[styles.title, { color: colors.red }]}>Встреча подтверждена!</Text>
        </View>
        <Text style={styles.line}>{dateShort(meeting.meetAt)} в {time(meeting.meetAt)}</Text>
        <Text style={styles.line}>{meeting.place}</Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <CalendarDays color={colors.red} size={22} />
        <Text style={styles.title}>Предложение о встрече</Text>
      </View>
      <View style={styles.inner}>
        <Row icon={<MapPin color={colors.red} size={18} />} text={meeting.place} />
        <Row icon={<CalendarDays color={colors.red} size={18} />} text={dateShort(meeting.meetAt)} />
        <Row icon={<Clock color={colors.red} size={18} />} text={time(meeting.meetAt)} />
      </View>
      {meeting.status === 'DECLINED' ? (
        <Text style={styles.status}>Встреча отклонена</Text>
      ) : mine ? (
        <Text style={styles.status}>Ждём ответа собеседника</Text>
      ) : (
        <View style={{ gap: 8, marginTop: 10 }}>
          <Button title="Согласиться" icon={Check} small onPress={onAccept} />
          <Button title="Другой вариант" variant="outline" small onPress={onDecline} />
        </View>
      )}
    </View>
  );
}

function Row({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <View style={styles.row}>
      {icon}
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14,
    marginVertical: 6, maxWidth: '90%', alignSelf: 'center', width: '90%',
  },
  accepted: { backgroundColor: colors.blush, borderColor: colors.blush },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  inner: { backgroundColor: colors.card, borderRadius: radius.md, padding: 10, gap: 6, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, flex: 1 },
  line: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginTop: 2 },
  status: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted, marginTop: 10, textAlign: 'center' },
});
