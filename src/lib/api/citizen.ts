import { request } from './client';
import type { Health, Notice, PlaceForecast, PlaceSearchResult } from './types';

export function getHealth() {
  return request<Health>('/health');
}

// C1 장소 검색. q가 비면 전체
export function searchPlaces(q: string) {
  return request<PlaceSearchResult[]>('/places/search', { query: { q } });
}

// C2 3일 혼잡 안내
export function getPlaceForecast(id: string) {
  return request<PlaceForecast>(`/places/${encodeURIComponent(id)}/forecast`);
}

export function getNotices() {
  return request<Notice[]>('/notices');
}
