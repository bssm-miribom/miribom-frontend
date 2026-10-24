import { Link } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';

// A1 로그인 (기관 담당자 전용)
export default function Login() {
  return (
    <Screen id="A1" title="미리봄 · 부산시 인파 급증 경보">
      <Link href="/admin">
        <Text style={{ color: '#1C7ED6' }}>로그인 (임시)</Text>
      </Link>
    </Screen>
  );
}
