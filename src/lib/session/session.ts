import { useSyncExternalStore } from 'react';

import { setAuthHandlers } from '../api/client';
import type { Account, LoginResponse } from '../api/types';
import { readSession, removeSession, writeSession } from './storage';

// 로그인 세션: 토큰 + 계정 + 만료 시각. 만료되거나 서버가 401을 주면 자동 로그아웃

export type Session = {
  token: string;
  account: Account;
  /** ms (epoch) */
  expiresAt: number;
};

export type LogoutReason = 'manual' | 'expired' | 'unauthorized';

// 서버 토큰 유효 12시간 (명세서 2. 인증). JWT에서 exp를 못 읽을 때만 씀
const FALLBACK_TTL_MS = 12 * 60 * 60 * 1000;
// 만료 직전 요청이 서버에서 401 나지 않게 조금 일찍 끊음
const EXPIRY_MARGIN_MS = 60 * 1000;

let current: Session | null = null;
let lastLogoutReason: LogoutReason | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = JSON.parse(json).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function isValid(session: Session | null): session is Session {
  return !!session && session.expiresAt - EXPIRY_MARGIN_MS > Date.now();
}

function scheduleExpiry(session: Session) {
  if (expiryTimer) clearTimeout(expiryTimer);
  const ms = session.expiresAt - EXPIRY_MARGIN_MS - Date.now();
  // setTimeout 최대값(약 24.8일) 넘지 않게
  expiryTimer = setTimeout(() => endSession('expired'), Math.min(Math.max(ms, 0), 2 ** 31 - 1));
}

function apply(session: Session | null) {
  current = session;
  if (expiryTimer) clearTimeout(expiryTimer);
  expiryTimer = null;
  if (session) scheduleExpiry(session);
  emit();
}

export async function startSession(res: LoginResponse) {
  const session: Session = {
    token: res.access_token,
    account: res.account,
    expiresAt: decodeJwtExp(res.access_token) ?? Date.now() + FALLBACK_TTL_MS,
  };
  lastLogoutReason = null;
  apply(session);
  await writeSession(JSON.stringify(session));
}

export async function endSession(reason: LogoutReason = 'manual') {
  if (!current && reason !== 'manual') return;
  lastLogoutReason = reason;
  apply(null);
  await removeSession();
}

/** 앱 시작 시 한 번. 저장된 세션이 만료됐으면 지움 */
export async function restoreSession(): Promise<Session | null> {
  const raw = await readSession();
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as Session;
    if (isValid(saved)) {
      apply(saved);
      return saved;
    }
  } catch {}
  await removeSession();
  return null;
}

export function getSession(): Session | null {
  return isValid(current) ? current : null;
}

export function getLastLogoutReason() {
  return lastLogoutReason;
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 화면에서 로그인 상태 구독 */
export function useSession() {
  return useSyncExternalStore(subscribeSession, getSession, getSession);
}

setAuthHandlers({
  getToken: () => getSession()?.token ?? null,
  onUnauthorized: () => void endSession('unauthorized'),
});
