import { Calendar, Heart, House, type LucideIcon, MessageCircle, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

const items: Record<string, { label: string; icon: LucideIcon }> = {
  feed: { label: 'Лента', icon: House },
  likes: { label: 'Симпатии', icon: Heart },
  events: { label: 'События', icon: Calendar },
  chats: { label: 'Чаты', icon: MessageCircle },
  profile: { label: 'Профиль', icon: User },
};

interface Props {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate(name: string): void; emit(e: { type: 'tabPress'; target: string; canPreventDefault: true }): { defaultPrevented: boolean } };
}

/** Нижняя навигация из макетов: пять вкладок, активная — красная, у «Симпатий» иконка заливается. */
export function TabBar({ state, navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const item = items[route.name];
        if (!item) return null;
        const active = state.index === index;
        const Icon = item.icon;
        const color = active ? colors.red : colors.ink;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            style={styles.item}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!active && !event.defaultPrevented) navigation.navigate(route.name);
            }}
          >
            <Icon color={color} size={25} strokeWidth={2} fill={active && route.name !== 'chats' ? color : 'transparent'} />
            <Text style={[styles.label, { color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontFamily: fonts.semibold, fontSize: 11 },
});
