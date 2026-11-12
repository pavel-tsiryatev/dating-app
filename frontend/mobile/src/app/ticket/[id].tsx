import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { Check, Copy, Info } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Scribble } from '../../components/decor';
import { EventRow } from '../../components/EventCard';
import { useToast } from '../../components/toast';
import { Card, ErrorView, Lead, Loading, Note, Screen, StatusPill, TopBar } from '../../components/ui';
import { dateTime } from '../../lib/format';
import { useSession } from '../../lib/session';
import { useResource } from '../../lib/useResource';
import { colors, fonts, radius } from '../../theme';

/** Оплаченный билет: QR-код с одноразовым кодом входа. */
export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, apiUrl } = useSession();
  const toast = useToast();
  const data = useResource(async () => {
    const [event, pass] = await Promise.all([api.event(id), api.pass(id)]);
    return { event, pass };
  }, [api, id]);

  if (data.loading) return <Screen header={<TopBar back center />}><Loading /></Screen>;
  if (!data.data) return <Screen header={<TopBar back center />}><ErrorView message={data.error ?? 'Билет не найден'} onRetry={data.reload} /></Screen>;
  const { event, pass } = data.data;
  const number = `CP-${pass.token.replace(/[^0-9a-z]/gi, '').slice(-4).toUpperCase()}`;

  return (
    <Screen header={<TopBar back center />} blobTop={70} refreshing={data.refreshing} onRefresh={data.reload}>
      <View style={styles.heroRow}>
        <View style={styles.check}><Check color={colors.white} size={30} strokeWidth={3.2} /></View>
        <Scribble size={34} />
      </View>
      <Text style={styles.title}>Билет подтверждён</Text>
      <Lead style={{ marginBottom: 14 }}>Спасибо! Оплата прошла успешно. Покажи этот QR-код при входе.</Lead>
      <Card style={{ padding: 0 }}>
        <View style={{ padding: 14 }}><EventRow event={event} apiUrl={apiUrl} /></View>
        <View style={styles.cut}>
          <View style={[styles.notch, { left: -12 }]} />
          <View style={styles.dash} />
          <View style={[styles.notch, { right: -12 }]} />
        </View>
        <View style={styles.qrWrap}>
          {pass.checkedInAt ? (
            <StatusPill title={`Вход отмечен ${dateTime(pass.checkedInAt)}`} tone="muted" icon={Check} />
          ) : (
            <View style={styles.qr}><QRCode value={pass.token} size={190} color={colors.ink} backgroundColor={colors.white} /></View>
          )}
          <Pressable
            style={styles.number}
            onPress={async () => { await Clipboard.setStringAsync(pass.token); toast('Код билета скопирован'); }}
            accessibilityLabel="Скопировать код билета"
          >
            <Text style={styles.numberText}>Номер билета: <Text style={{ fontFamily: fonts.extrabold }}>{number}</Text></Text>
            <Copy color={colors.red} size={18} />
          </Pressable>
          <Text style={styles.token} selectable>{pass.token}</Text>
        </View>
      </Card>
      <Note icon={Info}>Вход по QR-коду. Можно показать с экрана телефона. Билет действует на одного человека.</Note>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  check: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2FA84F', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 36, lineHeight: 39, color: colors.red, marginTop: 8, marginBottom: 6 },
  cut: { height: 24, justifyContent: 'center' },
  notch: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.cream },
  dash: { marginHorizontal: 18, borderTopWidth: 1.5, borderColor: colors.red, borderStyle: 'dashed' },
  qrWrap: { alignItems: 'center', padding: 16, gap: 14 },
  qr: { padding: 12, backgroundColor: colors.white, borderRadius: radius.md },
  number: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  token: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted, marginTop: -8 },
  numberText: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
});
