import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { color } from '@/constants/theme';
import type { ApiError, Forecast, PlaceDetail } from '@/lib/api';

/** 관리자 본문 틀 (좌우 40, 위아래 32) */
export function AdminPage({ children, gap = 24 }: { children: ReactNode; gap?: number }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.page, { gap }]}>
      {children}
    </ScrollView>
  );
}

export function Loading() {
  return <ActivityIndicator color={color.textLink} style={styles.loading} />;
}

/** 오류 안내. 404면 결과 없음 문구 */
export function ErrorView({ error, notFound, onRetry }: { error: ApiError; notFound?: string; onRetry?: () => void }) {
  const text =
    error.status === 404 && notFound
      ? notFound
      : error.status === 403
        ? '이 계정으로는 볼 수 없는 화면입니다.'
        : error.status === 0
          ? '서버에 연결할 수 없습니다.'
          : error.detail;
  return (
    <View style={styles.error}>
      <AppText variant="body" color={color.textSecondary}>
        {text}
      </AppText>
      {onRetry && error.status !== 404 && error.status !== 403 && (
        <Pressable onPress={onRetry}>
          <AppText variant="bodySm" color={color.textLink}>
            다시 시도
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

/** 예측 범위 상단 밀집도가 기준을 처음 넘는 날 (2단계 기준과 같음) */
export function firstOverDay(detail: Pick<PlaceDetail, 'forecasts' | 'bottleneck'>): Forecast | null {
  const limit = detail.bottleneck?.limit_per_m2 ?? 5;
  return (
    [...detail.forecasts]
      .sort((a, b) => a.horizon - b.horizon)
      .find((f) => f.density_high != null && f.density_high > limit) ?? null
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: color.bgDefault },
  page: { paddingHorizontal: 40, paddingVertical: 32 },
  loading: { paddingVertical: 48 },
  error: { paddingVertical: 32, gap: 8 },
});
