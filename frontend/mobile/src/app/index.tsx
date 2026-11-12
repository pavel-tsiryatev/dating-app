import { Redirect } from 'expo-router';
import { useSession } from '../lib/session';

/** Точка входа: куда отправить человека в зависимости от состояния сессии. */
export default function Index() {
  const { signedIn, me } = useSession();
  if (!signedIn) return <Redirect href="/welcome" />;
  if (me && !me.profile) return <Redirect href="/onboarding/about" />;
  return <Redirect href="/feed" />;
}
