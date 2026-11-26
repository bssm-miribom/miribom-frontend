import { Redirect, Slot, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Sidebar } from '@/components/admin/Sidebar';
import { color } from '@/constants/theme';
import { useSession } from '@/lib/session';

// 관리자 웹: 로그인 화면만 사이드바 없이, 나머지는 로그인 필요 + 왼쪽 사이드바
export default function AdminLayout() {
  const pathname = usePathname();
  const session = useSession();

  if (pathname === '/admin/login') return <Slot />;
  if (!session) return <Redirect href="/admin/login" />;

  return (
    <View style={styles.row}>
      <Sidebar />
      <View style={styles.main}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', backgroundColor: color.bgDefault, minWidth: 1024 },
  main: { flex: 1 },
});
