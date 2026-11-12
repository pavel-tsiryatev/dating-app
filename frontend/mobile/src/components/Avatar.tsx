import { Image, StyleSheet, Text, View } from 'react-native';
import { mediaSource } from '../lib/format';
import { colors, fonts } from '../theme';

export function Avatar({ photo, name, size = 56, apiUrl }: { photo?: string | null; name?: string | null; size?: number; apiUrl: string | null }) {
  const source = mediaSource(photo, apiUrl);
  if (source) return <Image source={source} style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]} />;
  return (
    <View style={[styles.base, styles.empty, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{(name ?? '?').charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.line },
  empty: { backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: fonts.extrabold, color: colors.red },
});
