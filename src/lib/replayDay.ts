import { setPref, usePref } from './prefs';

// 시연용 과거 날짜 보기. 오늘 판정이 모두 '여유'일 때 경보가 실제로 났던 날을 보여 주려고 씀.
// 그날 07:00까지 있던 실제 자료로 다시 돌린 '재현' 결과만 보여 줌 (가짜 값 아님). 서버에 재현 결과가 있어야 함
export const DEMO_CASE = { day: '2026-09-21', label: '부캉이 사례', place: '북항친수공원' } as const;

/** 지금 고른 과거 날짜 (없으면 undefined = 오늘 예보) */
export function useReplayDay(): string | undefined {
  return usePref('replayDay')[0];
}

export function setReplayDay(day: string | null) {
  setPref('replayDay', day ? [day] : []);
}
