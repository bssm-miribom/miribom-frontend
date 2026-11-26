import { request } from './client';
import type { Health, Notice, PlaceForecast, PlaceSearchResult } from './types';

export function getHealth() {
  return request<Health>('/health');
}

// 시연용 보기: replay_day(과거 날짜 재현) 또는 scenario(가상 시나리오, 실제 데이터 아님). 둘 다 없으면 오늘 예보
export type ViewQuery = { replay_day?: string; scenario?: string };

// C1 장소 검색. q가 비면 전체
export function searchPlaces(q: string, view: ViewQuery = {}) {
  return request<PlaceSearchResult[]>('/places/search', { query: { q, ...view } });
}

// C2 3일 혼잡 안내
export function getPlaceForecast(id: string, view: ViewQuery = {}) {
  return request<PlaceForecast>(`/places/${encodeURIComponent(id)}/forecast`, { query: { ...view } });
}

export function getNotices() {
  return request<Notice[]>('/notices');
}
