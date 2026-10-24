import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { ApiStatus } from '@/components/ApiStatus';
import { Screen } from '@/components/Screen';

// C1 장소 검색 (시민 첫 화면, 로그인 없음)
export default function PlaceSearch() {
  const [query, setQuery] = useState('');

  return (
    <Screen id="C1" title="미리봄 · 가기 전에 미리 보는 부산 혼잡 예보">
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="장소 이름이나 별명으로 검색 (예: 부캉이)"
      />
      <Link href={{ pathname: '/place/[id]', params: { id: 'bukhang' } }}>
        <Text style={styles.link}>북항친수공원 · 동구 (예시)</Text>
      </Link>
      <Link href="/admin/login">
        <Text style={styles.link}>기관 담당자 로그인</Text>
      </Link>
      <ApiStatus />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#CED4DA', borderRadius: 8, padding: 12 },
  link: { color: '#1C7ED6' },
});
