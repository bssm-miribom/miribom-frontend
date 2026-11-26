import { usePathname, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, Logo } from '@/components/ui';
import type { IconName } from '@/constants/icons';
import { color, radius } from '@/constants/theme';
import { getPlaceDetail, logout } from '@/lib/api';
import { usePref } from '@/lib/prefs';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/useApi';

type NavItem = { label: string; href: Href; on: IconName; off: IconName; match: (p: string) => boolean; cityOnly?: boolean };

const NAV: NavItem[] = [
  {
    label: '경보 대시보드',
    href: '/admin',
    on: 'navDashboardOn',
    off: 'navDashboardOff',
    match: (p) => p === '/admin' || p.startsWith('/admin/place'),
  },
  {
    label: '과거 사례 재현',
    href: '/admin/replay',
    on: 'navReplayOn',
    off: 'navReplayOff',
    match: (p) => p.startsWith('/admin/replay'),
    cityOnly: true,
  },
  // 별칭 등록은 대시보드 위 창으로 엶
  { label: '별칭 등록', href: '/admin?alias=1', on: 'navAliasOff', off: 'navAliasOff', match: () => false, cityOnly: true },
];

export const SIDEBAR_WIDTH = 232;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const account = session?.account;
  const favorites = usePref('favoritePlaces');

  const onLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  return (
    <View style={styles.bar}>
      <View style={styles.logoArea} />
      <View style={styles.brand}>
        <Logo height={28} />
        <AppText variant="label" color={color.bgBrand}>
          BEYOND ONLINE MONITORING
        </AppText>
      </View>

      <View style={styles.nav}>
        {NAV.filter((n) => !n.cityOnly || account?.can_edit).map((item) => {
          const active = item.match(pathname);
          return (
            <Pressable
              key={item.label}
              onPress={() => router.navigate(item.href)}
              style={({ hovered }) => [styles.navItem, (active || hovered) && styles.navActive]}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}>
              <Icon name={active ? item.on : item.off} size={20} />
              <AppText variant="body" color={active ? color.textPrimary : color.textSecondary}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {favorites.length > 0 && (
        <View style={styles.favorites}>
          <AppText variant="caption" color={color.textSecondary}>
            즐겨찾기 장소
          </AppText>
          {favorites.map((id) => (
            <FavoriteLink key={id} id={id} onPress={() => router.navigate({ pathname: '/admin/place/[id]', params: { id } })} />
          ))}
        </View>
      )}

      <View style={styles.flex} />

      {account && (
        <View style={styles.account}>
          <View style={styles.avatar}>
            <AppText variant="h3">{account.org_name.slice(0, 1)}</AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="bodySm" numberOfLines={1}>
              {account.username}
            </AppText>
            <AppText variant="caption" color={color.textSecondary} numberOfLines={1}>
              {account.org_name}
            </AppText>
          </View>
          <Pressable onPress={onLogout} accessibilityRole="button" accessibilityLabel="로그아웃" hitSlop={8}>
            <Icon name="logout" size={18} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function FavoriteLink({ id, onPress }: { id: string; onPress: () => void }) {
  // 이름만 필요해서 상세를 한 번 불러옴 (관할 밖이면 숨김)
  const { data, error } = useApi(() => getPlaceDetail(id), [id]);
  if (error) return null;
  return (
    <Pressable style={({ hovered }) => [styles.favorite, hovered && styles.navActive]} onPress={onPress}>
      <AppText variant="bodySm" numberOfLines={1}>
        {data?.place.name ?? '…'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: SIDEBAR_WIDTH,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: color.bgSubtle,
    borderRightWidth: 1,
    borderRightColor: color.borderDefault,
  },
  logoArea: { position: 'absolute', left: 0, top: 0, width: SIDEBAR_WIDTH, height: 104, backgroundColor: color.bgInverse },
  brand: { gap: 6, paddingLeft: 8, paddingBottom: 36 },
  nav: { gap: 4 },
  navItem: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, paddingRight: 8, borderRadius: radius.md },
  navActive: { backgroundColor: color.bgBrandSubtle },
  favorites: { paddingTop: 28, gap: 4 },
  favorite: { height: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.md },
  flex: { flex: 1 },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: color.borderDefault,
    borderRadius: radius.lg,
    backgroundColor: color.bgDefault,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: color.bgBrand, alignItems: 'center', justifyContent: 'center' },
});
