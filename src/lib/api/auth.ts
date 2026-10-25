import { endSession, startSession } from '../session/session';
import { request } from './client';
import type { Account, LoginRequest, LoginResponse } from './types';

// POST /auth/login. 성공하면 세션 저장 (앱: SecureStore, 웹: sessionStorage)
export async function login(body: LoginRequest) {
  const res = await request<LoginResponse>('/auth/login', { method: 'POST', body });
  await startSession(res);
  return res.account;
}

export function logout() {
  return endSession('manual');
}

export function getMe() {
  return request<Account>('/auth/me', { auth: true });
}
