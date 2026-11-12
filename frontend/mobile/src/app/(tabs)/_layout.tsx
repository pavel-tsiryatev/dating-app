import { Redirect, Tabs } from 'expo-router';
import { TabBar } from '../../components/TabBar';
import { useSession } from '../../lib/session';

export default function TabsLayout() {
  const { signedIn } = useSession();
  if (!signedIn) return <Redirect href="/welcome" />;
  return (
    <Tabs
      // Типы навигатора несовместимы со строгим локальным описанием пропсов — приводим явно
      tabBar={(props) => <TabBar {...(props as unknown as Parameters<typeof TabBar>[0])} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="likes" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
