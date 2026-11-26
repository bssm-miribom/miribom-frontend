import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { fontFiles } from '@/constants/theme';
import { restoreSession } from '@/lib/session';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontFiles);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // 관리자 화면이 로그인 여부를 판단하기 전에 저장된 세션부터 복원
    restoreSession().finally(() => setSessionReady(true));
  }, []);

  const ready = (fontsLoaded || !!fontError) && sessionReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
