import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = { id: string; title: string; children?: ReactNode };

// 화면 뼈대용 공통 틀. 실제 화면 구현 시 교체
export function Screen({ id, title, children }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.id}>{id}</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 8 },
  id: { fontSize: 12, color: '#868E96' },
  title: { fontSize: 22, fontWeight: '700' },
  body: { marginTop: 16, gap: 12 },
});
