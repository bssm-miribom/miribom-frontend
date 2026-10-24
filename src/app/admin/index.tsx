import { Link } from 'expo-router';
import { Text } from 'react-native';

import { ApiStatus } from '@/components/ApiStatus';
import { Screen } from '@/components/Screen';

// A2 경보 대시보드 메인 (요약 줄, 지도, 목록, 별칭 등록)
export default function Dashboard() {
  return (
    <Screen id="A2" title="경보 대시보드">
      <Link href={{ pathname: '/admin/place/[id]', params: { id: 'bukhang' } }}>
        <Text style={{ color: '#1C7ED6' }}>북항친수공원 · 3단계 (예시)</Text>
      </Link>
      <Link href="/admin/replay">
        <Text style={{ color: '#1C7ED6' }}>과거 사례 재현</Text>
      </Link>
      <ApiStatus />
      <Text style={{ color: '#868E96' }}>
        경보는 판단을 돕는 자료이며, 대응 여부와 수준은 부산시가 결정함
      </Text>
    </Screen>
  );
}
