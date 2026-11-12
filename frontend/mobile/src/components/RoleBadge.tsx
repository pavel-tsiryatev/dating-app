import { CalendarDays, Crown, Shield } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

const roles = {
  moderator: { label: 'Модератор', icon: Shield },
  organizer: { label: 'Организатор', icon: CalendarDays },
  admin: { label: 'Администратор', icon: Crown },
} as const;

export function RoleBadge({ role }: { role: keyof typeof roles }) {
  const { label, icon: Icon } = roles[role];
  return (
    <View style={styles.badge}>
      <Icon color={colors.red} size={18} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: colors.paper, borderWidth: 1,
    borderColor: colors.line, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 10,
  },
  text: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
});
