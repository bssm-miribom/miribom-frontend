import { Text, type TextProps } from 'react-native';

import { color as palette, type as typeScale, type TypeVariant } from '@/constants/theme';

type Props = TextProps & { variant?: TypeVariant; color?: string; align?: 'left' | 'center' | 'right' };

/** 디자인 글자 스타일(미리봄/*)을 쓰는 Text */
export function AppText({ variant = 'body', color = palette.textPrimary, align, style, ...rest }: Props) {
  return <Text {...rest} style={[typeScale[variant], { color }, align && { textAlign: align }, style]} />;
}
