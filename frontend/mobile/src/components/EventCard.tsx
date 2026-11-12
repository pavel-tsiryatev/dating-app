import { LinearGradient } from 'expo-linear-gradient';
import { CalendarDays, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { dateShort, dateTime, fallbackPoster, mediaSource, money } from '../lib/format';
import type { CampusEvent } from '../lib/types';
import { colors, fonts, radius, shadow, fill } from '../theme';

/** Большая карточка события в ленте: постер, дата, название, цена. */
export function EventCard({ event, apiUrl, onPress }: { event: CampusEvent; apiUrl: string | null; onPress: () => void }) {
  const soldOut = event.freeSeats <= 0;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]} accessibilityLabel={event.title}>
      <Image source={mediaSource(event.posterUrl, apiUrl) ?? fallbackPoster} style={fill} />
      <LinearGradient colors={['rgba(20,10,6,0)', 'rgba(20,10,6,0.72)']} style={styles.shade} />
      <View style={styles.date}>
        <CalendarDays color={colors.red} size={15} />
        <Text style={styles.dateText}>{dateShort(event.startsAt)}</Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <View style={[styles.price, soldOut && { backgroundColor: colors.ink }]}>
          <Text style={styles.priceText}>{soldOut ? 'Мест нет' : money(event.price)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Компактная строка события: билеты, бронь, оплата. */
export function EventRow({ event, apiUrl, children }: { event: CampusEvent; apiUrl: string | null; children?: ReactNode }) {
  return (
    <View style={styles.row}>
      <Image source={mediaSource(event.posterUrl, apiUrl) ?? fallbackPoster} style={styles.thumb} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>{event.title}</Text>
        <View style={styles.meta}><CalendarDays color={colors.red} size={15} /><Text style={styles.metaText}>{dateTime(event.startsAt)}</Text></View>
        {event.partner && (
          <View style={styles.meta}><MapPin color={colors.red} size={15} /><Text style={styles.metaText} numberOfLines={1}>{event.partner.name}</Text></View>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { height: 200, borderRadius: radius.xl, overflow: 'hidden', marginBottom: 14, backgroundColor: colors.line, ...shadow },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  date: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.paper,
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5,
  },
  dateText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  bottom: { position: 'absolute', left: 14, right: 12, bottom: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  title: { flex: 1, fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 24, color: colors.white },
  price: { backgroundColor: colors.red, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  priceText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.white },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  thumb: { width: 86, height: 86, borderRadius: radius.md, backgroundColor: colors.line },
  rowTitle: { fontFamily: fonts.displaySoft, fontSize: 17, lineHeight: 20, color: colors.ink, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  metaText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, flexShrink: 1 },
});
