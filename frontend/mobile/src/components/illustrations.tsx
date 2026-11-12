import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';
import { Scribble } from './decor';

/** Улыбающийся календарь с сердцем — пустая лента. */
export function EmptyCalendar() {
  return (
    <View style={styles.wrap}>
      <View style={{ width: 220, height: 176 }}>
        <Svg width={220} height={176} viewBox="0 0 220 176">
          <Path d="M26 88 C13 48 48 13 92 18 C132 22 154 4 185 26 C216 48 211 97 194 123 C172 158 123 172 79 163 C40 154 35 123 26 88 Z" fill={colors.blush} />
          <Rect x="58" y="34" width="112" height="104" rx="16" fill={colors.paper} stroke={colors.red} strokeWidth="4" transform="rotate(-8 114 86)" />
          <Path d="M66 62 L166 48" stroke={colors.red} strokeWidth="4" strokeLinecap="round" />
          {[78, 102, 126, 150].map((x, i) => (
            <Path key={x} d={`M${x} ${30 - i * 3} q 8 -10 14 0`} stroke={colors.red} strokeWidth="4" fill="none" strokeLinecap="round" />
          ))}
          <Circle cx="98" cy="88" r="4.5" fill={colors.red} />
          <Circle cx="128" cy="84" r="4.5" fill={colors.red} />
          <Path d="M100 104 q 14 12 28 -4" stroke={colors.red} strokeWidth="4" fill="none" strokeLinecap="round" />
          <Path d="M146 112 c 0 -8 12 -10 13 -2 c 1 -8 13 -6 12 2 c -1 8 -12 14 -12 18 c 0 -4 -13 -10 -13 -18 z" fill={colors.red} />
        </Svg>
      </View>
      <Scribble size={40} style={{ position: 'absolute', left: 40, top: 20, transform: [{ scaleX: -1 }] }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: 18 },
});
