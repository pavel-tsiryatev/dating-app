import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '../theme';

type Toast = (message: string, tone?: 'info' | 'error') => void;
const ToastContext = createContext<Toast>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<{ message: string; tone: 'info' | 'error' } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<Toast>((message, tone = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setState({ message, tone });
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setState(null));
    }, tone === 'error' ? 4200 : 2600);
  }, [opacity]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {state && (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { top: insets.top + 10, opacity }, state.tone === 'error' && { backgroundColor: colors.deepRed }]}
        >
          <Text style={styles.text}>{state.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** Обёртка действия: ошибка API показывается всплывающим сообщением, а не роняет экран. */
export function useAction() {
  const toast = useToast();
  return useCallback(
    <A extends unknown[]>(fn: (...args: A) => Promise<unknown> | unknown) => async (...args: A) => {
      try {
        await fn(...args);
      } catch (e) {
        toast((e as Error).message || 'Что-то пошло не так', 'error');
      }
    },
    [toast],
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', left: 16, right: 16, backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: 14,
    paddingHorizontal: 18, ...shadow, zIndex: 100,
  },
  text: { color: colors.white, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
});
