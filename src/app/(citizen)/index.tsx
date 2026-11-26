import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CitizenFrame } from '@/components/citizen/CitizenFrame';
import { ReplayBanner } from '@/components/citizen/ReplayBanner';
import { LogoButton } from '@/components/LogoButton';
import { AppText, CrowdBadge, Icon } from '@/components/ui';
import { color, radius, type } from '@/constants/theme';
import { searchPlaces, type PlaceSearchResult } from '@/lib/api';
import { mmdd } from '@/lib/format';
import { pushPref, usePref } from '@/lib/prefs';
import { useReplayDay } from '@/lib/replayDay';
import { useApi } from '@/lib/useApi';

// C1 장소 검색 (시민 첫 화면, 로그인 없음)
export default function PlaceSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const recent = usePref('recentSearches');
  const replayDay = useReplayDay();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // 검색어가 비면 전체 장소(가나다순)를 '장소 둘러보기'로 보여줌
  const all = useApi(() => searchPlaces('', replayDay), [replayDay]);
  const results = useApi(() => (debounced ? searchPlaces(debounced, replayDay) : Promise.resolve(null)), [debounced, replayDay]);

  const open = (place: PlaceSearchResult) => {
    if (debounced) pushPref('recentSearches', debounced);
    router.push({ pathname: '/place/[id]', params: { id: place.id } });
  };

  return (
    <CitizenFrame
      headerBg={color.bgInverse}
      header={
        <View style={styles.appBar}>
          <StatusBar style="light" />
          <LogoButton />
          <AppText variant="caption" color={color.bgBrand}>
            부산 혼잡 예보
          </AppText>
        </View>
      }>
      <View style={styles.hero}>
        <AppText variant="h1">{'가려는 곳,\n붐비는지 미리 보세요'}</AppText>
        <View style={styles.searchGroup}>
          <View style={styles.searchBox}>
            <Icon name="search" size={20} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="장소 이름이나 별칭 (예: 부캉이)"
              placeholderTextColor={color.textDisabled}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="장소 검색"
            />
            {query.length > 0 && (
              <Pressable style={styles.clear} onPress={() => setQuery('')} accessibilityLabel="검색어 지우기" hitSlop={10}>
                <Icon name="clear" size={14} />
              </Pressable>
            )}
          </View>
          <AppText variant="caption" color={color.textSecondary}>
            장소 이름이나 별칭으로 찾을 수 있어요
          </AppText>
        </View>
        <ReplayBanner showEntry />
      </View>

      {debounced !== '' && (
        <View style={styles.section}>
          {results.loading ? (
            <ActivityIndicator color={color.textLink} style={styles.loader} />
          ) : results.error ? (
            <AppText variant="bodySm" color={color.textSecondary}>
              검색하지 못했어요. 잠시 후 다시 시도해 주세요.
            </AppText>
          ) : (
            <>
              <AppText variant="caption" color={color.textSecondary}>
                검색 결과 {results.data?.length ?? 0}
              </AppText>
              {results.data?.length === 0 && (
                <AppText variant="bodySm" color={color.textSecondary}>
                  &apos;{debounced}&apos;(으)로 찾은 장소가 없어요. 다른 이름이나 별칭으로 찾아보세요.
                </AppText>
              )}
              {results.data?.map((place) => (
                <ResultCard key={place.id} place={place} onPress={() => open(place)} />
              ))}
            </>
          )}
        </View>
      )}

      {recent.length > 0 && (
        <View style={[styles.section, styles.recent]}>
          <AppText variant="caption" color={color.textSecondary}>
            최근 검색
          </AppText>
          <View style={styles.chips}>
            {recent.map((word) => (
              <Pressable key={word} style={styles.chip} onPress={() => setQuery(word)}>
                <AppText variant="bodySm">{word}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {debounced === '' && (
        <View style={styles.list}>
          <View style={styles.listHead}>
            <AppText variant="h3">장소 둘러보기</AppText>
            <AppText variant="caption" color={color.textSecondary}>
              {all.data?.[0] && replayDay ? `${mmdd(all.data[0].tomorrow.date)} 기준` : '내일 기준'}
            </AppText>
          </View>
          {all.loading && <ActivityIndicator color={color.textLink} style={styles.loader} />}
          {all.error && (
            <AppText variant="bodySm" color={color.textSecondary} style={styles.listEmpty}>
              {replayDay && all.error.status === 404
                ? '이 날짜의 재현 결과가 아직 없어요. 관리자 화면의 과거 사례 재현에서 먼저 돌려 주세요.'
                : '장소를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'}
            </AppText>
          )}
          {all.data?.map((place) => (
            <Pressable key={place.id} style={styles.row} onPress={() => open(place)}>
              <View style={styles.rowLeft}>
                <Icon name="pin" size={18} />
                <AppText variant="body" numberOfLines={1} style={styles.shrink}>
                  {place.name}
                </AppText>
                <AppText variant="caption" color={color.textSecondary}>
                  {place.district}
                </AppText>
              </View>
              <CrowdBadge crowd={place.tomorrow.crowd} label={place.tomorrow.label} />
            </Pressable>
          ))}
        </View>
      )}
    </CitizenFrame>
  );
}

function ResultCard({ place, onPress }: { place: PlaceSearchResult; onPress: () => void }) {
  const replayDay = useReplayDay();
  const sub = place.matched_alias
    ? `부산 ${place.district}, '${place.matched_alias}'로 검색됨`
    : `부산 ${place.district}`;
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.cardText}>
        <AppText variant="h3" numberOfLines={1}>
          {place.name}
        </AppText>
        <AppText variant="caption" color={color.textSecondary} numberOfLines={1}>
          {sub}
        </AppText>
      </View>
      <CrowdBadge crowd={place.tomorrow.crowd} label={`${replayDay ? mmdd(place.tomorrow.date) : '내일'} ${place.tomorrow.label}`} />
      <Icon name="chevronRight" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  appBar: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.bgInverse,
    zIndex: 1,
  },
  hero: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 8, gap: 20 },
  searchGroup: { gap: 8 },
  searchBox: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 14,
    borderWidth: 2,
    borderColor: color.borderBrand,
    borderRadius: radius.md,
    backgroundColor: color.bgDefault,
  },
  searchInput: { ...type.body, flex: 1, color: color.textPrimary, height: '100%', outlineStyle: 'none' } as object,
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { paddingTop: 20, paddingHorizontal: 20, gap: 10 },
  recent: { paddingTop: 24 },
  loader: { paddingVertical: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.lg,
    backgroundColor: color.bgDefault,
  },
  cardText: { flex: 1, gap: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.full,
  },
  list: { paddingTop: 28, paddingHorizontal: 20, paddingBottom: 24 },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 },
  listEmpty: { paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: color.borderDefault,
  },
  rowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  shrink: { flexShrink: 1 },
});
