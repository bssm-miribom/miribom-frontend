import { request } from './client';
import type { Health, Notice, PlaceForecast, PlaceSearchResult } from './types';

export function getHealth() {
  return request<Health>('/health');
}

// C1 장소 검색. q가 비면 전체. replayDay를 주면 그날 재현 결과로 (시연용 과거 날짜)
export function searchPlaces(q: string, replayDay?: string) {
  return request<PlaceSearchResult[]>('/places/search', { query: { q, replay_day: replayDay } });
}

// C2 3일 혼잡 안내
export function getPlaceForecast(id: string, replayDay?: string) {
  return request<PlaceForecast>(`/places/${encodeURIComponent(id)}/forecast`, { query: { replay_day: replayDay } });
}

export function getNotices() {
  return request<Notice[]>('/notices');
}
