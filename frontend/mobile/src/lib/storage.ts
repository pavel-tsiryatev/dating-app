import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Токен и адрес сервера: на телефоне — в защищённом хранилище (Keychain / Keystore),
 * в веб-сборке для предпросмотра — в localStorage (SecureStore там нет).
 */
const web = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (web) {
    try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (web) {
    try { globalThis.localStorage?.setItem(key, value); } catch { /* приватный режим */ }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (web) {
    try { globalThis.localStorage?.removeItem(key); } catch { /* приватный режим */ }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
