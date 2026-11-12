// Подключаем только нужные начертания: импорт из корня пакета тянет в APK все 18 файлов
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat/800ExtraBold';
import { Montserrat_800ExtraBold_Italic } from '@expo-google-fonts/montserrat/800ExtraBold_Italic';
import { Montserrat_900Black_Italic } from '@expo-google-fonts/montserrat/900Black_Italic';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../components/toast';
import { SessionProvider, useSession } from '../lib/session';
import { colors } from '../theme';

void SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { ready } = useSession();
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold, Montserrat_800ExtraBold,
    Montserrat_800ExtraBold_Italic, Montserrat_900Black_Italic,
  });
  const loaded = ready && (fontsLoaded || !!fontError);
  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);
  if (!loaded) return null;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Screen name="filters" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="match/[id]" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Navigator />
        </ToastProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
