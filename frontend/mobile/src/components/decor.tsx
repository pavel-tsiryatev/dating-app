import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

/** Красная «клякса», заходящая с правого края экрана (у заголовков в макетах). */
export function EdgeBlob({ top = 0, size = 120, style }: { top?: number; size?: number; style?: ViewStyle }) {
  return (
    <View pointerEvents="none" style={[styles.edge, { top, width: size * 0.62, height: size }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 62 100" preserveAspectRatio="none">
        <Path
          d="M62 0 C48 6 40 14 36 24 C31 36 18 40 8 46 C-2 52 0 64 12 68 C24 72 30 80 38 90 C44 97 54 100 62 100 Z"
          fill={colors.red}
        />
      </Svg>
    </View>
  );
}

/** Волна в нижнем углу экрана. */
export function CornerWave({ side = 'right', height = 70 }: { side?: 'left' | 'right'; height?: number }) {
  const flip = side === 'left' ? [{ scaleX: -1 }] : [];
  return (
    <View pointerEvents="none" style={[styles.corner, { height, transform: flip }, side === 'left' ? { left: 0 } : { right: 0 }]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 70" preserveAspectRatio="none">
        <Path d="M200 0 C170 10 160 34 128 40 C96 46 70 50 52 70 L200 70 Z" fill={colors.red} />
      </Svg>
    </View>
  );
}

/** Три коротких штриха «ударения» у заголовка. */
export function Scribble({ size = 34, color = colors.red, style }: { size?: number; color?: string; style?: ViewStyle }) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 34 34">
        <Path d="M6 16 L10 4" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
        <Path d="M14 20 L26 9" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
        <Path d="M17 29 L31 25" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/** Сердечко, нарисованное от руки. */
export function HandHeart({ size = 56, color = colors.red, style }: { size?: number; color?: string; style?: ViewStyle }) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <Path
          d="M30 52 C22 44 8 34 7 22 C6 13 13 7 20 8 C25 9 28 13 30 18 C32 12 36 7 43 7 C51 8 55 15 53 24 C50 36 38 44 31 53 C29 56 26 55 25 51"
          stroke={color}
          strokeWidth={3.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  edge: { position: 'absolute', right: 0 },
  corner: { position: 'absolute', bottom: 0, width: '62%' },
});
