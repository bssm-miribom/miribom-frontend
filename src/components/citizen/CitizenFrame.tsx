import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { color } from '@/constants/theme';

import { CitizenTabBar } from './CitizenTabBar';

type Props = { header?: ReactNode; headerBg?: string; children: ReactNode };

/** 시민 모바일 화면 틀: 위 고정 헤더, 가운데 스크롤, 아래 탭. 데스크톱 웹에서는 가운데 480px */
export function CitizenFrame({ header, headerBg = color.bgDefault, children }: Props) {
  return (
    <View style={styles.page}>
      <View style={styles.column}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: headerBg }}>
          {header}
        </SafeAreaView>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        <CitizenTabBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.bgSubtle, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: color.bgDefault },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
});
