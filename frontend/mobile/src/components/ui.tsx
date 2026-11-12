import { router } from 'expo-router';
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, type LucideIcon, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Pressable, RefreshControl, ScrollView, StyleSheet,
  Switch, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '../theme';
import { CornerWave, EdgeBlob, Scribble } from './decor';

// ── Каркас экрана ─────────────────────────────────────────────────────

interface ScreenProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  blobTop?: number | false;
  wave?: 'left' | 'right' | false;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  /** Нижний отступ под таб-бар не нужен — его добавляет сам таб-бар. */
  tabs?: boolean;
}

export function Screen({
  children, header, footer, scroll = true, blobTop = 118, wave = false, refreshing, onRefresh, contentStyle, tabs,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: footer ? 16 : tabs ? 24 : insets.bottom + 28 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.red} colors={[colors.red]} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
  );
  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      {blobTop !== false && <EdgeBlob top={insets.top + blobTop} />}
      {wave && <CornerWave side={wave} />}
      <View style={{ paddingTop: insets.top, zIndex: 1 }}>{header}</View>
      <View style={{ flex: 1, zIndex: 1 }}>{body}</View>
      {footer && <View style={[styles.footer, { zIndex: 1 }, { paddingBottom: tabs ? 12 : insets.bottom + 14 }]}>{footer}</View>}
    </KeyboardAvoidingView>
  );
}

// ── Шапка ─────────────────────────────────────────────────────────────

export function Wordmark({ size = 30, style }: { size?: number; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.wordmark, { fontSize: size }, style]} accessibilityRole="header">CAMPUS</Text>;
}

interface TopBarProps {
  back?: boolean | (() => void);
  close?: () => void;
  center?: boolean;
  right?: ReactNode;
  title?: ReactNode;
}

export function TopBar({ back, close, center, right, title }: TopBarProps) {
  const goBack = typeof back === 'function' ? back : () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={styles.topBar}>
      {back ? (
        <IconButton icon={ChevronLeft} onPress={goBack} label="Назад" />
      ) : close ? (
        <IconButton icon={X} onPress={close} label="Закрыть" />
      ) : null}
      <View style={[{ flex: 1 }, center && { alignItems: 'center', marginRight: right ? 0 : 44 }]}>
        {title ?? <Wordmark size={center ? 27 : 30} />}
      </View>
      {right}
    </View>
  );
}

export function IconButton({ icon: Icon, onPress, label, color = colors.ink, size = 26, style }: {
  icon: LucideIcon; onPress: () => void; label: string; color?: string; size?: number; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }, style]}>
      <Icon color={color} size={size} strokeWidth={2.2} />
    </Pressable>
  );
}

// ── Текст ─────────────────────────────────────────────────────────────

export function Title({ children, size = 36, scribble = true, style }: {
  children: ReactNode; size?: number; scribble?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.titleRow, style]}>
      <Text style={[styles.title, { fontSize: size, lineHeight: size * 1.08 }]}>{children}</Text>
      {scribble && <Scribble size={size * 0.85} style={{ marginLeft: 4, marginTop: -6 }} />}
    </View>
  );
}

export function Lead({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.lead, style]}>{children}</Text>;
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Small({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.small, style]}>{children}</Text>;
}

// ── Кнопки ────────────────────────────────────────────────────────────

interface ButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'outline' | 'soft' | 'ghost';
  icon?: LucideIcon;
  arrow?: boolean;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = 'primary', icon: Icon, arrow, disabled, loading, small, style }: ButtonProps) {
  const [busy, setBusy] = useState(false);
  const working = loading || busy;
  const fg = variant === 'primary' ? colors.white : colors.red;
  const press = async () => {
    if (working || disabled) return;
    const result = onPress();
    if (result instanceof Promise) {
      setBusy(true);
      try {
        await result;
      } finally {
        setBusy(false);
      }
    }
  };
  return (
    <Pressable
      onPress={press}
      disabled={disabled || working}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: working }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'outline' && styles.buttonOutline,
        variant === 'soft' && styles.buttonSoft,
        variant === 'ghost' && styles.buttonGhost,
        (disabled || working) && { opacity: 0.55 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        style,
      ]}
    >
      {working ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {Icon && <Icon color={fg} size={small ? 18 : 22} strokeWidth={2.2} />}
          <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: fg }]} numberOfLines={1}>{title}</Text>
          {arrow && <ArrowRight color={fg} size={small ? 18 : 22} strokeWidth={2.4} />}
        </>
      )}
    </Pressable>
  );
}

export function TextLink({ title, onPress, icon: Icon }: { title: string; onPress: () => void; icon?: LucideIcon }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.textLink} accessibilityRole="link">
      {Icon && <Icon color={colors.red} size={18} />}
      <Text style={styles.textLinkText}>{title}</Text>
    </Pressable>
  );
}

// ── Поля ввода ────────────────────────────────────────────────────────

interface FieldProps extends TextInputProps {
  label?: string;
  icon?: LucideIcon;
  counter?: number;
  error?: string | null;
}

export function Field({ label, icon: Icon, counter, error, style, multiline, value, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Label>{label}</Label>}
      <View style={[styles.field, multiline && { minHeight: 104, alignItems: 'flex-start' }, focused && { borderColor: colors.red }, !!error && { borderColor: colors.red }]}>
        {Icon && <Icon color={colors.red} size={22} style={{ marginRight: 10, marginTop: multiline ? 12 : 0 }} />}
        <TextInput
          {...rest}
          value={value}
          multiline={multiline}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          placeholderTextColor="#A58C78"
          style={[styles.input, multiline && { textAlignVertical: 'top', paddingTop: 12 }, style]}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {error ? <Text style={styles.error}>{error}</Text> : <View />}
        {counter !== undefined && <Text style={styles.counter}>{(value ?? '').length} / {counter}</Text>}
      </View>
    </View>
  );
}

/** Выпадающий список: модальное окно со списком вариантов. */
export function Select<T extends string>({ label, value, options, onChange, placeholder = 'Выбрать', icon: Icon }: {
  label?: string; value: T | undefined; options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void; placeholder?: string; icon?: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Label>{label}</Label>}
      <Pressable style={styles.field} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={label}>
        {Icon && <Icon color={colors.red} size={22} style={{ marginRight: 10 }} />}
        <Text style={[styles.input, { paddingVertical: 14 }, !current && { color: '#A58C78' }]} numberOfLines={2}>
          {current?.label ?? placeholder}
        </Text>
        <ChevronDown color={colors.ink} size={20} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          {label && <Text style={[styles.title, { fontSize: 26, marginBottom: 10 }]}>{label}</Text>}
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.option, item.value === value && styles.optionActive, pressed && { opacity: 0.7 }]}
                onPress={() => { onChange(item.value); setOpen(false); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.hint && <Small>{item.hint}</Small>}
                </View>
                {item.value === value && <Check color={colors.red} size={22} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

// ── Выбор ─────────────────────────────────────────────────────────────

export function Radio({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.radio, checked && { borderColor: colors.red }]}>
      {checked && <View style={styles.radioDot} />}
    </View>
  );
}

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkbox, checked && { backgroundColor: colors.red, borderColor: colors.red }]}>
      {checked && <Check color={colors.white} size={18} strokeWidth={3} />}
    </View>
  );
}

/** Карточка-вариант с радиокнопкой: цель знакомства, причина жалобы, решение модератора. */
export function ChoiceCard({ title, hint, checked, onPress, compact, danger }: {
  title: string; hint?: string; checked: boolean; onPress: () => void; compact?: boolean; danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      style={[styles.choice, compact && { paddingVertical: 10 }, checked && (danger ? styles.choiceDanger : styles.choiceActive)]}
    >
      <Radio checked={checked} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.choiceTitle, checked && danger && { color: colors.red }]}>{title}</Text>
        {hint && <Small>{hint}</Small>}
      </View>
    </Pressable>
  );
}

/** Сплошная красная «таблетка» для выбранной цели (как в макете анкеты). */
export function GoalPill({ title, checked, onPress }: { title: string; checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked }} style={[styles.goalPill, checked && styles.goalPillActive]}>
      {checked ? <Check color={colors.white} size={18} strokeWidth={3} /> : <Radio checked={false} />}
      <Text style={[styles.goalPillText, checked && { color: colors.white }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ title, icon: Icon, selected, onPress, size = 'md' }: {
  title: string; icon?: LucideIcon; selected?: boolean; onPress?: () => void; size?: 'sm' | 'md';
}) {
  const content = (
    <>
      {Icon && <Icon color={selected ? colors.white : colors.red} size={size === 'sm' ? 16 : 19} />}
      <Text style={[styles.chipText, size === 'sm' && { fontSize: 13 }, selected && { color: colors.white }]}>{title}</Text>
      {selected && onPress && <Check color={colors.white} size={16} strokeWidth={3} />}
    </>
  );
  const style = [styles.chip, size === 'sm' && styles.chipSmall, selected && styles.chipActive];
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: !!selected }} style={({ pressed }) => [...style, pressed && { opacity: 0.75 }]}>
      {content}
    </Pressable>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ false: colors.line, true: colors.red }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.line}
    />
  );
}

// ── Контейнеры ────────────────────────────────────────────────────────

export function Card({ children, style, onPress, tint }: {
  children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; tint?: 'blush' | 'red';
}) {
  const s = [styles.card, tint === 'blush' && { backgroundColor: colors.blush, borderColor: colors.blush }, tint === 'red' && { backgroundColor: colors.red, borderColor: colors.red }, style];
  if (!onPress) return <View style={s}>{children}</View>;
  return <Pressable onPress={onPress} style={({ pressed }) => [...s, pressed && { opacity: 0.85 }]}>{children}</Pressable>;
}

export function ListRow({ icon: Icon, title, subtitle, onPress, right, danger }: {
  icon?: LucideIcon; title: string; subtitle?: string; onPress?: () => void; right?: ReactNode; danger?: boolean;
}) {
  return (
    <Card onPress={onPress} style={styles.listRow}>
      {Icon && <Icon color={danger ? colors.red : colors.red} size={26} strokeWidth={2} style={{ marginRight: 14 }} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.listTitle, danger && { color: colors.red }]}>{title}</Text>
        {subtitle && <Small>{subtitle}</Small>}
      </View>
      {right ?? (onPress ? <ChevronRight color={colors.ink} size={22} /> : null)}
    </Card>
  );
}

export function Note({ icon: Icon, title, children, tint }: { icon?: LucideIcon; title?: string; children: ReactNode; tint?: 'blush' }) {
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }} tint={tint}>
      {Icon && <Icon color={colors.red} size={26} />}
      <View style={{ flex: 1 }}>
        {title && <Text style={[styles.listTitle, { marginBottom: 4 }]}>{title}</Text>}
        {typeof children === 'string' ? <Small style={{ color: colors.ink }}>{children}</Small> : children}
      </View>
    </Card>
  );
}

/** Строка «ключ — значение» в карточках заказа. */
export function KeyValue({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <View style={styles.kv}>
      <Text style={[styles.kvLabel, strong && { fontFamily: fonts.bold, color: colors.ink, fontSize: 17 }]}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={[styles.kvValue, strong && { color: colors.red, fontFamily: fonts.display, fontSize: 24 }]}>{value}</Text>
      ) : value}
    </View>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segment, active && styles.segmentActive]} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <Text style={[styles.segmentText, active && { color: colors.white }]} numberOfLines={1}>{o.label}</Text>
            {o.count !== undefined && (
              <View style={[styles.segmentCount, active && { backgroundColor: colors.white }]}>
                <Text style={[styles.segmentCountText, active && { color: colors.red }]}>{o.count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function StatusPill({ title, tone = 'green', icon: Icon }: { title: string; tone?: 'green' | 'red' | 'amber' | 'muted'; icon?: LucideIcon }) {
  const palette = {
    green: { bg: colors.greenSoft, fg: colors.green },
    red: { bg: colors.blush, fg: colors.red },
    amber: { bg: '#F8E2B8', fg: colors.amber },
    muted: { bg: colors.paper, fg: colors.muted },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      {Icon && <Icon color={palette.fg} size={14} strokeWidth={2.6} />}
      <Text style={[styles.pillText, { color: palette.fg }]}>{title}</Text>
    </View>
  );
}

/** Состояния «успех / ошибка / ожидание»: большая иконка в круге, заголовок, текст. */
export function Hero({ icon: Icon, title, children, tone = 'red' }: {
  icon: LucideIcon; title: string; children?: ReactNode; tone?: 'red' | 'soft';
}) {
  return (
    <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Scribble size={34} style={{ transform: [{ scaleX: -1 }], marginTop: 4 }} />
        <View style={[styles.heroCircle, tone === 'soft' && { backgroundColor: colors.blush }]}>
          <Icon color={tone === 'soft' ? colors.red : colors.white} size={58} strokeWidth={2.6} />
        </View>
        <Scribble size={34} style={{ marginTop: 4 }} />
      </View>
      <Text style={[styles.title, { textAlign: 'center', fontSize: 34, lineHeight: 37, marginTop: 14 }]}>{title}</Text>
      {children && <View style={{ marginTop: 10, alignItems: 'center' }}>{typeof children === 'string' ? <Lead style={{ textAlign: 'center' }}>{children}</Lead> : children}</View>}
    </View>
  );
}

export function Loading({ label = 'Собираем твоё пространство…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.red} size="large" />
      <Small style={{ marginTop: 12 }}>{label}</Small>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={[styles.center, { paddingHorizontal: 24 }]}>
      <Text style={[styles.title, { fontSize: 26, textAlign: 'center' }]}>Не получилось</Text>
      <Lead style={{ textAlign: 'center', marginVertical: 12 }}>{message}</Lead>
      {onRetry && <Button title="Попробовать ещё раз" onPress={onRetry} variant="outline" />}
    </View>
  );
}

export function Divider({ dashed }: { dashed?: boolean }) {
  return <View style={[styles.divider, dashed && { borderStyle: 'dashed', borderColor: colors.red, borderTopWidth: 1.5, height: 0, backgroundColor: 'transparent' }]} />;
}

export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  spacer: { height: 16 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  footer: { paddingHorizontal: 20, paddingTop: 10, gap: 10, backgroundColor: 'transparent' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8, minHeight: 56, gap: 6 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  wordmark: { fontFamily: fonts.display, color: colors.red, letterSpacing: -0.5, paddingLeft: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, paddingRight: 36 },
  title: { fontFamily: fonts.display, color: colors.red, letterSpacing: -0.6, flexShrink: 1 },
  lead: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 23, color: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginBottom: 7 },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink, marginTop: 18, marginBottom: 10 },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
  button: {
    minHeight: 56, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingHorizontal: 22,
  },
  buttonSmall: { minHeight: 44, paddingHorizontal: 12 },
  buttonPrimary: { backgroundColor: colors.red, ...shadow, shadowColor: colors.deepRed, shadowOpacity: 0.28 },
  buttonOutline: { backgroundColor: colors.paper, borderWidth: 1.5, borderColor: colors.red },
  buttonSoft: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonText: { fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.2 },
  textLink: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  textLinkText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.red, textDecorationLine: 'underline' },
  field: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: 14, minHeight: 54,
  },
  input: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, paddingVertical: 12 },
  counter: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, marginTop: 4 },
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.red, marginTop: 4, flex: 1 },
  sheetBackdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 14 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: radius.md, marginBottom: 4 },
  optionActive: { backgroundColor: colors.blush },
  optionText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.red },
  checkbox: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  choice: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.line,
    borderRadius: radius.md, padding: 14, marginBottom: 10,
  },
  choiceActive: { borderColor: colors.red, backgroundColor: colors.card },
  choiceDanger: { borderColor: colors.blush, backgroundColor: colors.blush },
  choiceTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  goalPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.pill, borderWidth: 1.2, borderColor: colors.line,
    backgroundColor: colors.paper, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8,
  },
  goalPillActive: { backgroundColor: colors.red, borderColor: colors.red },
  goalPillText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.pill, borderWidth: 1.2, borderColor: colors.line,
    backgroundColor: colors.paper, paddingHorizontal: 15, paddingVertical: 10,
  },
  chipSmall: { paddingHorizontal: 12, paddingVertical: 6, gap: 6, borderColor: colors.red },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  card: { backgroundColor: colors.paper, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 12 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginBottom: 10 },
  listTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  kvLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  kvValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  segmented: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  segment: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11,
    borderRadius: radius.pill, borderWidth: 1.2, borderColor: colors.line, backgroundColor: colors.paper,
  },
  segmentActive: { backgroundColor: colors.red, borderColor: colors.red },
  segmentText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, flexShrink: 1 },
  segmentCount: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  segmentCountText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: fonts.bold, fontSize: 12 },
  heroCircle: { width: 128, height: 128, borderRadius: 64, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6, ...shadow },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
});
