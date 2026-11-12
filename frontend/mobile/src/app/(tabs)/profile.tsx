import { router } from 'expo-router';
import { BadgeCheck, Crown, Eye, Pencil, Settings, Shield, Ticket } from 'lucide-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BrandBar } from '../../components/BrandBar';
import { Scribble } from '../../components/decor';
import { Button, Chip, ListRow, Loading, Screen } from '../../components/ui';
import { age, fallbackPhoto, mediaSource } from '../../lib/format';
import { capitalize } from '../../lib/icons';
import { useSession } from '../../lib/session';
import { colors, fonts, fill } from '../../theme';

export default function Profile() {
  const { me, apiUrl, rememberPeople } = useSession();
  const p = me?.profile;
  if (!me || !p) return <Screen header={<BrandBar />} tabs><Loading /></Screen>;
  const years = age(me.birthDate);
  const staff = me.role === 'ADMIN' || me.role === 'MODERATOR';

  const preview = () => {
    rememberPeople([{ ...p, userId: me.id, age: years, interests: p.interests }]);
    router.push({ pathname: '/person/[id]', params: { id: me.id, liked: '1' } });
  };

  return (
    <Screen header={<BrandBar />} tabs blobTop={false} contentStyle={{ paddingHorizontal: 0 }}>
      <View style={styles.cover}>
        <Image source={mediaSource(p.photos[0]?.storageKey, apiUrl) ?? fallbackPhoto} style={fill} />
        <Svg width="100%" height={60} viewBox="0 0 400 60" preserveAspectRatio="none" style={styles.wave}>
          <Path d="M0 30 C80 60 160 0 260 24 C320 38 360 40 400 20 L400 60 L0 60 Z" fill={colors.cream} />
          <Path d="M300 30 C340 40 370 34 400 14 L400 0 C380 18 350 26 300 30 Z" fill={colors.red} />
        </Svg>
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{p.name}, {years}</Text>
          <BadgeCheck color={colors.white} fill={colors.red} size={28} />
          <Scribble size={30} style={{ marginTop: -14 }} />
        </View>
        <View style={styles.subRow}>
          <Text style={styles.institute}>{p.institute}</Text>
          <Button title="Редактировать" icon={Pencil} variant="outline" small onPress={() => router.push({ pathname: '/onboarding/about', params: { edit: '1' } })} />
        </View>
        {!!p.about && (
          <View style={styles.about}>
            <Text style={styles.aboutText}>{p.about}</Text>
          </View>
        )}
        <View style={styles.chips}>
          {p.interests.map((i) => <Chip key={i} title={capitalize(i)} size="sm" />)}
        </View>
        {!p.photos.length && (
          <ListRow icon={Eye} title="Добавь фото" subtitle="Без фото анкета не показывается в ленте" onPress={() => router.push({ pathname: '/onboarding/photos', params: { edit: '1' } })} />
        )}
        <View style={styles.actions}>
          <Button title="Предпросмотр" icon={Eye} variant="outline" small style={{ flex: 1 }} onPress={preview} />
          <Button title="Настройки" icon={Settings} variant="outline" small style={{ flex: 1 }} onPress={() => router.push('/settings')} />
        </View>
        <ListRow icon={Ticket} title="Мои билеты" subtitle="Все события в одном месте" onPress={() => router.push('/tickets')} />
        <ListRow icon={Crown} title="CAMPUS Premium" subtitle="Лайки без лимита" onPress={() => router.push('/premium')} />
        {staff && (
          <ListRow icon={Shield} title="Команда CAMPUS" subtitle={me.role === 'ADMIN' ? 'Модерация, события, отчёты' : 'Модерация жалоб'} onPress={() => router.push('/staff')} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 250, backgroundColor: colors.line, overflow: 'hidden' },
  wave: { position: 'absolute', bottom: -1, left: 0, right: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  name: { fontFamily: fonts.display, fontSize: 30, color: colors.red, flexShrink: 1 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  institute: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, marginTop: 2 },
  about: { borderLeftWidth: 3, borderLeftColor: colors.red, paddingLeft: 12, marginVertical: 12 },
  aboutText: { fontFamily: fonts.medium, fontStyle: 'italic', fontSize: 15, lineHeight: 21, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
});
