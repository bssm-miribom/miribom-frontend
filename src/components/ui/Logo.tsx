import { StyleSheet, View } from 'react-native';

import { Icon } from './Icon';

// Figma logo 컴포넌트: 망원경 심볼 + '미리봄' 워드마크 겹침. 크기는 심볼 높이 기준 (시민 24, 사이드바 28, 로그인 40)
const SYMBOL = { w: 25.256, h: 24 };
const WORDMARK = { w: 53.003, h: 17.968, left: 28.8, top: 3.2 };

export function Logo({ height = 24 }: { height?: number }) {
  const k = height / SYMBOL.h;
  return (
    <View style={{ width: (WORDMARK.left + WORDMARK.w) * k, height }} accessibilityRole="image" accessibilityLabel="미리봄">
      <Icon name="logoSymbol" width={SYMBOL.w * k} height={SYMBOL.h * k} style={styles.abs} />
      <Icon
        name="logoWordmark"
        width={WORDMARK.w * k}
        height={WORDMARK.h * k}
        style={[styles.abs, { left: WORDMARK.left * k, top: WORDMARK.top * k }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({ abs: { position: 'absolute', left: 0, top: 0 } });
