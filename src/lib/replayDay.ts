import type { ViewQuery } from './api/citizen';
import { setPref, usePref } from './prefs';

// 시연용 보기 두 가지 (브라우저에 저장, 하나만 켜짐)
// 1) 과거 날짜 재현: 그날 07:00까지 있던 실제 자료로 다시 돌린 결과 (가짜 값 아님)
// 2) 가상 시나리오: 실제 데이터 아님. 검색 증가 = 방문 증가 가정으로 위험 단계를 보여 줌 (관리자가 먼저 만들어 둬야 함)
export const DEMO_CASE = { day: '2026-09-21', label: '부캉이 사례', place: '북항친수공원' } as const;
export const DEMO_SCENARIO = { key: '2026-09-21_bukhang_x1', label: '가상 시나리오: 북항 위험' } as const;

/** 지금 고른 과거 날짜 (없으면 undefined) */
export function useReplayDay(): string | undefined {
  return usePref('replayDay')[0];
}

/** 지금 고른 가상 시나리오 키 (없으면 undefined) */
export function useScenarioKey(): string | undefined {
  return usePref('scenarioKey')[0];
}

/** 시민 API에 붙일 보기 조건 */
export function useView(): ViewQuery {
  const replayDay = useReplayDay();
  const scenario = useScenarioKey();
  return scenario ? { scenario } : replayDay ? { replay_day: replayDay } : {};
}

export function setReplayDay(day: string | null) {
  setPref('scenarioKey', []);
  setPref('replayDay', day ? [day] : []);
}

export function setScenarioKey(key: string | null) {
  setPref('replayDay', []);
  setPref('scenarioKey', key ? [key] : []);
}
