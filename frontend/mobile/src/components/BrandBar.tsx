import { router } from 'expo-router';
import { ChevronDown, MapPin, SlidersHorizontal } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../lib/session';
import { colors, fonts } from '../theme';
import { IconButton, Wordmark } from './ui';

/** Шапка вкладок: логотип, вуз и фильтры. */
export function BrandBar({ filters = true }: { filters?: boolean }) {
  const { me, demo } = useSession();
  return (
    <View style={styles.bar}>
      <Wordmark />
      <View style={{ flex: 1 }} />
      {demo && <Text style={styles.demo}>ДЕМО</Text>}
      <Pressable style={styles.place} onPress={() => router.push('/filters')} accessibilityRole="button" accessibilityLabel="Вуз и фильтры">
        <MapPin color={colors.red} size={15} fill={colors.red} />
        <Text style={styles.placeText}>{me?.profile?.university ?? 'УрФУ'}</Text>
        <ChevronDown color={colors.red} size={15} />
      </Pressable>
      {filters && <IconButton icon={SlidersHorizontal} onPress={() => router.push('/filters')} label="Фильтры" color={colors.red} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, gap: 6 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 6 },
  placeText: { fontFamily: fonts.bold, fontSize: 14, color: colors.red },
  demo: {
    fontFamily: fonts.bold, fontSize: 10, color: colors.white, backgroundColor: colors.ink, borderRadius: 8, overflow: 'hidden',
    paddingHorizontal: 6, paddingVertical: 2, letterSpacing: 0.6,
  },
});
