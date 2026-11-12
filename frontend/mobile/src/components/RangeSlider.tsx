import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

const THUMB = 28;

/** Ползунок диапазона с двумя бегунками (возраст в фильтрах). */
export function RangeSlider({ min, max, low, high, onChange }: {
  min: number; max: number; low: number; high: number; onChange: (low: number, high: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const state = useRef({ low, high, width, startX: 0, onChange });
  state.current.low = low;
  state.current.high = high;
  state.current.width = width;
  state.current.onChange = onChange;

  const toX = (v: number) => ((v - min) / (max - min)) * Math.max(1, width - THUMB);
  const toValue = (x: number) => {
    const w = Math.max(1, state.current.width - THUMB);
    return Math.round(min + (Math.min(Math.max(x, 0), w) / w) * (max - min));
  };

  const responder = (which: 'low' | 'high') => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      const s = state.current;
      const w = Math.max(1, s.width - THUMB);
      s.startX = (((which === 'low' ? s.low : s.high) - min) / (max - min)) * w;
    },
    onPanResponderMove: (_, g) => {
      const s = state.current;
      const v = toValue(s.startX + g.dx);
      if (which === 'low') s.onChange(Math.min(v, s.high), s.high);
      else s.onChange(s.low, Math.max(v, s.low));
    },
  });
  // Обработчики создаются один раз и читают актуальные значения через ref
  const lowResponder = useRef(responder('low')).current;
  const highResponder = useRef(responder('high')).current;

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.track} />
      <View style={[styles.active, { left: toX(low) + THUMB / 2, width: Math.max(0, toX(high) - toX(low)) }]} />
      <View {...lowResponder.panHandlers} style={[styles.thumb, { left: toX(low) }]} accessibilityRole="adjustable" accessibilityLabel={`От ${low}`} />
      <View {...highResponder.panHandlers} style={[styles.thumb, { left: toX(high) }]} accessibilityRole="adjustable" accessibilityLabel={`До ${high}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 40, justifyContent: 'center', marginBottom: 8 },
  track: { position: 'absolute', left: THUMB / 2, right: THUMB / 2, height: 6, borderRadius: 3, backgroundColor: colors.line },
  active: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: colors.red },
  thumb: {
    position: 'absolute', width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: colors.paper,
    borderWidth: 3, borderColor: colors.red,
  },
});
