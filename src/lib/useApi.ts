import { useCallback, useEffect, useState } from 'react';

import { ApiError } from './api';

export type ApiState<T> = {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
};

type Result<T> = { key: string; data: T | null; error: ApiError | null };

/** 화면용 간단 조회 훅. deps(문자열·숫자·불리언)가 바뀌면 다시 불러옴 */
export function useApi<T>(load: () => Promise<T>, deps: unknown[]): ApiState<T> {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const key = JSON.stringify([...deps, tick]);

  useEffect(() => {
    let alive = true;
    load()
      .then((data) => alive && setResult({ key, data, error: null }))
      .catch((e) => alive && setResult({ key, data: null, error: e instanceof ApiError ? e : new ApiError(0, String(e)) }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  const current = result?.key === key ? result : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: !current, reload };
}
