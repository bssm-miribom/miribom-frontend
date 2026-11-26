import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { crowdTone } from '@/constants/colors';
import { color, radius } from '@/constants/theme';
import type { ScenarioInfo } from '@/lib/api';
import { DEMO_CASE, DEMO_SCENARIO, setReplayDay, setScenarioKey, useReplayDay, useScenarioKey } from '@/lib/replayDay';

/** 시연용 보기(과거 날짜 재현·가상 시나리오) 중이면 눈에 띄는 안내 + 오늘로 돌아가기. 아니면 showEntry일 때 시연 버튼 */
export function ReplayBanner({ showEntry = false, scenario }: { showEntry?: boolean; scenario?: ScenarioInfo | null }) {
  const day = useReplayDay();
  const scenarioKey = useScenarioKey();
  if (scenarioKey) {
    const tone = crowdTone.very_busy;
    const body = scenario
      ? `${scenario.place} 검색량 ${scenario.multiplier}배 (${mmdd(scenario.start)}부터). 가정: ${scenario.assumption}`
      : '위험 단계를 보여 주려고 만든 가정 상황이에요. 실제 예보가 아니에요.';
    return <Banner bg={tone.bg} fg={tone.text} title="가상 시나리오 · 실제 데이터 아님" body={body} />;
  }
  if (day) {
    const tone = crowdTone.busy;
    return (
      <Banner
        bg={tone.bg}
        fg={tone.text}
        title={`과거 날짜 재현 · ${day.replace(/-/g, '.')} 07:00`}
        body="그날 07:00까지 있던 실제 자료로 다시 돌린 판정이에요. 오늘 예보가 아니에요."
      />
    );
  }
  if (!showEntry) return null;
  return (
    <View style={styles.entries}>
      <Entry
        text={`시연: ${DEMO_CASE.label}(${mmdd(DEMO_CASE.day)}) 그날 예보 다시 보기`}
        onPress={() => setReplayDay(DEMO_CASE.day)}
      />
      <Entry text={`시연: ${DEMO_SCENARIO.label} (실제 데이터 아님)`} onPress={() => setScenarioKey(DEMO_SCENARIO.key)} />
    </View>
  );
}

function mmdd(date: string) {
  return date.slice(5).replace('-', '/');
}

function Banner({ bg, fg, title, body }: { bg: string; fg: string; title: string; body: string }) {
  return (
    <View style={[styles.banner, { backgroundColor: bg }]} accessibilityRole="alert">
      <Icon name="infoBusy" size={20} />
      <View style={styles.text}>
        <AppText variant="h3" color={fg}>
          {title}
        </AppText>
        <AppText variant="caption" color={fg}>
          {body}
        </AppText>
      </View>
      <Pressable style={[styles.back, { borderColor: fg }]} onPress={() => setReplayDay(null)} accessibilityRole="button">
        <AppText variant="caption" color={fg}>
          오늘 예보로
        </AppText>
      </Pressable>
    </View>
  );
}

function Entry({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable style={styles.entry} onPress={onPress} accessibilityRole="button">
      <Icon name="clock" size={16} />
      <AppText variant="caption" color={color.textSecondary} style={styles.text}>
        {text}
      </AppText>
      <Icon name="chevronRightSm" size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md },
  text: { flex: 1, gap: 2 },
  back: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: radius.full },
  entries: { gap: 8 },
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
