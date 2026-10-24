// 화면 명세서 1. 공통 규칙 기준
export const alertStageColor = {
  1: '#F5C518', // 급상승 후보
  2: '#F28C28', // 사전 대비
  3: '#E03131', // 대응 필요
  hold: '#9AA0A6', // 판정 보류
} as const;

export const crowdColor = {
  여유: '#2F9E44',
  보통: '#F5C518',
  붐빔: '#F28C28',
  '매우 붐빔': '#E03131',
} as const;

export type CrowdLevel = keyof typeof crowdColor;
