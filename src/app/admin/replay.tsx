import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ReplayChart, ReplayLegend, type ReplayDay } from '@/components/admin/charts';
import { AdminPage, Loading } from '@/components/admin/common';
import { AppText, Icon, StageBadge } from '@/components/ui';
import type { IconName } from '@/constants/icons';
import { stageRank } from '@/constants/colors';
import { color, radius } from '@/constants/theme';
import { ApiError, getAdminPlaces, getPlaceDetail, runReplay, type PlaceDetail } from '@/lib/api';
import { addDays, daysBetween, mmdd, people, todayKST, weekday } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/useApi';

type Case = { label: string; placeId: string; from: string; to: string };

// 저장된 사례. 날짜는 화면명세 시연 기준 [검증 예정]
const CASES: Case[] = [{ label: '부캉이 사례', placeId: 'bukhang', from: '2026-09-18', to: '2026-09-24' }];

// A4 과거 사례 재현 (선택 날짜 07시까지 자료만 사용, 부산시만)
export default function Replay() {
  const session = useSession();
  if (!session?.account.can_edit) {
    return (
      <AdminPage>
        <AppText variant="h1">과거 사례 재현</AppText>
        <AppText variant="body" color={color.textSecondary}>
          과거 사례 재현은 부산시 계정만 쓸 수 있습니다.
        </AppText>
      </AdminPage>
    );
  }
  return <ReplayScreen />;
}

function ReplayScreen() {
  const router = useRouter();
  const places = useApi(() => getAdminPlaces(), []);
  const [caseIdx, setCaseIdx] = useState<number | null>(0);
  const [placeId, setPlaceId] = useState(CASES[0].placeId);
  const [selected, setSelected] = useState('2026-09-21');
  const [open, setOpen] = useState<'place' | 'date' | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const c = caseIdx != null ? CASES[caseIdx] : null;
  const from = c?.from ?? addDays(selected, -3);
  const to = c?.to ?? minDate(addDays(selected, 3), addDays(todayKST(), -1));
  const dates = Array.from({ length: daysBetween(from, to) + 1 }, (_, i) => addDays(from, i));

  // 전날 예측까지 쓰려고 하루 앞부터 불러옴. 결과 없는 날은 null
  const results = useApi(
    () =>
      Promise.all(
        [addDays(from, -1), ...dates].map((d) =>
          getPlaceDetail(placeId, { judge_day: d, replay: true }).catch((e) => {
            if (e instanceof ApiError && e.status === 404) return null;
            throw e;
          }),
        ),
      ),
    [placeId, from, to],
  );

  const byDate = new Map<string, PlaceDetail>();
  for (const r of results.data ?? []) if (r) byDate.set(r.meta.judge_day, r);
  const days = buildDays(dates, byDate);
  const limit = [...byDate.values()].find((d) => d.bottleneck?.limit_visitors != null)?.bottleneck?.limit_visitors ?? null;
  const placeName = places.data?.find((p) => p.id === placeId)?.name ?? placeId;
  const sel = byDate.get(selected);
  const missing = dates.filter((d) => !byDate.has(d));

  const run = async (targets: string[]) => {
    setRunError(null);
    try {
      for (const d of targets) {
        setRunning(d);
        await runReplay({ judge_day: d, force: true });
      }
      results.reload();
    } catch (e) {
      setRunError(e instanceof ApiError ? e.detail : '재현을 실행하지 못했습니다.');
    } finally {
      setRunning(null);
    }
  };

  return (
    <AdminPage gap={20}>
      <View style={styles.titleBox}>
        <AppText variant="h1">과거 사례 재현</AppText>
        <AppText variant="bodySm" color={color.textSecondary}>
          날짜를 고르면 그날 07:00까지 있던 자료만으로 판정을 다시 돌려 봅니다. 그 뒤에 들어온 자료는 쓰지 않아요.
        </AppText>
      </View>

      <View style={styles.controls}>
        <Field label="장소">
          <Select
            icon="pin"
            width={280}
            value={placeName}
            open={open === 'place'}
            onToggle={() => setOpen(open === 'place' ? null : 'place')}
            options={(places.data ?? []).map((p) => ({ key: p.id, label: p.name }))}
            onPick={(id) => {
              setPlaceId(id);
              setCaseIdx(null);
              setOpen(null);
            }}
          />
        </Field>
        <Field label="판정 날짜">
          <Select
            icon="calendar"
            width={240}
            value={`${selected.replace(/-/g, '.')} 07:00`}
            open={open === 'date'}
            onToggle={() => setOpen(open === 'date' ? null : 'date')}
            options={dateOptions(selected).map((d) => ({ key: d, label: `${d.replace(/-/g, '.')} (${weekday(d)}) 07:00` }))}
            onPick={(d) => {
              setSelected(d);
              if (c && (d < c.from || d > c.to)) setCaseIdx(null);
              setOpen(null);
            }}
          />
        </Field>
        <Field label="저장된 사례">
          <View style={styles.cases}>
            {CASES.map((k, i) => (
              <Pressable
                key={k.label}
                style={[styles.caseChip, caseIdx === i && styles.caseOn]}
                onPress={() => {
                  setCaseIdx(i);
                  setPlaceId(k.placeId);
                  if (selected < k.from || selected > k.to) setSelected(k.from);
                }}>
                <AppText variant="bodySm" color={caseIdx === i ? color.textPrimary : color.textSecondary}>
                  {k.label} {mmdd(k.from)}~{mmdd(k.to)}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Field>
        <View style={styles.flex} />
        <Pressable style={[styles.runBtn, !!running && styles.disabled]} disabled={!!running} onPress={() => run([selected])}>
          {running ? <ActivityIndicator color={color.textPrimary} /> : <Icon name="play" size={16} />}
          <AppText variant="h3">{running ? `${mmdd(running)} 재현 중…` : '판정 다시 돌리기'}</AppText>
        </Pressable>
      </View>
      {runError && (
        <AppText variant="bodySm" color="#A93320">
          {runError}
        </AppText>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="h2">날짜별 재판정</AppText>
          <ReplayLegend />
        </View>
        {results.loading && <Loading />}
        {results.error && (
          <AppText variant="body" color={color.textSecondary}>
            재현 결과를 불러오지 못했습니다. ({results.error.detail})
          </AppText>
        )}
        {results.data && (
          <ReplayChart days={days} limit={limit} selected={selected} onSelect={setSelected} />
        )}
        {results.data && missing.length > 0 && (
          <Pressable onPress={() => run(missing)} disabled={!!running} style={styles.link}>
            <AppText variant="bodySm" color={color.textLink}>
              재현 결과가 없는 {missing.length}일 모두 돌리기 (날짜마다 몇십 초 걸릴 수 있음)
            </AppText>
          </Pressable>
        )}
      </View>

      <View style={styles.bottom}>
        <View style={styles.summary}>
          <AppText variant="h3">재현 요약</AppText>
          <AppText variant="body">{summaryText(days)}</AppText>
          <View style={styles.infoLine}>
            <Icon name="info" size={16} />
            <AppText variant="caption" color={color.textSecondary}>
              시연용 재현 결과입니다. 실측 비교와 정확도는 검증 후 확정됩니다.
            </AppText>
          </View>
        </View>
        <View style={styles.side}>
          <View style={styles.sideHead}>
            <AppText variant="h3">{mmdd(selected)} 판정 근거</AppText>
            {sel && <StageBadge stage={sel.stage} />}
          </View>
          <AppText variant="bodySm" color={sel ? color.textPrimary : color.textSecondary}>
            {sel ? sel.reason : '이 날짜의 재현 결과가 없습니다. 위에서 판정을 다시 돌려 보세요.'}
          </AppText>
          {sel && (
            <Pressable
              style={styles.linkRow}
              onPress={() => router.push({ pathname: '/admin/place/[id]', params: { id: placeId, judge_day: selected, replay: '1' } })}>
              <AppText variant="bodySm" color={color.textLink}>
                이 날짜로 장소 상세 보기
              </AppText>
              <Icon name="chevronRightSm" size={16} />
            </Pressable>
          )}
        </View>
      </View>
    </AdminPage>
  );
}

function minDate(a: string, b: string) {
  return a < b ? a : b;
}

/** 고른 날짜 앞뒤 2주 (미래 날짜는 서버가 400) */
function dateOptions(center: string) {
  const last = addDays(todayKST(), -1);
  return Array.from({ length: 29 }, (_, i) => addDays(center, i - 14)).filter((d) => d <= last);
}

function buildDays(dates: string[], byDate: Map<string, PlaceDetail>): ReplayDay[] {
  // 실측은 가장 늦은 결과가 가장 많이 가짐 (판정일 전날까지)
  const actual = new Map<string, number>();
  for (const d of byDate.values()) for (const a of d.actual_visitors) actual.set(a.date, a.visitors);

  const days: ReplayDay[] = dates.map((date) => {
    const prev = byDate.get(addDays(date, -1));
    const pred = prev?.forecasts.find((f) => f.date === date) ?? prev?.forecasts.find((f) => f.horizon === 1);
    return {
      date,
      stage: byDate.get(date)?.stage ?? null,
      actual: actual.get(date) ?? null,
      predicted: pred && pred.date === date ? pred.mid : null,
    };
  });

  const firstAlert = days.find((d) => d.stage && stageRank[d.stage] >= 1);
  const firstStage3 = days.find((d) => d.stage === 'stage3');
  const peak = days.reduce<ReplayDay | null>((a, b) => (b.actual != null && (!a || b.actual > (a.actual ?? 0)) ? b : a), null);
  if (firstAlert) firstAlert.note = '첫 경보';
  if (firstStage3 && firstStage3 !== firstAlert) firstStage3.note = '기준 초과 예측';
  if (peak && peak.actual != null) {
    peak.note = peak.note ? `${peak.note} · 실측 최대` : '실측 최대';
    peak.noteDanger = true;
  }
  return days;
}

function summaryText(days: ReplayDay[]) {
  if (!days.some((d) => d.stage)) return '이 기간의 재현 결과가 아직 없습니다.';
  const parts: string[] = [];
  const firstAlert = days.find((d) => d.stage && stageRank[d.stage] >= 1);
  const firstStage3 = days.find((d) => d.stage === 'stage3');
  const peak = days.reduce<ReplayDay | null>((a, b) => (b.actual != null && (!a || b.actual > (a.actual ?? 0)) ? b : a), null);

  if (firstAlert) {
    const lead = peak ? daysBetween(firstAlert.date, peak.date) : 0;
    parts.push(
      peak && lead > 0
        ? `첫 경보는 ${people(peak.actual!)} 명이 몰리기 ${lead}일 전인 ${mmdd(firstAlert.date)} 07:00에 나왔습니다.`
        : `첫 경보는 ${mmdd(firstAlert.date)} 07:00에 나왔습니다.`,
    );
  } else {
    parts.push('이 기간에는 경보가 나오지 않았습니다.');
  }
  if (firstStage3) parts.push(`기준 초과 예측(3단계)은 ${mmdd(firstStage3.date)} 07:00에 나왔습니다.`);

  const pairs = days.filter((d) => d.actual && d.predicted != null);
  if (pairs.length) {
    const err = pairs.reduce((s, d) => s + Math.abs(d.predicted! - d.actual!) / d.actual!, 0) / pairs.length;
    parts.push(
      `다음 날 예측 오차는 ${mmdd(pairs[0].date)}~${mmdd(pairs.at(-1)!.date)} 평균 ±${Math.round(err * 100)}%입니다.`,
    );
  } else {
    parts.push('실측 회신이 없어 예측 오차는 아직 계산할 수 없습니다.');
  }
  return parts.join(' ');
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <AppText variant="caption" color={color.textSecondary}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

type SelectProps = {
  icon: IconName;
  width: number;
  value: string;
  open: boolean;
  onToggle: () => void;
  options: { key: string; label: string }[];
  onPick: (key: string) => void;
};

function Select({ icon, width, value, open, onToggle, options, onPick }: SelectProps) {
  return (
    <View style={[{ width }, open && styles.raise]}>
      <Pressable style={styles.select} onPress={onToggle} accessibilityRole="combobox" accessibilityState={{ expanded: open }}>
        <Icon name={icon} size={18} />
        <AppText variant="body" numberOfLines={1} style={styles.flex}>
          {value}
        </AppText>
        <Icon name="chevronDown" size={18} />
      </Pressable>
      {open && (
        <View style={styles.menu}>
          {options.map((o) => (
            <Pressable key={o.key} style={({ hovered }) => [styles.option, hovered && styles.optionOn]} onPress={() => onPick(o.key)}>
              <AppText variant="bodySm">{o.label}</AppText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titleBox: { gap: 6 },
  controls: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, zIndex: 5 },
  field: { gap: 6 },
  raise: { zIndex: 10 },
  select: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.md,
    backgroundColor: color.bgDefault,
  },
  menu: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 280,
    overflow: 'scroll',
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.md,
    backgroundColor: color.bgDefault,
    boxShadow: '0 8px 24px rgba(27,47,74,0.12)',
  },
  option: { paddingHorizontal: 14, paddingVertical: 10 },
  optionOn: { backgroundColor: color.bgBrandSubtle },
  cases: { flexDirection: 'row', gap: 8 },
  caseChip: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.md,
  },
  caseOn: { backgroundColor: color.bgBrandSubtle, borderColor: color.borderBrand },
  flex: { flex: 1 },
  runBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 20,
    paddingRight: 22,
    borderRadius: radius.md,
    backgroundColor: color.bgBrand,
  },
  disabled: { opacity: 0.6 },
  section: { gap: 16, paddingTop: 24, borderTopWidth: 1, borderTopColor: color.borderDefault },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { alignSelf: 'flex-start' },
  bottom: { flexDirection: 'row', gap: 20 },
  summary: { flex: 1, gap: 16, paddingRight: 24, paddingVertical: 20 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { width: 440, gap: 12, paddingHorizontal: 24, paddingVertical: 20, borderLeftWidth: 1, borderLeftColor: color.borderDefault },
  sideHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
