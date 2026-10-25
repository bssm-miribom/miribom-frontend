// 백엔드 API 명세서 v0.2 (miribom-backend/docs/API.md) 기준 타입. 필드는 서버 그대로 snake_case

/** YYYY-MM-DD */
export type DateString = string;
/** ISO 8601 (+09:00) */
export type DateTimeString = string;

// 0. 공통 값

export type Stage = 'normal' | 'stage1' | 'stage2' | 'stage3' | 'pending' | 'failed';

/** null = 예보 준비 중 */
export type Crowd = 'free' | 'normal' | 'busy' | 'very_busy' | null;

export type Forecast = {
  horizon: 1 | 2 | 3;
  date: DateString;
  low: number;
  mid: number;
  high: number;
  /** 판정 보류 장소는 null */
  density_mid: number | null;
  density_high: number | null;
};

export type JudgeMeta = {
  judge_day: DateString;
  generated_at: DateTimeString;
  demo: boolean;
  replay: boolean;
  stale: boolean;
};

// 1. 상태

/** 명세에 세부 필드가 없어서 status만 고정 */
export type Health = {
  status: string;
  [key: string]: unknown;
};

// 2. 인증

export type OrgType = 'city' | 'district' | 'facility';

export type Account = {
  username: string;
  org_name: string;
  org_type: OrgType;
  district: string | null;
  can_edit: boolean;
};

export type LoginRequest = { username: string; password: string };

export type LoginResponse = {
  access_token: string;
  token_type: 'bearer';
  account: Account;
};

// 3. 관리자 대시보드

export type DashboardSummary = {
  stage3: number;
  stage2: number;
  stage1: number;
  pending: number;
};

export type DashboardPlace = {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  stage: Exclude<Stage, 'normal'>;
  surge_ratio: number;
  /** 방문 의도 분류 전이라 지금은 null */
  intent_posts: number | null;
  d1: Forecast | null;
  bottleneck_name: string | null;
  is_new: boolean;
  new_alias: string | null;
  reason: string;
};

export type Dashboard = {
  meta: JudgeMeta;
  summary: DashboardSummary;
  places: DashboardPlace[];
};

export type JudgeQuery = {
  judge_day?: DateString;
  replay?: boolean;
};

export type Place = {
  id: string;
  name: string;
  district: string;
};

export type PlaceWithAliases = Place & { aliases: string[] };

export type PlaceDetail = {
  meta: JudgeMeta;
  place: PlaceWithAliases;
  stage: Stage;
  reason: string;
  surge: { ratio: number; top1pct: number; year_max: number; reason: string };
  trend: { date: DateString; surge_ratio: number }[];
  /** 장소별 실측 자료가 없어서 지금은 빈 배열. 형식은 미정 */
  actual_visitors: { date: DateString; visitors: number }[];
  forecasts: Forecast[];
  bottleneck: {
    name: string;
    area_m2: number;
    limit_per_m2: number;
    /** 보류 장소는 null */
    limit_visitors: number | null;
    estimated: boolean;
  } | null;
  weather_source: string;
};

export type AliasRequest = { alias: string; place_id: string };

export type Alias = {
  id: number;
  alias: string;
  place_id: string;
  created_at: DateTimeString;
  applies_from: DateString;
};

export type ReplayRequest = { judge_day: DateString; force?: boolean };

// 4. 공지

export type Notice = {
  id: number;
  title: string;
  body: string;
  place_id: string | null;
  created_at: DateTimeString;
  ends_at: DateTimeString | null;
};

export type NoticeRequest = {
  title: string;
  body: string;
  place_id?: string;
  ends_at?: DateTimeString;
};

// 5. 시민

export type CrowdDay = {
  date: DateString;
  crowd: Crowd;
  label: string;
};

export type PlaceSearchResult = Place & {
  matched_alias: string | null;
  tomorrow: CrowdDay;
};

export type PlaceForecast = {
  meta: JudgeMeta;
  place: Place;
  days: CrowdDay[];
  /** 3일이 다 같은 단계면 null */
  least_crowded: DateString | null;
  notices: Notice[];
  disclaimer: string;
};
