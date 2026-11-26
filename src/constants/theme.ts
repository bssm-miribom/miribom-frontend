import type { TextStyle } from 'react-native';

// Figma '미리봄' 디자인 변수 기준 (color/*, radius/*, 미리봄/* 글자 스타일)

export const color = {
  textPrimary: '#1B2F4A',
  textSecondary: '#5A6B80',
  textDisabled: '#8A96A3',
  textInverse: '#FFFFFF',
  textLink: '#1F6FA3',

  bgDefault: '#FFFFFF',
  bgSubtle: '#F6F8FA',
  bgMuted: '#EEF1F4',
  bgInverse: '#1B2F4A',
  bgBrand: '#A6D8F4',
  bgBrandSubtle: '#EAF5FC',

  borderDefault: '#DDE3E9',
  borderStrong: '#1B2F4A',
  borderBrand: '#A6D8F4',

  chartSearch: '#5BAEE0',
  chartActual: '#1B2F4A',
  chartRange: '#EAF5FC',
  chartThreshold: '#E0533D',

  badgeNewBg: '#E2F4BF',
  badgeNewText: '#3F6212',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, full: 999 } as const;

export const font = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  titleSemibold: 'Paperlogy-SemiBold',
  titleBold: 'Paperlogy-Bold',
} as const;

// 자간 -1% = 크기 × -0.01
const t = (fontFamily: string, fontSize: number, lineHeight: number, spacing = -0.01): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing: +(fontSize * spacing).toFixed(2),
});

export const type = {
  display: t(font.titleBold, 32, 42),
  h1: t(font.titleBold, 28, 36),
  h2: t(font.titleSemibold, 20, 28),
  h3: t(font.bold, 16, 24),
  body: t(font.regular, 15, 24),
  bodySm: t(font.regular, 13, 20),
  caption: t(font.regular, 12, 16),
  label: t(font.medium, 11, 16, 0.08),
  metric: { ...t(font.medium, 14, 20, 0), fontVariant: ['tabular-nums'] },
  metricLg: { ...t(font.semibold, 28, 32, 0), fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const fontFiles = {
  [font.regular]: require('../../assets/fonts/Pretendard-Regular.otf'),
  [font.medium]: require('../../assets/fonts/Pretendard-Medium.otf'),
  [font.semibold]: require('../../assets/fonts/Pretendard-SemiBold.otf'),
  [font.bold]: require('../../assets/fonts/Pretendard-Bold.otf'),
  [font.titleSemibold]: require('../../assets/fonts/Paperlogy-6SemiBold.ttf'),
  [font.titleBold]: require('../../assets/fonts/Paperlogy-7Bold.ttf'),
};
