import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText, Logo } from '@/components/ui';
import { color, radius } from '@/constants/theme';
import { getSession } from '@/lib/session';

// 이 너비 미만이면 모바일로 봄 (관리자 대시보드는 데스크톱 전용)
const DESKTOP_MIN_WIDTH = 1024;

/** 로고: 데스크톱이면 관리자 화면으로, 모바일이면 미지원 안내. 실제 접근 제어는 로그인 토큰 */
export function LogoButton({ height = 24 }: { height?: number }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [notice, setNotice] = useState(false);
  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_MIN_WIDTH;

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(false), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const onPress = () => {
    if (!isDesktop) {
      setNotice(true);
      return;
    }
    router.push(getSession() ? '/admin' : '/admin/login');
  };

  return (
    <View>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="미리봄 로고">
        <Logo height={height} />
      </Pressable>
      {notice && (
        <View style={styles.notice}>
          <AppText variant="caption" color={color.textInverse}>
            지원하지 않는 페이지 입니다
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: '#A93320',
    zIndex: 10,
  },
});
