import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Crown, ExternalLink, Info } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { EventRow } from '../components/EventCard';
import { useAction } from '../components/toast';
import { Button, Card, Divider, ErrorView, KeyValue, Loading, Note, Screen, Title, TopBar } from '../components/ui';
import { dateShort, money, time } from '../lib/format';
import { isSandboxUrl, paymentKey } from '../lib/payments';
import { useSession } from '../lib/session';
import { useResource } from '../lib/useResource';
import { colors, fonts, radius } from '../theme';

/** Сводка заказа перед оплатой у внешнего провайдера. */
export default function Checkout() {
  const { kind = 'TICKET', eventId } = useLocalSearchParams<{ kind?: 'TICKET' | 'PREMIUM'; eventId?: string }>();
  const { api, apiUrl } = useSession();
  const action = useAction();
  const data = useResource(async () => {
    if (kind === 'PREMIUM') return { amount: (await api.subscription()).priceKopecks, event: null };
    const event = await api.event(eventId!);
    return { amount: event.price, event };
  }, [api, kind, eventId]);

  const pay = action(async () => {
    const payment = await api.createPayment(kind, eventId, paymentKey(kind, eventId));
    if (!isSandboxUrl(payment.confirmationUrl) && payment.confirmationUrl) {
      await WebBrowser.openBrowserAsync(payment.confirmationUrl);
    }
    router.replace({ pathname: '/payment/[id]', params: { id: payment.id, eventId: eventId ?? '' } });
  });

  if (data.loading) return <Screen header={<TopBar back />}><Loading /></Screen>;
  if (!data.data) return <Screen header={<TopBar back />}><ErrorView message={data.error ?? 'Заказ не найден'} onRetry={data.reload} /></Screen>;
  const { amount, event } = data.data;
  const now = new Date().toISOString();

  return (
    <Screen header={<TopBar back />} wave="right" footer={<Button title={`Оплатить ${money(amount)}`} icon={ExternalLink} onPress={pay} />}>
      <Title size={32}>Оплата заказа</Title>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ padding: 14 }}>
          {event ? <EventRow event={event} apiUrl={apiUrl} /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Crown color={colors.red} size={40} />
              <View>
                <Text style={styles.premium}>CAMPUS Premium</Text>
                <Text style={styles.premiumSub}>30 дней · лайки без лимита</Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.band}><Text style={styles.bandText}>{money(amount)}</Text></View>
        <View style={{ paddingHorizontal: 14, paddingVertical: 6 }}>
          <KeyValue label="Состав заказа" value={event ? 'Билет на событие' : 'Подписка Premium'} />
          <Divider />
          <KeyValue label="Дата покупки" value={`${dateShort(now)}, ${time(now)}`} />
          <Divider />
          <KeyValue label="Способ оплаты" value="Платёжный сервис" />
        </View>
      </Card>
      <Note icon={Info}>
        {event
          ? 'Если планы изменятся, неоплаченную бронь можно отменить. Возврат оплаченного билета — через организатора до начала события.'
          : 'Подписка не продлевается автоматически. После окончания — обычный лимит лайков.'}
      </Note>
    </Screen>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.red, paddingVertical: 12, alignItems: 'center', borderTopWidth: 0, marginHorizontal: -1,
    borderRadius: radius.sm,
  },
  bandText: { fontFamily: fonts.display, fontSize: 34, color: colors.white },
  premium: { fontFamily: fonts.display, fontSize: 22, color: colors.red },
  premiumSub: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
});
