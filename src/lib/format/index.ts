// 숫자·날짜 표기 (design.md: 범위·단위·기준 시각을 항상 함께)

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function trim(n: number, digits: number) {
  return String(+n.toFixed(digits));
}

/** 42000 → "4.2" (만 단위 숫자만) */
export function man(n: number, digits = 1) {
  return trim(n / 10000, digits);
}

/** 사람 수: 1만 이상은 "3.8만", 미만은 "8,800" */
export function people(n: number) {
  return n >= 10000 ? `${man(n)}만` : n.toLocaleString('ko-KR');
}

/** 예측 범위 "3.1~4.6만" */
export function range(low: number, high: number) {
  return `${man(low)}~${man(high)}만`;
}

export function ratio(n: number) {
  return `×${n.toFixed(1)}`;
}

export function density(n: number) {
  return `${n.toFixed(1)}명/㎡`;
}

function parse(date: string) {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
}

export function daysBetween(from: string, to: string) {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86400000);
}

/** 오늘 날짜 (한국 시간) */
export function todayKST() {
  return iso(new Date(Date.now() + 9 * 3600000));
}

/** "09.21" */
export function mmdd(date: string) {
  return date.slice(5, 10).replace('-', '.');
}

export function weekday(date: string) {
  return WEEKDAYS[parse(date).getUTCDay()];
}

export function isWeekend(date: string) {
  const w = parse(date).getUTCDay();
  return w === 0 || w === 6;
}

/** "09.21 07:00 판정"의 앞부분 */
export function judgeTime(judgeDay: string) {
  return `${mmdd(judgeDay)} 07:00`;
}

/** ISO 시각 → "09.26 09:00" (한국 시간) */
export function stamp(dateTime: string) {
  const d = new Date(new Date(dateTime).getTime() + 9 * 3600000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** base(기본 오늘) 기준 오늘·내일·모레·글피, 그 밖은 요일. 시민 예보는 판정일을 base로 씀 */
export function relativeDay(date: string, base = todayKST()) {
  const words = ['오늘', '내일', '모레', '글피'];
  return words[daysBetween(base, date)] ?? `${weekday(date)}요일`;
}
