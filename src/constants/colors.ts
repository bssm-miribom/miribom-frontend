import type { Crowd, Stage } from '@/lib/api';

// 경보 단계·시민 혼잡 색. Figma color/level-*, color/crowd-* 기준. 키는 API 값 그대로

export type Tone = { bg: string; fill: string; text: string };

const hold: Tone = { bg: '#EEF1F4', fill: '#8A96A3', text: '#4B5867' };

export const stageTone: Record<Stage, Tone> = {
  normal: hold,
  stage1: { bg: '#E3F5F2', fill: '#4FBFAE', text: '#1F7F72' },
  stage2: { bg: '#FCEFD2', fill: '#F2B33D', text: '#8A5A00' },
  stage3: { bg: '#FBE4DF', fill: '#E0533D', text: '#A93320' },
  pending: hold,
  failed: hold,
};

/** 배지에 쓰는 짧은 이름 */
export const stageLabel: Record<Stage, string> = {
  normal: '평상',
  stage1: '1단계',
  stage2: '2단계',
  stage3: '3단계',
  pending: '판정 보류',
  failed: '수집 실패',
};

/** 관심·주의·경계 (design.md 보이스) */
export const stageName: Record<Stage, string> = {
  normal: '평상',
  stage1: '1단계 관심',
  stage2: '2단계 주의',
  stage3: '3단계 경계',
  pending: '판정 보류',
  failed: '수집 실패',
};

export const stageRank: Record<Stage, number> = {
  failed: -1,
  normal: 0,
  pending: 0,
  stage1: 1,
  stage2: 2,
  stage3: 3,
};

type CrowdKey = NonNullable<Crowd> | 'none';

export const crowdTone: Record<CrowdKey, Tone> = {
  free: { bg: '#EAF5FC', fill: '#A6D8F4', text: '#1F6FA3' },
  normal: { bg: '#EEF1F4', fill: '#A6D8F4', text: '#4B5867' },
  busy: { bg: '#FCEFD2', fill: '#F2B33D', text: '#8A5A00' },
  very_busy: { bg: '#FBE4DF', fill: '#E0533D', text: '#A93320' },
  /** crowd가 null(예보 준비 중)일 때 */
  none: { bg: '#EEF1F4', fill: '#EEF1F4', text: '#4B5867' },
};

export const crowdRank: Record<CrowdKey, number> = { none: -1, free: 0, normal: 1, busy: 2, very_busy: 3 };

export function crowdKey(crowd: Crowd): CrowdKey {
  return crowd ?? 'none';
}
