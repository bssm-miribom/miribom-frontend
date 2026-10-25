import * as SecureStore from 'expo-secure-store';

// 앱: 토큰은 iOS Keychain / Android Keystore에 저장. 이 기기에서 잠금 해제 상태일 때만 읽힘, 백업·기기 이전 안 됨
const KEY = 'miribom.session';
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function readSession(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY, OPTIONS);
  } catch {
    return null;
  }
}

export async function writeSession(value: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, value, OPTIONS);
}

export async function removeSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY, OPTIONS);
  } catch {}
}
