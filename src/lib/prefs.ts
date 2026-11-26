import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

// 최근 검색·즐겨찾기 장소처럼 기기에만 두는 작은 목록. 웹은 localStorage, 앱은 메모리 (앱 재시작 시 비움)

type Key = 'recentSearches' | 'favoritePlaces';

const memory = new Map<Key, string[]>();
const listeners = new Set<() => void>();
const EMPTY: string[] = [];

function storage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(key: Key): string[] {
  if (memory.has(key)) return memory.get(key)!;
  let value = EMPTY;
  try {
    const raw = storage()?.getItem(`miribom.${key}`);
    if (raw) value = JSON.parse(raw);
  } catch {}
  memory.set(key, value);
  return value;
}

function write(key: Key, value: string[]) {
  memory.set(key, value);
  try {
    storage()?.setItem(`miribom.${key}`, JSON.stringify(value));
  } catch {}
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function usePref(key: Key) {
  return useSyncExternalStore(subscribe, () => read(key), () => EMPTY);
}

/** 맨 앞에 넣고 중복 제거, 최대 max개 */
export function pushPref(key: Key, item: string, max = 5) {
  write(key, [item, ...read(key).filter((x) => x !== item)].slice(0, max));
}

export function togglePref(key: Key, item: string) {
  const list = read(key);
  write(key, list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
}
