import type { Crowd, Stage } from '@/lib/api';

// 화면 명세서 1. 공통 규칙 기준. 키는 API 값 그대로
export const stageColor: Record<Stage, string> = {
  normal: '#CED4DA',
  stage1: '#F5C518', // 급상승 후보
  stage2: '#F28C28', // 사전 대비
  stage3: '#E03131', // 대응 필요
  pending: '#9AA0A6', // 판정 보류
  failed: '#9AA0A6', // 수집 실패
};

export const stageLabel: Record<Stage, string> = {
  normal: '평상',
  stage1: '1단계 급상승 후보',
  stage2: '2단계 사전 대비',
  stage3: '3단계 대응 필요',
  pending: '판정 보류',
  failed: '수집 실패',
};

export const crowdColor: Record<NonNullable<Crowd>, string> = {
  free: '#2F9E44',
  normal: '#F5C518',
  busy: '#F28C28',
  very_busy: '#E03131',
};

/** crowd가 null(예보 준비 중)일 때 */
export const crowdPendingColor = '#9AA0A6';
