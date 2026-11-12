import RNDateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { ChevronDown, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { Button } from './ui';

/** Поле даты или времени: системный диалог на Android, нижняя шторка на iOS. */
export function DateTimeField({ label, icon: Icon, value, mode, onChange, text, minimumDate }: {
  label: string; icon: LucideIcon; value: Date; mode: 'date' | 'time'; onChange: (d: Date) => void; text: string; minimumDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState(value);

  const show = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        is24Hour: true,
        minimumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(date);
        },
      });
    } else {
      setTemp(value);
      setOpen(true);
    }
  };

  return (
    <>
      <Pressable style={styles.field} onPress={show} accessibilityRole="button" accessibilityLabel={`${label}: ${text}`}>
        <Icon color={colors.red} size={22} />
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{text}</Text>
        <ChevronDown color={colors.ink} size={20} />
      </Pressable>
      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <RNDateTimePicker
              value={temp}
              mode={mode}
              display="spinner"
              locale="ru-RU"
              minimumDate={minimumDate}
              onChange={(_, d) => d && setTemp(d)}
            />
            <Button title="Готово" onPress={() => { onChange(temp); setOpen(false); }} />
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.paper, borderWidth: 1.2, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: 14, minHeight: 58, marginBottom: 12,
  },
  label: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, flex: 1 },
  value: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  sheet: { backgroundColor: colors.cream, padding: 20, paddingBottom: 36, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
});
