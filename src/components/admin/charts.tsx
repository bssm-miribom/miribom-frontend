import { useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { AppText, StageBadge } from '@/components/ui';
import { color, font } from '@/constants/theme';
import type { PlaceDetail, Stage } from '@/lib/api';
import { addDays, daysBetween, mmdd, people, weekday } from '@/lib/format';

// 차트 색은 design.md '차트 색' 기준

const LABEL = { fontFamily: font.regular, fontSize: 12 };

/** 1·2·2.5·5 × 10^k 단위로 올린 눈금 간격 */
function niceStep(raw: number) {
  if (raw <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = [1, 2, 2.5, 5, 10].find((s) => s * p >= raw) ?? 10;
  return m * p;
}

function useWidth(initial = 0) {
  const [width, setWidth] = useState(initial);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  return { width, onLayout };
}

// ───────────── 대시보드 표 7일 추이 ─────────────

export function Sparkline({ values, stroke, width = 160, height = 32 }: { values: number[]; stroke: string; width?: number; height?: number }) {
  if (values.length < 2) {
    return (
      <View style={{ width, height, justifyContent: 'center' }}>
        <AppText variant="metric" color={color.textDisabled}>
          —
        </AppText>
      </View>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 4;
  const x = (i: number) => pad + (i * (width - pad * 2)) / (values.length - 1);
  const y = (v: number) => (max === min ? height / 2 : height - pad - ((v - min) / (max - min)) * (height - pad * 2));
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values.length - 1;
  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
      <Circle cx={x(last)} cy={y(values[last])} r={2.5} fill={stroke} />
    </Svg>
  );
}

// ───────────── 장소 상세 추이 그래프 ─────────────

const TREND_H = 300;
const PLOT = { left: 44, right: 34, top: 13, bottom: 251 };

export function TrendChart({ detail }: { detail: PlaceDetail }) {
  const { width, onLayout } = useWidth();
  const judgeDay = detail.meta.judge_day;
  const forecasts = [...detail.forecasts].sort((a, b) => a.horizon - b.horizon);
  const actual = detail.actual_visitors;
  const limit = detail.bottleneck?.limit_visitors ?? null;

  // 날짜 범위: 판정일 7일 전(또는 더 이른 자료)부터 마지막 예측일까지
  const firstDates = [addDays(judgeDay, -7), detail.trend[0]?.date, actual[0]?.date].filter(Boolean) as string[];
  const start = firstDates.sort()[0];
  const end = forecasts.at(-1)?.date ?? addDays(judgeDay, 3);
  const n = daysBetween(start, end) + 1;
  const dates = Array.from({ length: n }, (_, i) => addDays(start, i));

  const plotW = Math.max(0, width - PLOT.left - PLOT.right);
  const plotH = PLOT.bottom - PLOT.top;
  const slot = plotW / n;
  const x = (date: string) => PLOT.left + slot * (daysBetween(start, date) + 0.5);

  const maxV = Math.max(1, ...forecasts.map((f) => f.high), limit ?? 0, ...actual.map((a) => a.visitors));
  const step = niceStep(maxV / 4);
  const yMax = step * 4;
  const y = (v: number) => PLOT.bottom - (v / yMax) * plotH;

  const ratios = detail.trend.map((t) => t.surge_ratio);
  const rStep = Math.max(1, Math.ceil(Math.max(1, ...ratios) / 3));
  const rMax = rStep * 3;
  const yr = (r: number) => PLOT.bottom - (r / rMax) * plotH;

  const judgeX = x(judgeDay);
  const limitPerM2 = detail.bottleneck?.limit_per_m2 ?? 5;
  const peakActual = actual.reduce<(typeof actual)[number] | null>((a, b) => (!a || b.visitors > a.visitors ? b : a), null);
  const tickEvery = Math.max(1, Math.ceil(n / 5));

  return (
    <View onLayout={onLayout} style={{ height: TREND_H }}>
      {width > 0 && (
        <Svg width={width} height={TREND_H}>
          {/* 예측 구간 배경 */}
          <Rect x={judgeX} y={PLOT.top - 8} width={PLOT.left + plotW - judgeX} height={plotH + 8} fill={color.chartRange} />

          {/* 왼쪽 축 (방문객) */}
          {[0, 1, 2, 3, 4].map((i) => (
            <G key={i}>
              <Line x1={PLOT.left} x2={PLOT.left + plotW} y1={y(step * i)} y2={y(step * i)} stroke={color.borderDefault} strokeWidth={1} />
              <SvgText {...LABEL} x={PLOT.left - 6} y={y(step * i) + 4} fill={color.textSecondary} textAnchor="end">
                {i === 0 ? '0' : people(step * i)}
              </SvgText>
            </G>
          ))}
          {/* 오른쪽 축 (검색 급증 배수) */}
          {[1, 2, 3].map((i) => (
            <SvgText key={i} {...LABEL} x={PLOT.left + plotW + 8} y={yr(rStep * i) + 4} fill={color.chartSearch}>
              {`×${rStep * i}`}
            </SvgText>
          ))}

          {/* 예측 범위 */}
          {forecasts.length > 1 && (
            <Polygon
              points={[
                ...forecasts.map((f) => `${x(f.date)},${y(f.high)}`),
                ...[...forecasts].reverse().map((f) => `${x(f.date)},${y(f.low)}`),
              ].join(' ')}
              fill={color.bgBrand}
              opacity={0.8}
            />
          )}

          {/* 병목 기준선 */}
          {limit != null && (
            <G>
              <Line x1={PLOT.left} x2={PLOT.left + plotW} y1={y(limit)} y2={y(limit)} stroke={color.chartThreshold} strokeWidth={1.5} />
              <SvgText {...LABEL} x={PLOT.left + 8} y={y(limit) - 6} fill={color.chartThreshold}>
                {`병목 기준 ${limitPerM2}명/㎡ ≈ ${people(limit)} 명`}
              </SvgText>
            </G>
          )}

          {/* 실측 방문객 */}
          {actual.map((a) => (
            <Rect key={a.date} x={x(a.date) - 7} y={y(a.visitors)} width={14} height={Math.max(1, PLOT.bottom - y(a.visitors))} rx={2} fill={color.chartActual} />
          ))}
          {peakActual && (
            <SvgText {...LABEL} x={x(peakActual.date)} y={y(peakActual.visitors) - 6} fill={color.textPrimary} textAnchor="middle">
              {people(peakActual.visitors)}
            </SvgText>
          )}

          {/* 검색 급증 배수 */}
          {detail.trend.length > 1 && (
            <Path
              d={detail.trend.map((t, i) => `${i ? 'L' : 'M'}${x(t.date).toFixed(1)},${yr(t.surge_ratio).toFixed(1)}`).join(' ')}
              stroke={color.chartSearch}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
            />
          )}

          {/* 예측 중앙값 */}
          {forecasts.length > 1 && (
            <Path
              d={forecasts.map((f, i) => `${i ? 'L' : 'M'}${x(f.date)},${y(f.mid)}`).join(' ')}
              stroke={color.chartActual}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              fill="none"
            />
          )}
          {forecasts.map((f) => {
            const over = f.density_mid != null && f.density_mid > limitPerM2;
            return (
              <G key={f.date}>
                <Circle cx={x(f.date)} cy={y(f.mid)} r={4.5} fill={color.bgDefault} stroke={color.chartActual} strokeWidth={1.5} />
                <SvgText
                  {...LABEL}
                  x={x(f.date)}
                  y={y(f.mid) + 20 > PLOT.bottom - 2 ? y(f.mid) - 10 : y(f.mid) + 20}
                  fill={over ? color.chartThreshold : color.textPrimary}
                  textAnchor="middle">
                  {people(f.mid)}
                </SvgText>
              </G>
            );
          })}

          {/* 판정 시점 */}
          <Line x1={judgeX} x2={judgeX} y1={PLOT.top - 12} y2={PLOT.bottom} stroke={color.chartActual} strokeWidth={1.5} />
          <Rect x={judgeX - 106} y={0} width={100} height={20} rx={8} fill={color.bgInverse} />
          <SvgText {...LABEL} x={judgeX - 56} y={14} fill={color.textInverse} textAnchor="middle">
            {`${mmdd(judgeDay)} 07:00 판정`}
          </SvgText>
          <SvgText {...LABEL} x={judgeX + 10} y={18} fill={color.textPrimary}>
            예측
          </SvgText>

          {/* 날짜 축 */}
          {dates.map((d, i) =>
            d === judgeDay ||
            i === n - 1 ||
            (i % tickEvery === 0 && Math.abs(daysBetween(judgeDay, d)) > 1 && n - 1 - i > 1) ? (
              <SvgText key={d} {...LABEL} x={x(d)} y={PLOT.bottom + 22} fill={color.textSecondary} textAnchor="middle">
                {mmdd(d)}
              </SvgText>
            ) : null,
          )}
        </Svg>
      )}
    </View>
  );
}

/** 추이 그래프 범례 */
export function TrendLegend() {
  return (
    <View style={styles.legend}>
      <LegendItem label="검색 급증 배수 (우)">
        <Line x1={0} x2={16} y1={5} y2={5} stroke={color.chartSearch} strokeWidth={2} />
      </LegendItem>
      <LegendItem label="실측 방문객" w={8}>
        <Rect width={8} height={10} rx={2} fill={color.chartActual} />
      </LegendItem>
      <LegendItem label="예측 중앙값">
        <Line x1={0} x2={16} y1={5} y2={5} stroke={color.chartActual} strokeWidth={1.5} strokeDasharray="3 2" />
      </LegendItem>
      <LegendItem label="예측 범위" w={14}>
        <Rect width={14} height={10} rx={2} fill={color.bgBrand} opacity={0.8} />
      </LegendItem>
      <LegendItem label="병목 기준선">
        <Line x1={0} x2={16} y1={5} y2={5} stroke={color.chartThreshold} strokeWidth={1.5} />
      </LegendItem>
    </View>
  );
}

function LegendItem({ label, w = 16, children }: { label: string; w?: number; children: React.ReactNode }) {
  return (
    <View style={styles.legendItem}>
      <Svg width={w} height={10}>
        {children}
      </Svg>
      <AppText variant="caption" color={color.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

// ───────────── 과거 사례 재현 타임라인 ─────────────

export type ReplayDay = {
  date: string;
  stage: Stage | null;
  actual: number | null;
  /** 전날 07:00 판정의 다음 날 예측 중앙값 */
  predicted: number | null;
  note?: string;
  noteDanger?: boolean;
};

const R = { top: 24, bottom: 244, left: 52 };

export function ReplayChart({ days, limit, selected, onSelect }: { days: ReplayDay[]; limit: number | null; selected: string; onSelect: (d: string) => void }) {
  const { width, onLayout } = useWidth();
  const n = days.length;
  const plotW = Math.max(0, width - R.left);
  const col = n ? plotW / n : 0;
  const cx = (i: number) => R.left + col * (i + 0.5);

  const maxV = Math.max(1, limit ?? 0, ...days.map((d) => Math.max(d.actual ?? 0, d.predicted ?? 0)));
  const yMax = niceStep(maxV);
  const y = (v: number) => R.bottom - (v / yMax) * (R.bottom - R.top);
  const pred = days.map((d, i) => (d.predicted != null ? { i, v: d.predicted } : null)).filter(Boolean) as { i: number; v: number }[];

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <>
          {/* 선택한 날 강조 */}
          {days.map((d, i) =>
            d.date === selected ? <View key={d.date} style={[styles.selected, { left: R.left + col * i + 8, width: col - 16 }]} /> : null,
          )}
          <Svg width={width} height={R.bottom + 1} style={styles.front}>
            <Line x1={R.left} x2={width} y1={R.bottom} y2={R.bottom} stroke={color.borderDefault} />
            <SvgText {...LABEL} x={0} y={R.bottom + 4} fill={color.textSecondary}>
              0
            </SvgText>
            <Line x1={R.left} x2={width} y1={R.top} y2={R.top} stroke={color.borderDefault} />
            <SvgText {...LABEL} x={0} y={R.top + 4} fill={color.textSecondary}>
              {people(yMax)}
            </SvgText>
            {limit != null && (
              <G>
                <Line x1={R.left} x2={width} y1={y(limit)} y2={y(limit)} stroke={color.chartThreshold} strokeWidth={1.5} />
                <SvgText {...LABEL} x={0} y={y(limit) + 4} fill={color.chartThreshold}>
                  {people(limit)}
                </SvgText>
                <SvgText {...LABEL} x={R.left + 8} y={y(limit) - 8} fill={color.chartThreshold}>
                  {`병목 기준 ${people(limit)} 명`}
                </SvgText>
              </G>
            )}
            {days.map((d, i) =>
              d.actual != null ? (
                <G key={d.date}>
                  <Rect x={cx(i) - 14} y={y(d.actual)} width={28} height={Math.max(1, R.bottom - y(d.actual))} rx={4} fill={color.chartActual} />
                  <SvgText
                    {...LABEL}
                    x={cx(i) - 18}
                    y={y(d.actual) + 12}
                    fill={limit != null && d.actual > limit ? '#A93320' : color.textPrimary}
                    textAnchor="end">
                    {people(d.actual)}
                  </SvgText>
                </G>
              ) : null,
            )}
            {pred.length > 1 && (
              <Path
                d={pred.map((p, k) => `${k ? 'L' : 'M'}${cx(p.i)},${y(p.v)}`).join(' ')}
                stroke={color.chartSearch}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                fill="none"
              />
            )}
            {pred.map((p) => (
              <G key={p.i}>
                <Circle cx={cx(p.i)} cy={y(p.v)} r={5} fill={color.bgDefault} stroke={color.chartSearch} strokeWidth={2} />
                <SvgText {...LABEL} x={cx(p.i) + 10} y={y(p.v) - 8} fill={color.textLink}>
                  {`예측 ${people(p.v)}`}
                </SvgText>
              </G>
            ))}
          </Svg>
          <View style={[styles.replayCols, styles.front, { marginLeft: R.left }]}>
            {days.map((d) => (
              <Pressable key={d.date} style={styles.replayCol} onPress={() => onSelect(d.date)} accessibilityRole="button">
                <AppText
                  variant={d.date === selected ? 'label' : 'bodySm'}
                  style={d.date === selected ? styles.selectedLabel : undefined}>
                  {mmdd(d.date)} {weekday(d.date)}
                </AppText>
                {d.stage ? (
                  <StageBadge stage={d.stage} />
                ) : (
                  <AppText variant="caption" color={color.textDisabled}>
                    결과 없음
                  </AppText>
                )}
                {d.note ? (
                  <AppText variant="caption" color={d.noteDanger ? '#A93320' : color.textSecondary} align="center">
                    {d.note}
                  </AppText>
                ) : null}
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

export function ReplayLegend() {
  return (
    <View style={[styles.legend, { gap: 20 }]}>
      <LegendItem label="실측 방문객" w={10}>
        <Rect width={10} height={10} rx={2} fill={color.chartActual} />
      </LegendItem>
      <LegendItem label="전날 07:00 예측" w={22}>
        <Line x1={0} x2={22} y1={5} y2={5} stroke={color.chartSearch} strokeWidth={1.5} strokeDasharray="3 2" />
        <Circle cx={11} cy={5} r={3.5} fill={color.bgDefault} stroke={color.chartSearch} strokeWidth={1.5} />
      </LegendItem>
      <LegendItem label="병목 기준" w={20}>
        <Line x1={0} x2={20} y1={5} y2={5} stroke={color.chartThreshold} strokeWidth={1.5} />
      </LegendItem>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selected: { position: 'absolute', top: 0, bottom: 0, backgroundColor: color.bgBrandSubtle, borderRadius: 8 },
  replayCols: { flexDirection: 'row', paddingTop: 12, paddingBottom: 12 },
  replayCol: { flex: 1, alignItems: 'center', gap: 8 },
  selectedLabel: { lineHeight: 20 },
  // 선택한 날 강조 배경보다 위에 그림
  front: { position: 'relative', zIndex: 1 },
});
