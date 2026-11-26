import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Icon } from '@/components/ui';
import { color } from '@/constants/theme';

/** 시민 하단 탭 (검색 · 지도). 지도 화면은 아직 없어서 준비 중 표시만 */
export function CitizenTabBar() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: bottom }]}>
      <Pressable style={styles.tab} onPress={() => router.navigate('/')} accessibilityRole="tab" accessibilityState={{ selected: true }}>
        <Icon name="tabSearch" size={22} />
        <AppText variant="caption">검색</AppText>
      </Pressable>
      <View style={styles.tab} accessibilityRole="tab" accessibilityState={{ disabled: true }} accessibilityLabel="지도 (준비 중)">
        <Icon name="tabMap" size={22} />
        <AppText variant="caption" color={color.textSecondary}>
          지도
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: color.bgDefault,
    borderTopWidth: 1,
    borderTopColor: color.borderDefault,
  },
  tab: { flex: 1, height: 60, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
