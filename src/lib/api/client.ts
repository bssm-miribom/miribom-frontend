// fetch 공통 처리: 주소, Bearer 토큰, 오류 형식 {"detail": "..."}
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export const API_URL = `${BASE_URL}/api`;

type AuthHandlers = {
  getToken: () => string | null;
  onUnauthorized: () => void;
};

// 토큰 보관·만료는 lib/session이 맡음. 여기선 요청에 붙이고 401만 알려줌
let authHandlers: AuthHandlers = { getToken: () => null, onUnauthorized: () => {} };

export function setAuthHandlers(handlers: AuthHandlers) {
  authHandlers = handlers;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  query?: Query;
  body?: unknown;
  auth?: boolean;
};

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) params.append(key, String(value));
  }
  const qs = params.toString();
  return `${API_URL}${path}${qs ? `?${qs}` : ''}`;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, auth = false } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = authHandlers.getToken();
    if (!token) throw new ApiError(401, '로그인 필요');
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, '서버에 연결할 수 없음');
  }

  if (!res.ok) {
    let detail = '잠시 후 다시 시도';
    try {
      const data = await res.json();
      if (typeof data?.detail === 'string') detail = data.detail;
    } catch {}
    if (res.status === 401 && auth) authHandlers.onUnauthorized();
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
