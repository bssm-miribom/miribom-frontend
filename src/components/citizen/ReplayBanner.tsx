import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { crowdTone } from '@/constants/colors';
import { color, radius } from '@/constants/theme';
import { DEMO_CASE, setReplayDay, useReplayDay } from '@/lib/replayDay';

const tone = crowdTone.busy;

/** 과거 날짜 재현 중이면 눈에 띄는 안내 + 오늘로 돌아가기. 아니면 시연용 날짜 보기 버튼 (showEntry일 때만) */
export function ReplayBanner({ showEntry = false }: { showEntry?: boolean }) {
  const day = useReplayDay();
  if (day) {
    return (
      <View style={[styles.banner, { backgroundColor: tone.bg }]} accessibilityRole="alert">
        <Icon name="infoBusy" size={20} />
        <View style={styles.text}>
          <AppText variant="h3" color={tone.text}>
            과거 날짜 재현 · {day.replace(/-/g, '.')} 07:00
          </AppText>
          <AppText variant="caption" color={tone.text}>
            그날 07:00까지 있던 실제 자료로 다시 돌린 판정이에요. 오늘 예보가 아니에요.
          </AppText>
        </View>
        <Pressable style={styles.back} onPress={() => setReplayDay(null)} accessibilityRole="button">
          <AppText variant="caption" color={tone.text}>
            오늘 예보로
          </AppText>
        </Pressable>
      </View>
    );
  }
  if (!showEntry) return null;
  return (
    <Pressable style={styles.entry} onPress={() => setReplayDay(DEMO_CASE.day)} accessibilityRole="button">
      <Icon name="clock" size={16} />
      <AppText variant="caption" color={color.textSecondary} style={styles.text}>
        시연: {DEMO_CASE.label}({DEMO_CASE.day.slice(5).replace('-', '/')}) 그날 예보 다시 보기
      </AppText>
      <Icon name="chevronRightSm" size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md },
  text: { flex: 1, gap: 2 },
  back: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: tone.text,
    borderRadius: radius.full,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.md,
  },
});
