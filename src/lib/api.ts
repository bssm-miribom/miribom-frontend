// 백엔드 주소는 EXPO_PUBLIC_API_URL (기본 http://localhost:8000), prefix /api
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export function getHealth() {
  return apiGet<{ status: string }>('/health');
}
