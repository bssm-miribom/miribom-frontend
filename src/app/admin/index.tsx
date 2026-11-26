import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AliasModal } from '@/components/admin/AliasModal';
import { Sparkline } from '@/components/admin/charts';
import { AdminPage, ErrorView, firstOverDay, Loading } from '@/components/admin/common';
import { AppText, Icon, NewBadge, StageBadge } from '@/components/ui';
import { crowdTone, stageTone } from '@/constants/colors';
import { color, radius } from '@/constants/theme';
import { getDashboard, getPlaceDetail, type Dashboard as DashboardData, type DashboardPlace, type JudgeQuery, type PlaceDetail } from '@/lib/api';
import { addDays, density, judgeTime, mmdd, range, ratio } from '@/lib/format';
import { DEMO_CASE } from '@/lib/replayDay';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/useApi';

// 처음엔 이만큼만 보여주고 '모두 보기'로 펼침
const PREVIEW_ROWS = 7;

// A2 경보 대시보드 메인 (요약 줄, 우선 대응 목록, 별칭 등록)
export default function Dashboard() {
  const router = useRouter();
  const params = useLocalSearchParams<{ judge_day?: string; replay?: string; alias?: string }>();
  const query: JudgeQuery = { judge_day: params.judge_day, replay: params.replay === '1' ? true : undefined };
  const session = useSession();
  const canEdit = !!session?.account.can_edit;
  const { data, error, loading, reload } = useApi(() => getDashboard(query), [params.judge_day, params.replay]);
  // 사이드바 '별칭 등록'은 ?alias=1로 들어옴
  const [aliasOpen, setAliasOpen] = useState(false);
  const showAlias = canEdit && (aliasOpen || params.alias === '1');
  const closeAlias = () => {
    setAliasOpen(false);
    if (params.alias) router.setParams({ alias: undefined });
  };

  return (
    <AdminPage>
      <View style={styles.header}>
        <View style={styles.titleBox}>
          <AppText variant="h1">경보 대시보드</AppText>
          <AppText variant="body" color={color.textSecondary}>
            {data ? summaryText(data) : ' '}
          </AppText>
        </View>
        <View style={styles.actions}>
          {data && (
            <View style={styles.judgeChip}>
              <Icon name="clock" size={18} />
              <AppText variant="metric">{judgeTime(data.meta.judge_day)} 판정</AppText>
              {!data.meta.replay && (
                <AppText variant="caption" color={color.textSecondary}>
                  다음 판정 {judgeTime(addDays(data.meta.judge_day, 1))}
                </AppText>
              )}
            </View>
          )}
          {canEdit && (
            // 시연용: 오늘 판정이 모두 낮을 때 경보가 실제로 났던 날의 재현 결과로 전환 (재현 결과는 부산시만 볼 수 있음)
            <Pressable
              style={[styles.outlineBtn, query.replay && styles.replayOn]}
              onPress={() =>
                router.setParams(
                  query.replay ? { judge_day: undefined, replay: undefined } : { judge_day: DEMO_CASE.day, replay: '1' },
                )
              }
              accessibilityRole="button">
              <Icon name="clock" size={18} />
              <AppText variant="h3">{query.replay ? '오늘 판정으로' : `시연: ${DEMO_CASE.label} ${mmdd(DEMO_CASE.day)}`}</AppText>
            </Pressable>
          )}
          {canEdit && (
            <Pressable style={styles.outlineBtn} onPress={() => setAliasOpen(true)} accessibilityRole="button">
              <Icon name="plus" size={18} />
              <AppText variant="h3">별칭 등록</AppText>
            </Pressable>
          )}
        </View>
      </View>

      {data && <MetaNotice meta={data.meta} />}

      {loading && <Loading />}
      {error && <ErrorView error={error} notFound="아직 판정 결과가 없습니다. 07:00 판정 뒤 다시 확인해 주세요." onRetry={reload} />}
      {data && <PriorityTable data={data} query={query} />}

      <AppText variant="caption" color={color.textSecondary}>
        경보는 판단을 돕는 자료이며, 대응 여부와 수준은 부산시가 결정합니다.
      </AppText>

      <AliasModal visible={showAlias} onClose={closeAlias} onDone={reload} />
    </AdminPage>
  );
}

function summaryText({ summary, places, meta }: DashboardData) {
  const when = meta.replay ? `${mmdd(meta.judge_day)} 재현 기준` : '오늘';
  const parts = [
    summary.stage3 && `3단계 ${summary.stage3}곳`,
    summary.stage2 && `2단계 ${summary.stage2}곳`,
    summary.stage1 && `1단계 ${summary.stage1}곳`,
    summary.pending && `판정 보류 ${summary.pending}곳`,
  ].filter(Boolean);
  if (parts.length === 0) return `${when} 급상승 장소가 없습니다.`;
  const fresh = places.filter((p) => p.is_new).length;
  return `${when} ${parts.join(', ')}입니다.${fresh ? ` 새로 잡힌 장소는 ${fresh}곳입니다.` : ''}`;
}

function MetaNotice({ meta }: { meta: DashboardData['meta'] }) {
  const notes = [
    meta.replay && `과거 날짜 재현: ${meta.judge_day.replace(/-/g, '.')} 07:00까지 있던 실제 자료로 다시 돌린 결과입니다. 오늘 판정이 아닙니다.`,
    meta.stale && '07:00이 지났지만 오늘 판정이 아직 없습니다. 자료 수집이 늦어지고 있습니다.',
    meta.demo && '시연용 가짜 데이터로 만든 결과입니다.',
  ].filter(Boolean) as string[];
  if (!notes.length) return null;
  return (
    <View style={[styles.notice, meta.replay && { backgroundColor: crowdTone.busy.bg }]}>
      {notes.map((n) => (
        <AppText key={n} variant="bodySm" color={meta.replay ? crowdTone.busy.text : color.textSecondary}>
          {n}
        </AppText>
      ))}
    </View>
  );
}

const COLS = { stage: 84, trend: 160, surge: 72, intent: 88, visitors: 112, density: 96, over: 96 };

function PriorityTable({ data, query }: { data: DashboardData; query: JudgeQuery }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? data.places : data.places.slice(0, PREVIEW_ROWS);
  const details = useDetails(rows.map((r) => r.id), query);

  return (
    <View>
      <AppText variant="h2" style={styles.tableTitle}>
        우선 대응 목록
      </AppText>
      <View style={[styles.row, styles.headRow]}>
        <Head w={COLS.stage}>단계</Head>
        <Head flex>장소</Head>
        <Head w={COLS.trend}>7일 검색 추이</Head>
        <Head w={COLS.surge} right>
          급증 배수
        </Head>
        <Head w={COLS.intent} right>
          방문 의도 글
        </Head>
        <Head w={COLS.visitors} right>
          내일 예상 방문객
        </Head>
        <Head w={COLS.density} right>
          예상 밀집도
        </Head>
        <Head w={COLS.over} right>
          기준 초과일
        </Head>
      </View>
      {rows.length === 0 && (
        <AppText variant="body" color={color.textSecondary} style={styles.empty}>
          오늘 급상승 장소가 없습니다.
        </AppText>
      )}
      {rows.map((place) => (
        <PlaceRow
          key={place.id}
          place={place}
          detail={details[place.id]}
          onPress={() =>
            router.push({
              pathname: '/admin/place/[id]',
              params: { id: place.id, ...(query.judge_day && { judge_day: query.judge_day }), ...(query.replay && { replay: '1' }) },
            })
          }
        />
      ))}
      {data.places.length > PREVIEW_ROWS && (
        <Pressable style={styles.more} onPress={() => setExpanded((v) => !v)}>
          <AppText variant="bodySm" color={color.textLink}>
            {expanded ? '접기' : `급상승 후보 ${data.places.length}곳 모두 보기`}
          </AppText>
          <Icon name="chevronRightSm" size={16} style={expanded && styles.up} />
        </Pressable>
      )}
    </View>
  );
}

function PlaceRow({ place, detail, onPress }: { place: DashboardPlace; detail?: PlaceDetail | null; onPress: () => void }) {
  const tone = stageTone[place.stage];
  const priority = place.stage === 'stage3' || place.stage === 'stage2';
  const sub = [place.district, place.new_alias && `별칭 ${place.new_alias}`, place.stage === 'pending' && '자료 부족']
    .filter(Boolean)
    .join(', ');
  const over = detail ? firstOverDay(detail) : null;
  const d1 = place.d1;

  return (
    <Pressable onPress={onPress} style={({ hovered }) => [styles.row, styles.bodyRow, (priority || hovered) && styles.rowOn]}>
      <View style={{ width: COLS.stage }}>
        <StageBadge stage={place.stage} />
      </View>
      <View style={styles.placeCell}>
        <View style={styles.nameLine}>
          <AppText variant="h3" numberOfLines={1} style={styles.shrink}>
            {place.name}
          </AppText>
          {place.is_new && <NewBadge />}
        </View>
        <AppText variant="caption" color={color.textSecondary} numberOfLines={1}>
          {sub}
        </AppText>
      </View>
      <View style={{ width: COLS.trend }}>
        {detail === undefined ? null : <Sparkline values={detail?.trend.map((t) => t.surge_ratio) ?? []} stroke={tone.text} />}
      </View>
      <Cell w={COLS.surge}>{ratio(place.surge_ratio)}</Cell>
      <Cell w={COLS.intent}>{place.intent_posts ?? '—'}</Cell>
      <Cell w={COLS.visitors}>{d1 ? range(d1.low, d1.high) : '—'}</Cell>
      <Cell w={COLS.density} color={d1?.density_mid != null ? tone.text : color.textDisabled}>
        {d1?.density_mid != null ? density(d1.density_mid) : '—'}
      </Cell>
      <Cell w={COLS.over} color={over ? color.textPrimary : color.textDisabled}>
        {over ? mmdd(over.date) : '—'}
      </Cell>
    </Pressable>
  );
}

function Head({ children, w, flex, right }: { children: string; w?: number; flex?: boolean; right?: boolean }) {
  return (
    <AppText variant="caption" color={color.textSecondary} align={right ? 'right' : 'left'} style={flex ? styles.placeCell : { width: w }}>
      {children}
    </AppText>
  );
}

function Cell({ children, w, color: c = color.textPrimary }: { children: React.ReactNode; w: number; color?: string }) {
  return (
    <AppText variant="metric" color={c} align="right" style={{ width: w }}>
      {children}
    </AppText>
  );
}

/** 표에 7일 추이·기준 초과일을 그리려고 행마다 장소 상세를 불러옴. 실패하면 null */
function useDetails(ids: string[], query: JudgeQuery) {
  const [map, setMap] = useState<Record<string, PlaceDetail | null>>({});
  const key = ids.join(',');

  useEffect(() => {
    let alive = true;
    for (const id of ids) {
      if (id in map) continue;
      getPlaceDetail(id, query)
        .then((d) => alive && setMap((m) => ({ ...m, [id]: d })))
        .catch(() => alive && setMap((m) => ({ ...m, [id]: null })));
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, query.judge_day, query.replay]);

  return map;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' },
  titleBox: { gap: 6, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  judgeChip: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: color.bgBrandSubtle,
  },
  replayOn: { backgroundColor: crowdTone.busy.bg, borderColor: crowdTone.busy.fill },
  outlineBtn: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 16,
    paddingRight: 18,
    borderWidth: 1,
    borderColor: color.borderStrong,
    borderRadius: radius.md,
    backgroundColor: color.bgDefault,
  },
  notice: { gap: 4, padding: 16, borderRadius: radius.md, backgroundColor: color.bgSubtle },
  tableTitle: { paddingBottom: 16 },
  row: { flexDirection: 'row', gap: 16 },
  headRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.borderStrong },
  bodyRow: { alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.borderDefault },
  rowOn: { backgroundColor: color.bgBrandSubtle },
  placeCell: { flex: 1, minWidth: 200, gap: 2 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shrink: { flexShrink: 1 },
  empty: { paddingVertical: 24 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 14, paddingBottom: 8, alignSelf: 'flex-start' },
  up: { transform: [{ rotate: '-90deg' }] },
});
