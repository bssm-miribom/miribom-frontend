import { request, setAccessToken } from './client';
import type { Account, LoginRequest, LoginResponse } from './types';

// POST /auth/login. 성공하면 토큰을 저장해서 이후 관리자 API에 붙임
export async function login(body: LoginRequest) {
  const res = await request<LoginResponse>('/auth/login', { method: 'POST', body });
  setAccessToken(res.access_token);
  return res;
}

export function logout() {
  setAccessToken(null);
}

export function getMe() {
  return request<Account>('/auth/me', { auth: true });
}
