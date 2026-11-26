import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { CitizenFrame } from '@/components/citizen/CitizenFrame';
import { AppText, Icon } from '@/components/ui';
import { crowdKey, crowdRank, crowdTone } from '@/constants/colors';
import { color, radius } from '@/constants/theme';
import { getPlaceForecast, type CrowdDay, type PlaceForecast } from '@/lib/api';
import { mmdd, relativeDay, stamp, weekday } from '@/lib/format';
import { shareLink } from '@/lib/share';
import { useApi } from '@/lib/useApi';

// C2 장소 혼잡 안내 (3일 혼잡 카드)
export default function PlaceCrowd() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, error, loading, reload } = useApi(() => getPlaceForecast(id), [id]);
  const [toast, setToast] = useState<string | null>(null);

  const onShare = async () => {
    const msg = await shareLink(data ? `${data.place.name} 혼잡 예보 · 미리봄` : '미리봄');
    if (msg) {
      setToast(msg);
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <CitizenFrame
      header={
        <View style={styles.topBar}>
          <StatusBar style="dark" />
          <Pressable
            style={styles.iconBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            accessibilityLabel="뒤로">
            <Icon name="back" size={22} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={onShare} accessibilityLabel="공유">
            <Icon name="share" size={22} />
          </Pressable>
        </View>
      }>
      {toast && (
        <View style={styles.toast}>
          <AppText variant="caption" color={color.textInverse}>
            {toast}
          </AppText>
        </View>
      )}
      {loading && <ActivityIndicator color={color.textLink} style={styles.loader} />}
      {error && (
        <View style={styles.pad}>
          <AppText variant="body" color={color.textSecondary}>
            {error.status === 404 ? '장소를 찾을 수 없어요.' : '예보를 불러오지 못했어요.'}
          </AppText>
          {error.status !== 404 && (
            <Pressable onPress={reload}>
              <AppText variant="bodySm" color={color.textLink}>
                다시 시도
              </AppText>
            </Pressable>
          )}
        </View>
      )}
      {data && <Forecast data={data} />}
    </CitizenFrame>
  );
}

type Rel = (date: string) => string;

function Forecast({ data }: { data: PlaceForecast }) {
  const { place, days, least_crowded, notices } = data;
  // 예보 날짜는 판정일 다음 날부터라서 판정일 기준으로 내일·모레를 붙임
  const rel: Rel = (date) => relativeDay(date, data.meta.judge_day);
  const summary = summarize(days, least_crowded, rel);
  const tone = crowdTone[summary.tone];
  const hasBusy = days.some((d) => crowdRank[crowdKey(d.crowd)] >= 2);

  return (
    <>
      <View style={styles.title}>
        <AppText variant="caption" color={color.textSecondary}>
          부산 {place.district}
        </AppText>
        <AppText variant="h1">{place.name}</AppText>
      </View>

      <View style={styles.block}>
        <View style={[styles.summary, { backgroundColor: tone.bg }]}>
          <Icon name={summary.tone === 'busy' ? 'infoBusy' : 'info'} size={22} />
          <View style={styles.summaryText}>
            <AppText variant="h3" color={tone.text}>
              {summary.title}
            </AppText>
            <AppText variant="caption" color={tone.text}>
              {summary.sub}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.forecast}>
        <View style={styles.forecastHead}>
          <AppText variant="h3">3일 예상 혼잡</AppText>
          <AppText variant="metric" color={color.textSecondary}>
            {stamp(data.meta.generated_at)} 기준
          </AppText>
        </View>
        {days.map((day) => (
          <DayRow key={day.date} day={day} rel={rel} />
        ))}
      </View>

      {notices.length > 0 && (
        <View style={styles.notices}>
          {notices.map((n) => (
            <View key={n.id} style={styles.notice}>
              <AppText variant="caption" color={color.textLink}>
                공지
              </AppText>
              <AppText variant="h3">{n.title}</AppText>
              <AppText variant="bodySm" color={color.textSecondary}>
                {n.body}
              </AppText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottom}>
        <View style={styles.recommend}>
          <AppText variant="caption" color={color.textLink}>
            방문 추천
          </AppText>
          <AppText variant="h3">
            {least_crowded
              ? `${rel(least_crowded)}(${mmdd(least_crowded)} ${weekday(least_crowded)})에 방문해 보세요`
              : '3일 모두 비슷해요. 편한 날 방문해 보세요'}
          </AppText>
          {hasBusy && (
            <View style={styles.tip}>
              <Icon name="bus" size={16} />
              <AppText variant="caption" color={color.textSecondary} style={styles.flex}>
                붐비는 날엔 주변 주차장이 일찍 차요. 대중교통을 이용해 주세요.
              </AppText>
            </View>
          )}
        </View>
        <View style={styles.disclaimer}>
          <Icon name="info" size={16} />
          <AppText variant="caption" color={color.textSecondary} style={styles.flex}>
            검색량, 블로그, 뉴스 같은 온라인 관심도로 예측한 추정치예요. 실제 현장과 다를 수 있어요. 매일 07시에 새로 나와요.
          </AppText>
        </View>
      </View>
    </>
  );
}

// 막대 3칸 중 채우는 칸 수
const FILLED = { none: 0, free: 1, normal: 2, busy: 3, very_busy: 3 } as const;

function DayRow({ day, rel }: { day: CrowdDay; rel: Rel }) {
  const key = crowdKey(day.crowd);
  const tone = crowdTone[key];
  return (
    <View style={styles.dayRow}>
      <View style={styles.dayLabel}>
        <AppText variant="h3">{rel(day.date)}</AppText>
        <AppText variant="caption" color={color.textSecondary}>
          {mmdd(day.date)} {weekday(day.date)}
        </AppText>
      </View>
      <View style={styles.bars}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i < FILLED[key] ? tone.fill : color.bgMuted }]} />
        ))}
      </View>
      <AppText variant="h3" color={tone.text} align="right" style={styles.dayValue}>
        {day.crowd ? day.label : '준비 중'}
      </AppText>
    </View>
  );
}

/** 받침 있으면 '은', 없으면 '는' */
function topic(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '은' : '는';
}

function summarize(days: CrowdDay[], least: string | null, rel: Rel) {
  const known = days.filter((d) => d.crowd);
  if (known.length === 0) {
    return { tone: 'none' as const, title: '아직 예보를 준비하고 있어요', sub: '매일 07시에 새 예보가 나와요.' };
  }
  const worst = known.reduce((a, b) => (crowdRank[crowdKey(b.crowd)] > crowdRank[crowdKey(a.crowd)] ? b : a));
  const tone = crowdKey(worst.crowd);
  const leastText = least ? `${rel(least)}${topic(rel(least))} 비교적 여유로워요.` : '';

  const busy = known.filter((d) => crowdRank[crowdKey(d.crowd)] >= 2);
  if (busy.length === 0) {
    const title = tone === 'free' ? '3일 동안 여유로울 것 같아요' : '크게 붐비지는 않을 것 같아요';
    return { tone, title, sub: leastText || '편한 날 방문해 보세요.' };
  }
  const word = busy.length === days.length ? '3일 내내' : busy.map((d) => rel(d.date)).join('과 ');
  const verb = tone === 'very_busy' ? '많이 붐빌 것 같아요' : '붐빌 것 같아요';
  const title = busy.length === days.length ? `${word} ${verb}` : `${word}${topic(word)} ${verb}`;
  return { tone, title, sub: leastText || '3일 모두 비슷하게 붐벼요.' };
}

const styles = StyleSheet.create({
  topBar: { height: 52, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  loader: { paddingVertical: 40 },
  pad: { padding: 20, gap: 8 },
  toast: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: color.bgInverse,
  },
  title: { paddingTop: 8, paddingHorizontal: 20, gap: 8 },
  block: { paddingTop: 16, paddingHorizontal: 20 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.lg },
  summaryText: { flex: 1, gap: 2 },
  forecast: { paddingTop: 28, paddingHorizontal: 20 },
  forecastHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: color.borderStrong,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: color.borderDefault,
  },
  dayLabel: { width: 64, gap: 2 },
  bars: { flex: 1, flexDirection: 'row', gap: 3 },
  bar: { flex: 1, maxWidth: 60, height: 10, borderRadius: 5 },
  dayValue: { width: 72 },
  notices: { paddingTop: 20, paddingHorizontal: 20, gap: 8 },
  notice: { gap: 4, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: color.borderDefault },
  bottom: { paddingTop: 20, paddingHorizontal: 20, gap: 12 },
  recommend: { gap: 6, padding: 18, borderRadius: radius.lg, backgroundColor: color.bgBrandSubtle },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 14 },
  flex: { flex: 1 },
});
