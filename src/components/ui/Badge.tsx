import { StyleSheet, View } from 'react-native';

import { crowdKey, crowdTone, stageLabel, stageTone } from '@/constants/colors';
import { color, radius } from '@/constants/theme';
import type { Crowd, Stage } from '@/lib/api';

import { AppText } from './AppText';

/** 관리자 경보 단계 배지 (■ + 글자). 색만으로 구분하지 않게 글자를 항상 같이 씀 */
export function StageBadge({ stage, label }: { stage: Stage; label?: string }) {
  const tone = stageTone[stage];
  return (
    <View style={[styles.stage, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.fill }]} />
      <AppText variant="caption" color={tone.text}>
        {label ?? stageLabel[stage]}
      </AppText>
    </View>
  );
}

/** 시민 혼잡 배지 (여유·보통·붐빔·매우 붐빔) */
export function CrowdBadge({ crowd, label }: { crowd: Crowd; label: string }) {
  const tone = crowdTone[crowdKey(crowd)];
  return (
    <View style={[styles.crowd, { backgroundColor: tone.bg }]}>
      <AppText variant="caption" color={tone.text}>
        {label}
      </AppText>
    </View>
  );
}

export function NewBadge() {
  return (
    <View style={styles.new}>
      <AppText variant="caption" color={color.badgeNewText}>
        신규
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  dot: { width: 8, height: 8, borderRadius: 2 },
  crowd: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, alignSelf: 'flex-start' },
  new: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.sm, backgroundColor: color.badgeNewBg },
});
