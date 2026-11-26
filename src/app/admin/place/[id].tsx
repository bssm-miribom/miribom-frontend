import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TrendChart, TrendLegend } from '@/components/admin/charts';
import { AdminPage, ErrorView, firstOverDay, Loading } from '@/components/admin/common';
import { AppText, Icon, StageBadge } from '@/components/ui';
import { stageName, stageRank, stageTone } from '@/constants/colors';
import { color, radius } from '@/constants/theme';
import {
  ApiError,
  getChecklists,
  getPlaceDetail,
  setChecklistItem,
  type Checklist,
  type JudgeQuery,
  type PlaceDetail,
  type Stage,
} from '@/lib/api';
import { addDays, judgeTime, mmdd, ratio } from '@/lib/format';
import { togglePref, usePref } from '@/lib/prefs';
import { shareLink } from '@/lib/share';
import { useApi } from '@/lib/useApi';

// 판정 보류일 때 빠진 값 이름 (API missing)
const MISSING_LABEL: Record<string, string> = {
  bottleneck_m2: '병목 면적',
  peak_share: '최대 시간대 비율',
  bottleneck_share: '병목 통과 비율',
  base_rest: '휴일 평소 방문객',
  base_work: '평일 평소 방문객',
};

// A3 장소 상세 (추이 그래프, 판정 근거)
export default function AdminPlaceDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; judge_day?: string; replay?: string }>();
  const query: JudgeQuery = { judge_day: params.judge_day, replay: params.replay === '1' ? true : undefined };
  const { data, error, loading, reload } = useApi(() => getPlaceDetail(params.id, query), [params.id, params.judge_day, params.replay]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/admin'));

  return (
    <AdminPage gap={20}>
      <View style={styles.crumbs}>
        <Pressable style={styles.crumb} onPress={back}>
          <Icon name="backSm" size={16} />
          <AppText variant="bodySm" color={color.textSecondary}>
            경보 대시보드
          </AppText>
        </Pressable>
        {data && <StageBadge stage={data.stage} label={`${stageName[data.stage]}, ${judgeTime(data.meta.judge_day)} 판정`} />}
        {data?.meta.replay && (
          <AppText variant="caption" color={color.textSecondary}>
            과거 사례 재현 결과
          </AppText>
        )}
      </View>
      {loading && <Loading />}
      {error && <ErrorView error={error} notFound="이 날짜의 판정 결과가 없습니다." onRetry={reload} />}
      {data && <Detail detail={data} query={query} />}
    </AdminPage>
  );
}

function Detail({ detail, query }: { detail: PlaceDetail; query: JudgeQuery }) {
  const { place } = detail;
  const favorites = usePref('favoritePlaces');
  const fav = favorites.includes(place.id);
  const sub = [`부산 ${place.district}`, place.aliases.length ? `별칭 ${place.aliases.join(', ')}` : null].filter(Boolean).join('. ');

  return (
    <>
      <View style={styles.titleBox}>
        <View style={styles.titleLine}>
          <AppText variant="h1">{place.name}</AppText>
          <Pressable
            onPress={() => togglePref('favoritePlaces', place.id)}
            accessibilityRole="button"
            accessibilityLabel={fav ? '즐겨찾기 해제' : '즐겨찾기'}
            style={[styles.star, fav && styles.starOn]}>
            <Icon name="star" size={22} />
          </Pressable>
        </View>
        <AppText variant="bodySm" color={color.textSecondary}>
          {sub}
        </AppText>
      </View>

      <View style={styles.columns}>
        <View style={styles.left}>
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <AppText variant="h3">추이 그래프</AppText>
              <TrendLegend />
            </View>
            <TrendChart detail={detail} />
            {detail.actual_visitors.length === 0 && (
              <AppText variant="caption" color={color.textSecondary}>
                실측 방문객은 협력기관 회신이 들어오면 표시됩니다.
              </AppText>
            )}
          </View>
          <View style={styles.lower}>
            <History detail={detail} query={query} />
            <Recommendations detail={detail} />
          </View>
        </View>
        <Basis detail={detail} />
      </View>
    </>
  );
}

/** 판정 이력: 최근 3번의 07:00 판정 단계 */
function History({ detail, query }: { detail: PlaceDetail; query: JudgeQuery }) {
  const day = detail.meta.judge_day;
  const prev = useApi(
    () =>
      Promise.all(
        [1, 2, 3].map((n) =>
          getPlaceDetail(detail.place.id, { ...query, judge_day: addDays(day, -n) })
            .then((d) => d.stage)
            .catch(() => null),
        ),
      ),
    [detail.place.id, day, query.replay],
  );
  const stages: (Stage | null)[] = [detail.stage, ...(prev.data ?? [null, null, null])];
  const items = stages.slice(0, 3).map((stage, i) => ({ date: addDays(day, -i), stage, before: stages[i + 1] }));

  return (
    <View style={styles.listBox}>
      <AppText variant="h3">판정 이력</AppText>
      {items.map(({ date, stage, before }) => (
        <View key={date} style={styles.listRow}>
          <AppText variant="metric" color={color.textSecondary}>
            {judgeTime(date)}
          </AppText>
          <AppText variant="bodySm" color={stage && stageRank[stage] >= 2 ? stageTone[stage].text : color.textPrimary}>
            {prev.loading && date !== day ? '…' : historyText(stage, before)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function historyText(stage: Stage | null, before: Stage | null | undefined) {
  if (!stage) return '판정 없음';
  const name = stageName[stage].split(' ')[0];
  if (stage === 'normal') return '평상';
  if (!before || before === 'normal') return `${name}, 신규 후보`;
  if (stageRank[stage] > stageRank[before]) return `${name}로 상향`;
  if (stageRank[stage] < stageRank[before]) return `${name}로 하향`;
  return `${name} 유지`;
}

/** 대응 권고: 부산시가 대응 수준을 정하면 만들어지는 점검표 */
function Recommendations({ detail }: { detail: PlaceDetail }) {
  const { data, error, loading, reload } = useApi(
    () => getChecklists({ place_id: detail.place.id, judge_day: detail.meta.judge_day }),
    [detail.place.id, detail.meta.judge_day],
  );
  const [failed, setFailed] = useState<string | null>(null);
  const list: Checklist | undefined = data?.[0];

  const toggle = async (itemId: string, done: boolean) => {
    if (!list) return;
    setFailed(null);
    try {
      await setChecklistItem(list.id, itemId, done);
      reload();
    } catch (e) {
      setFailed(e instanceof ApiError && e.status === 403 ? '관할 기관만 체크할 수 있습니다.' : '저장하지 못했습니다.');
    }
  };

  return (
    <View style={styles.listBox}>
      <AppText variant="h3">대응 권고</AppText>
      {loading && <Loading />}
      {!loading && (error || !list) && (
        <AppText variant="bodySm" color={color.textSecondary} style={styles.listRow}>
          부산시가 대응 수준을 정하면 점검표가 만들어집니다.
        </AppText>
      )}
      {list?.items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.listRow}
          onPress={() => toggle(item.id, !item.done)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.done }}>
          <View style={[styles.box, item.done && styles.boxOn]}>{item.done && <Icon name="check" size={12} />}</View>
          <AppText variant="bodySm" color={item.done ? color.textSecondary : color.textPrimary}>
            {item.label}
          </AppText>
        </Pressable>
      ))}
      {failed && (
        <AppText variant="caption" color="#A93320">
          {failed}
        </AppText>
      )}
    </View>
  );
}

/** 오른쪽 판정 근거 패널 */
function Basis({ detail }: { detail: PlaceDetail }) {
  const [toast, setToast] = useState<string | null>(null);
  const d1 = [...detail.forecasts].sort((a, b) => a.horizon - b.horizon)[0];
  const limit = detail.bottleneck?.limit_per_m2 ?? 5;
  const tone = stageTone[detail.stage];
  const over = firstOverDay(detail);
  const bottleneck = detail.bottleneck?.name ?? '병목 지점';

  const share = async () => {
    const msg = await shareLink(`[미리봄 ${stageName[detail.stage]}] ${detail.place.name}`);
    setToast(msg ?? null);
  };

  const rows: [string, string][] = [
    ['검색 지수', `평소(계절·명절 보정) 대비 ${ratio(detail.surge.ratio)}`],
    [
      '방문 의도 글',
      detail.intent?.posts != null
        ? `${detail.intent.posts}건${detail.intent.ratio != null ? ` (평소 대비 ${ratio(detail.intent.ratio)})` : ''}`
        : '분류 결과 없음',
    ],
    ['날씨 자료', detail.weather_source || '—'],
    [
      '병목 지점',
      detail.bottleneck
        ? `${detail.bottleneck.name} (유효 면적 ${Math.round(detail.bottleneck.area_m2).toLocaleString('ko-KR')}㎡${detail.bottleneck.estimated ? ', 추정' : ''})`
        : '지정 안 됨',
    ],
  ];

  return (
    <View style={styles.basis}>
      <View style={styles.basisHead}>
        <AppText variant="h2">판정 근거</AppText>
        <AppText variant="caption" color={color.textSecondary}>
          현장 확인 전 추정치
        </AppText>
      </View>

      <View style={[styles.densityBox, { backgroundColor: tone.bg }]}>
        <AppText variant="caption" color={color.textSecondary}>
          내일 {bottleneck} 예상 밀집도
        </AppText>
        {d1?.density_mid != null ? (
          <View style={styles.densityLine}>
            <AppText variant="metricLg" color={tone.text}>
              {d1.density_mid.toFixed(1)}
            </AppText>
            <AppText variant="bodySm" color={tone.text}>
              명/㎡
            </AppText>
            <AppText variant="bodySm">
              {'  '}기준 {limit}명/㎡ {d1.density_mid > limit ? '넘음' : '넘지 않음'}
            </AppText>
          </View>
        ) : (
          <AppText variant="bodySm">
            계산할 수 없음
            {detail.missing?.length ? ` (빠진 값: ${detail.missing.map((m) => MISSING_LABEL[m] ?? m).join(', ')})` : ''}
          </AppText>
        )}
        {over && over.density_high != null && (
          <View style={styles.warn}>
            <Icon name="warning" size={14} />
            <AppText variant="caption" color="#A93320">
              {mmdd(over.date)}에는 기준을 넘을 수 있음 ({over.density_high.toFixed(1)}명/㎡)
            </AppText>
          </View>
        )}
      </View>

      <AppText variant="bodySm">{detail.reason}</AppText>
      {detail.worst_case ? (
        <AppText variant="caption" color={color.textSecondary}>
          {detail.worst_case}
        </AppText>
      ) : null}

      <View>
        {rows.map(([k, v]) => (
          <View key={k} style={styles.basisRow}>
            <AppText variant="caption" color={color.textSecondary} style={styles.basisKey}>
              {k}
            </AppText>
            <AppText variant="bodySm" style={styles.flex}>
              {v}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.flex} />
      {toast && (
        <AppText variant="caption" color={color.textSecondary} align="center">
          {toast}
        </AppText>
      )}
      <Pressable style={styles.primary} onPress={share} accessibilityRole="button">
        <Icon name="upload" size={18} />
        <AppText variant="h3">협력기관에 공유</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  crumbs: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  crumb: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titleBox: { gap: 10 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  star: { borderRadius: 6, padding: 2 },
  starOn: { backgroundColor: '#FCEFD2' },
  columns: { flexDirection: 'row', gap: 24, alignItems: 'stretch' },
  left: { flex: 1, gap: 20, minWidth: 0 },
  card: {
    gap: 28,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.lg,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  lower: { flexDirection: 'row', gap: 40 },
  listBox: { flex: 1, paddingTop: 4, paddingBottom: 20 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.borderDefault,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: color.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: color.bgBrand, borderColor: color.bgBrand },
  basis: {
    width: 360,
    gap: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.lg,
  },
  basisHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  densityBox: { gap: 6, padding: 16, borderRadius: radius.md },
  densityLine: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, flexWrap: 'wrap' },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  basisRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: color.borderDefault },
  basisKey: { width: 72, paddingTop: 2 },
  flex: { flex: 1 },
  primary: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: color.bgBrand,
  },
});
