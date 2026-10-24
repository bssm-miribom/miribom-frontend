import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';

// C2 장소 혼잡 안내 (3일 혼잡 카드)
export default function PlaceCrowd() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen id="C2" title="장소 혼잡 안내">
      <Text>장소 ID: {id}</Text>
      <Text>예측에 기반한 추정치이며 실제와 다를 수 있음 · 매일 07시 갱신</Text>
    </Screen>
  );
}
