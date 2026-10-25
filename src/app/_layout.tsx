import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { restoreSession } from '@/lib/session';

export default function RootLayout() {
  useEffect(() => {
    restoreSession();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
