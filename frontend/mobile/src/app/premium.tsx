import { router } from 'expo-router';
import { Check, Infinity as InfinityIcon } from 'lucide-react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Scribble } from '../components/decor';
import { Button, Card, ErrorView, Loading, Screen, StatusPill, TopBar } from '../components/ui';
import { dateShort, money } from '../lib/format';
import { useSession } from '../lib/session';
import { useResource } from '../lib/useResource';
import { colors, fonts, radius } from '../theme';

export default function Premium() {
  const { api } = useSession();
  const sub = useResource(() => api.subscription(), [api]);

  return (
    <Screen
      header={<TopBar back />}
      blobTop={60}
      wave="right"
      footer={sub.data && !sub.data.active ? (
        <>
          <Button title={`${money(sub.data.priceKopecks)} на 30 дней`} onPress={() => router.push({ pathname: '/checkout', params: { kind: 'PREMIUM' } })} />
          <Card style={styles.after}><Text style={styles.afterText}>После окончания — обычный лимит</Text></Card>
        </>
      ) : undefined}
    >
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.small}>CAMPUS</Text>
          <Text style={styles.title}>Premium</Text>
        </View>
        <Scribble size={44} style={{ marginTop: 8 }} />
      </View>
      <Text style={styles.subtitle}>Больше знакомств, событий и возможностей на кампусе</Text>
      <View style={styles.photoWrap}>
        <View style={styles.blob} />
        <Image source={require('../../assets/premium.jpg')} style={styles.photo} />
      </View>
      {sub.loading ? <Loading /> : sub.error ? <ErrorView message={sub.error} onRetry={sub.reload} /> : (
        <>
          <Card style={styles.feature}>
            <InfinityIcon color={colors.red} size={34} strokeWidth={2.6} />
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Лайки без лимита</Text>
              <Text style={styles.featureText}>Без Premium — 30 симпатий в день</Text>
            </View>
          </Card>
          {sub.data?.active && (
            <Card style={{ alignItems: 'center', gap: 8 }}>
              <StatusPill title="Premium активен" icon={Check} />
              <Text style={styles.featureText}>до {dateShort(sub.data.endsAt!)}</Text>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  small: { fontFamily: fonts.display, fontSize: 30, lineHeight: 30, color: colors.red },
  title: { fontFamily: fonts.display, fontSize: 52, lineHeight: 54, color: colors.red, letterSpacing: -1 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, marginTop: 4, marginBottom: 12, transform: [{ rotate: '-2deg' }] },
  photoWrap: { height: 230, marginBottom: -30, zIndex: -1 },
  blob: { position: 'absolute', right: -50, top: 10, width: 200, height: 180, borderRadius: 100, backgroundColor: colors.red },
  photo: { width: '100%', height: '100%', borderRadius: radius.xl },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 0 },
  featureTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  featureText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  after: { alignItems: 'center', paddingVertical: 12, marginBottom: 0 },
  afterText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
});
