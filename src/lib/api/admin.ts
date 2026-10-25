import { request } from './client';
import type {
  Alias,
  AliasRequest,
  Dashboard,
  JudgeQuery,
  Notice,
  NoticeRequest,
  PlaceDetail,
  PlaceWithAliases,
  ReplayRequest,
} from './types';

// A2 대시보드. 기본은 최근 운영 판정, judge_day·replay로 재현 결과 조회
export function getDashboard(query: JudgeQuery = {}) {
  return request<Dashboard>('/admin/dashboard', { auth: true, query });
}

// A3 장소 상세
export function getPlaceDetail(id: string, query: JudgeQuery = {}) {
  return request<PlaceDetail>(`/admin/places/${encodeURIComponent(id)}`, { auth: true, query });
}

// 별칭 등록 때 고를 장소 목록 (관할 안만)
export function getAdminPlaces() {
  return request<PlaceWithAliases[]>('/admin/places', { auth: true });
}

// 별칭 (부산시만). 중복이면 409
export function getAliases() {
  return request<Alias[]>('/admin/aliases', { auth: true });
}

export function createAlias(body: AliasRequest) {
  return request<Alias>('/admin/aliases', { method: 'POST', auth: true, body });
}

export function deleteAlias(id: number) {
  return request<void>(`/admin/aliases/${id}`, { method: 'DELETE', auth: true });
}

// A4 과거 사례 재현 (부산시만). 몇십 초 걸릴 수 있음
export function runReplay(body: ReplayRequest) {
  return request<Dashboard>('/admin/replay', { method: 'POST', auth: true, body });
}

// 오늘 판정 바로 실행 (부산시만)
export function runToday() {
  return request<Dashboard>('/admin/run', { method: 'POST', auth: true });
}

// 공지 (부산시만)
export function createNotice(body: NoticeRequest) {
  return request<Notice>('/admin/notices', { method: 'POST', auth: true, body });
}

export function deleteNotice(id: number) {
  return request<void>(`/admin/notices/${id}`, { method: 'DELETE', auth: true });
}
