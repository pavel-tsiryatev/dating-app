import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, Quote } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { fallbackPhoto, mediaSource } from '../lib/format';
import type { Person } from '../lib/types';
import { colors, fonts, radius, shadow, fill } from '../theme';

/** Большая карточка анкеты в ленте: фото, точки-индикатор, имя, возраст, институт, цитата. */
export function PersonCard({ person, apiUrl, onOpen }: { person: Person; apiUrl: string | null; onOpen: () => void }) {
  const [index, setIndex] = useState(0);
  const photos = person.photos.length ? person.photos : [{ id: 'none', storageKey: '' }];
  const source = mediaSource(photos[index % photos.length].storageKey, apiUrl) ?? fallbackPhoto;
  const quote = person.quote ?? person.about;

  return (
    <View style={styles.card}>
      <Image source={source} style={fill} resizeMode="cover" />
      {/* Левая и правая половины переключают фото, центр открывает анкету */}
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
        <Pressable style={{ flex: 1 }} onPress={() => setIndex((i) => (i - 1 + photos.length) % photos.length)} accessibilityLabel="Предыдущее фото" />
        <Pressable style={{ flex: 2 }} onPress={onOpen} accessibilityLabel={`Открыть анкету: ${person.name}`} />
        <Pressable style={{ flex: 1 }} onPress={() => setIndex((i) => (i + 1) % photos.length)} accessibilityLabel="Следующее фото" />
      </View>
      {photos.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {photos.map((p, i) => <View key={p.id} style={[styles.dot, i === index % photos.length && styles.dotActive]} />)}
        </View>
      )}
      <LinearGradient colors={['rgba(20,10,6,0)', 'rgba(20,10,6,0.62)']} style={styles.shade} pointerEvents="none" />
      <View style={styles.info} pointerEvents="box-none">
        <View style={styles.nameRow} pointerEvents="none">
          <Text style={styles.name}>{person.name}{person.age ? `, ${person.age}` : ''}</Text>
          <BadgeCheck color={colors.white} fill="#2F80ED" size={26} />
        </View>
        <Text style={styles.institute} pointerEvents="none">{person.institute}</Text>
        {!!quote && (
          <Pressable style={styles.quote} onPress={onOpen}>
            <Quote color={colors.red} fill={colors.red} size={18} />
            <Text style={styles.quoteText} numberOfLines={2}>{quote}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.line, ...shadow, minHeight: 360 },
  dots: { position: 'absolute', top: 14, right: 16, flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { backgroundColor: colors.white, width: 9, height: 9, borderRadius: 5, marginTop: -1 },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  info: { position: 'absolute', left: 16, right: 16, bottom: 46 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.white },
  institute: { fontFamily: fonts.medium, fontSize: 17, color: colors.white, marginTop: 2, marginBottom: 10 },
  quote: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.paper, borderRadius: radius.lg,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  quoteText: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
});
