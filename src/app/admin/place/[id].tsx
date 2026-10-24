import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';

// A3 장소 상세 (추이 그래프, 판정 근거)
export default function AdminPlaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen id="A3" title="장소 상세">
      <Text>장소 ID: {id}</Text>
    </Screen>
  );
}
