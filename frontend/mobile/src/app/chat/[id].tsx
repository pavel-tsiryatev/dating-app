import { router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, CalendarDays, CheckCheck, ChevronLeft, Ellipsis, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { MeetingCard } from '../../components/MeetingCard';
import { useAction, useToast } from '../../components/toast';
import { Button, ErrorView, IconButton, Loading } from '../../components/ui';
import { dateShort, makeId, time } from '../../lib/format';
import { markRead } from '../../lib/readState';
import { useSession } from '../../lib/session';
import type { Message } from '../../lib/types';
import { useResource } from '../../lib/useResource';
import { colors, fonts, radius } from '../../theme';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api, apiUrl, me } = useSession();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const action = useAction();
  const scroll = useRef<ScrollView>(null);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<Message[]>([]);

  const match = useResource(async () => (await api.matches()).find((m) => m.id === id) ?? null, [api, id]);
  const thread = useResource(async () => {
    const [messages, meetings] = await Promise.all([api.messages(id), api.meetings(id)]);
    return { messages, meetings };
  }, [api, id], 5000);

  const messages = [...(thread.data?.messages ?? []), ...pending.filter((p) => !thread.data?.messages.some((m) => m.clientId === p.clientId))];
  const other = match.data?.user;

  useEffect(() => {
    markRead(id, thread.data?.messages.at(-1)?.sentAt);
  }, [id, thread.data]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    // clientId делает повторную отправку безопасной: сервер не создаст дубль
    const draft: Message = { id: makeId(), matchId: id, senderId: me?.id ?? '', clientId: makeId(), text: body, sentAt: new Date().toISOString() };
    setText('');
    setPending((p) => [...p, draft]);
    try {
      const saved = await api.sendMessage(id, draft.clientId, body);
      thread.setData((d) => ({ meetings: d?.meetings ?? [], messages: [...(d?.messages ?? []), saved] }));
    } catch (e) {
      setText(body);
      toast((e as Error).message, 'error');
    } finally {
      setPending((p) => p.filter((m) => m.clientId !== draft.clientId));
    }
  };

  const answer = (meetingId: string, status: 'ACCEPTED' | 'DECLINED') => action(async () => {
    await api.answerMeeting(meetingId, status);
    await thread.reload();
    if (status === 'DECLINED') router.push({ pathname: '/meeting/[id]', params: { id } });
  });

  const menu = () => other && Alert.alert(other.name ?? 'Собеседник', undefined, [
    { text: 'Пожаловаться', onPress: () => router.push({ pathname: '/report/[id]', params: { id: other.id, name: other.name ?? '' } }) },
    {
      text: 'Заблокировать',
      style: 'destructive',
      onPress: () => Alert.alert('Заблокировать?', 'Чат исчезнет у вас обоих, анкеты пропадут из ленты.', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Заблокировать', style: 'destructive', onPress: action(async () => { await api.block(other.id); router.back(); }) },
      ]),
    },
    { text: 'Отмена', style: 'cancel' },
  ]);

  let lastDay = '';
  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <IconButton icon={ChevronLeft} onPress={() => router.back()} label="Назад" color={colors.red} />
        <Avatar photo={other?.photo} name={other?.name} size={44} apiUrl={apiUrl} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={styles.name} numberOfLines={1}>{other?.name ?? '…'}</Text>
            <BadgeCheck color={colors.white} fill={colors.red} size={17} />
          </View>
          <Text style={styles.status}>{other?.status === 'ACTIVE' ? 'взаимная симпатия' : 'аккаунт недоступен'}</Text>
        </View>
        <IconButton icon={Ellipsis} onPress={menu} label="Ещё" />
      </View>
      {thread.loading ? <Loading label="Загружаем переписку…" /> : thread.error && !thread.data ? (
        <ErrorView message={thread.error} onRetry={thread.reload} />
      ) : (
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 14, paddingBottom: 8 }}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <Text style={styles.empty}>Это взаимно! Напиши первым — например, про общие интересы.</Text>
          )}
          {messages.map((m) => {
            const mine = m.senderId === me?.id;
            const day = dateShort(m.sentAt);
            const showDay = day !== lastDay;
            lastDay = day;
            const sending = pending.some((p) => p.clientId === m.clientId);
            return (
              <View key={m.clientId}>
                {showDay && <Text style={styles.day}>{day}</Text>}
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs, sending && { opacity: 0.6 }]}>
                  <Text style={[styles.text, mine && { color: colors.white }]}>{m.text}</Text>
                  <View style={styles.meta}>
                    <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.85)' }]}>{time(m.sentAt)}</Text>
                    {mine && <CheckCheck color="rgba(255,255,255,0.9)" size={14} />}
                  </View>
                </View>
              </View>
            );
          })}
          {(thread.data?.meetings ?? []).map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              mine={meeting.proposerId === me?.id}
              onAccept={answer(meeting.id, 'ACCEPTED')}
              onDecline={answer(meeting.id, 'DECLINED')}
            />
          ))}
          <Button
            title="Предложить встречу"
            icon={CalendarDays}
            variant="outline"
            small
            style={{ marginTop: 10 }}
            onPress={() => router.push({ pathname: '/meeting/[id]', params: { id } })}
          />
        </ScrollView>
      )}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Сообщение…"
          placeholderTextColor="#A58C78"
          style={styles.input}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.send, !text.trim() && { opacity: 0.4 }]}
          onPress={send}
          disabled={!text.trim()}
          accessibilityLabel="Отправить"
        >
          <Send color={colors.white} size={20} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 10, borderBottomWidth: 1,
    borderBottomColor: colors.line, backgroundColor: colors.cream,
  },
  name: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink, flexShrink: 1 },
  status: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  empty: { fontFamily: fonts.medium, fontSize: 15, color: colors.muted, textAlign: 'center', marginVertical: 30, paddingHorizontal: 20 },
  day: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted, textAlign: 'center', marginVertical: 10 },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: 14, paddingTop: 9, paddingBottom: 6, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.red, borderBottomRightRadius: 6 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 6 },
  text: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.ink },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  time: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1,
    borderTopColor: colors.line, backgroundColor: colors.cream,
  },
  input: {
    flex: 1, minHeight: 46, maxHeight: 120, backgroundColor: colors.paper, borderRadius: 23, borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontFamily: fonts.medium, fontSize: 15, color: colors.ink,
  },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
});

