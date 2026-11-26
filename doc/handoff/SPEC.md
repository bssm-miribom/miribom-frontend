# 미리봄 프론트 SPEC (인계용)

> 기준: PR #3 `feat/figma-screens` (2026-11-26) · 백엔드 API 명세 v0.3 (`miribom-backend/docs/API.md`) · Figma `Design-미리봄` 디자인 페이지

## 1. 서비스 한 줄
인터넷에서 갑자기 관심이 몰리는 부산 장소를 **사람이 몰리기 전에** 알려 주는 시스템. 매일 07:00에 판정이 나옴.
- **관리자(웹, 데스크톱 1440)**: 부산시 재난안전과, 구·군청, 시설 관리기관이 경보를 보고 대응을 정함
- **시민(모바일 웹, 390)**: 로그인 없이 가려는 곳의 3일 혼잡을 확인

## 2. 기술 스택
| 항목 | 내용 |
|---|---|
| 앱 | Expo SDK 58, React Native 0.88, React 19, TypeScript |
| 라우팅 | Expo Router (`src/app/`) |
| 웹 | react-native-web (관리자·시민 모두 웹이 주 대상) |
| 차트 | react-native-svg |
| 이미지·아이콘 | expo-image (SVG 파일 그대로 씀) |
| 폰트 | Pretendard(본문), Paperlogy(제목) — `assets/fonts` |
| 백엔드 주소 | `EXPO_PUBLIC_API_URL` (기본 `http://localhost:8000`), 경로 앞에 `/api` |

## 3. 폴더 구조
```
src/
  app/                    화면 (파일 = 경로)
    _layout.tsx           폰트 로드 + 세션 복원 뒤 화면 표시
    (citizen)/index.tsx   C1 장소 검색            → /
    (citizen)/place/[id]  C2 장소 혼잡 안내        → /place/:id
    admin/_layout.tsx     로그인 확인 + 사이드바
    admin/login.tsx       A1 로그인               → /admin/login
    admin/index.tsx       A2 경보 대시보드         → /admin (?judge_day=&replay=1&alias=1)
    admin/place/[id].tsx  A3 장소 상세            → /admin/place/:id (?judge_day=&replay=1)
    admin/replay.tsx      A4 과거 사례 재현        → /admin/replay (부산시만)
  components/
    ui/                   AppText, Icon, Logo, StageBadge·CrowdBadge·NewBadge
    admin/                Sidebar, charts(Sparkline·TrendChart·ReplayChart), AliasModal, common
    citizen/              CitizenFrame(헤더·스크롤·탭), CitizenTabBar
    LogoButton.tsx        로고 누르면 데스크톱은 관리자로, 모바일은 미지원 안내
  constants/
    theme.ts              색·모서리·글자 스타일 (Figma 변수와 같은 이름)
    colors.ts             경보 단계·시민 혼잡 색과 이름
    icons.ts              assets/figma 아이콘 목록
  lib/
    api/                  API 클라이언트 (client, types, auth, admin, citizen)
    session/              로그인 토큰 저장(앱 SecureStore, 웹 sessionStorage)·자동 로그아웃
    format/               숫자·날짜 표기 (3.1~4.6만, 09.21 07:00 등)
    useApi.ts             화면용 조회 훅 {data, error, loading, reload}
    prefs.ts              최근 검색·즐겨찾기 (웹 localStorage)
    share.ts              링크 공유/복사
```

## 4. 디자인 규칙 (요약, 자세한 건 `doc/md/design.md`)
- 색·글자는 **`constants/theme.ts` 토큰만** 씀. 화면에 hex 직접 쓰지 않기 (경보 단계 색은 `colors.ts`)
- 글자는 `<AppText variant="h1|h2|h3|body|bodySm|caption|label|metric|metricLg">`
- 경보 단계는 색만으로 구분하지 않고 항상 글자를 같이 씀 (`StageBadge`)
- 예측값엔 범위·단위·기준 시각을 같이: `3.1~4.6만`, `3.8명/㎡`, `09.21 07:00 판정`
- 시민 화면 말투는 해요체, 관리자는 합니다체. 시민에게 '인기·핫플·순위' 표현 금지
- 경보 단계 이름: 1단계 관심(청록) · 2단계 주의(노랑) · 3단계 경계(빨강) · 판정 보류(회색)

## 5. 화면별 명세와 상태

### C1 장소 검색 `/`
- API: `GET /places/search?q=` (빈 q = 전체 가나다순)
- 검색어 250ms 뒤 검색, 결과 카드: 이름, `부산 {구}, '{별칭}'로 검색됨`, `내일 {혼잡}` 배지
- 최근 검색 5개 (웹 localStorage)
- ⚠️ 디자인의 **'가까운 곳'(거리 km)** → API에 좌표·내 위치가 없어서 **'장소 둘러보기'(전체 목록, 내일 기준)** 로 대체함

### C2 장소 혼잡 안내 `/place/:id`
- API: `GET /places/{id}/forecast`
- 요약 카드(가장 붐비는 날 기준 문구), 3일 막대(여유 1칸·보통 2칸·붐빔/매우 붐빔 3칸), 방문 추천(`least_crowded`), 공지, 추정치 안내 문구(항상 표시)
- 날짜 이름(내일·모레·글피)은 **판정일 기준** (예보는 판정일 다음 날부터 3일)
- ⚠️ 디자인의 **'내일 시간대별'(오전·점심·오후·저녁)** → API 없음, 뺌
- 공유 버튼: 웹은 공유 시트 또는 링크 복사

### 공통 하단 탭
- ⚠️ **지도 탭** → 지도 화면이 없음. 지금은 '준비 중'(눌러도 아무 일 없음)

### A1 로그인 `/admin/login`
- API: `POST /auth/login` → 세션 저장 → `/admin`
- 소속 기관 선택(부산시/구·군청/시설)은 **안내용**. 권한은 서버가 계정 기준으로 정함
- '비밀번호 찾기', '기관 계정 발급 요청'은 안내 문구만 띄움 (기능 없음)
- 1024px 미만이면 왼쪽 브랜드 패널 숨김
- 시연 계정: `busan`(부산시), `donggu`(동구청), `police_dong`(경찰) / 비밀번호는 백엔드 README 참고

### 관리자 공통 (사이드바)
- 로그인 안 했으면 `/admin/login`으로 보냄
- 메뉴: 경보 대시보드 / 과거 사례 재현(부산시만) / 별칭 등록(부산시만, 대시보드 위 창)
- 즐겨찾기 장소: 장소 상세의 ☆로 추가 (웹 localStorage, 서버 저장 아님)
- 계정 카드: 기관명 첫 글자 아바타, 아이디, 기관명, 로그아웃

### A2 경보 대시보드 `/admin`
- API: `GET /admin/dashboard?judge_day=&replay=`, 행마다 `GET /admin/places/{id}` (7일 추이·기준 초과일 계산용)
- 요약 문장, 판정 시각 칩(`09.20 07:00 판정 · 다음 판정 …`), 재현·지연(stale)·시연 데이터 안내
- 우선 대응 목록: 단계, 장소(+신규·별칭), 7일 검색 추이, 급증 배수, 방문 의도 글, 내일 예상 방문객(low~high), 예상 밀집도, 기준 초과일(예측 범위 상단 밀집도 > 기준인 첫날)
- 7행까지 보이고 '모두 보기'로 펼침. 행 누르면 장소 상세
- ⚠️ 기능명세의 **급상승 장소 지도** → 디자인에 없어서 안 만듦

### A3 장소 상세 `/admin/place/:id`
- API: `GET /admin/places/{id}`, 판정 이력용으로 1~3일 전 같은 API, `GET /admin/checklists`, `PATCH /admin/checklists/{id}/items/{item}`
- 추이 그래프: 검색 급증 배수(우축 선), 실측 방문객(막대), 예측 중앙값(점선)·범위(영역), 병목 기준선, 판정 시점
- 판정 이력: 최근 3번 판정의 단계 변화(상향·유지·하향)
- 대응 권고: 서버 점검표. 부산시가 대응 수준을 정하기 전엔 "점검표가 만들어집니다" 안내. 관할 기관만 체크 가능(403이면 안내)
- 판정 근거: 내일 병목 밀집도, 기준 초과 예상일, `reason` 문장, 검색 지수·방문 의도 글·날씨 자료·병목 지점
- ⚠️ **'협력기관에 공유' 버튼** → 지금은 **링크 복사만**. 실제 조치 요청 API(`PUT /admin/places/{id}/response`의 `request_to`)는 연결 안 함

### A4 과거 사례 재현 `/admin/replay` (부산시만)
- API: 날짜마다 `GET /admin/places/{id}?judge_day=&replay=true`, 실행은 `POST /admin/replay {judge_day, force:true}` (날짜당 수십 초)
- 장소·판정 날짜 선택, 저장된 사례 버튼, 날짜별 재판정 차트(실측 막대 + 전날 07:00 예측 + 병목 기준 + 날짜별 단계 배지)
- 재현 요약(첫 경보 시점, 3단계 시점, 평균 예측 오차), 선택한 날 판정 근거 + 장소 상세로 이동
- 결과 없는 날은 "모두 돌리기" 링크로 한 번에 실행
- ⚠️ 저장된 사례는 **부캉이(09.18~09.24) 하나만**. 디자인의 **'광안리 불꽃축제'는 날짜를 몰라서 뺌**

## 6. 남은 일 (우선순위 순)
| # | 할 일 | 필요한 것 |
|---|---|---|
| 1 | PR #3 리뷰·머지 | — |
| 2 | 앱(iOS·Android)에서 실행 확인 | 지금은 웹만 확인함 |
| 3 | '협력기관에 공유'를 조치 요청 API로 연결 (대응 수준·받을 기관 고르는 창) | API v0.3 5장 |
| 4 | 지도 탭 / 대시보드 지도 | 지도 라이브러리 결정 (장소 `lat`,`lon`은 대시보드 API에 있음) |
| 5 | 시민 '가까운 곳' | 시민 API에 좌표 추가 요청 + 위치 권한 |
| 6 | 시민 '내일 시간대별' | 백엔드에 시간대 예측 API 요청 |
| 7 | '광안리 불꽃축제' 재현 사례 | 정확한 날짜 확인 |
| 8 | 별칭 목록·삭제, 공지 등록, 병목 구간 입력 화면 | API는 있음, 디자인 없음 |

## 7. 실행
```bash
npm install
EXPO_PUBLIC_API_URL=http://localhost:8000 npx expo start --web
npx tsc --noEmit      # 타입 확인
npx eslint src        # 린트
```
- 백엔드: `개발/`에서 `docker compose up --build` (README). 처음엔 판정 결과가 없으니 busan으로 로그인 후 `POST /api/admin/run`
- 재현 화면을 보려면 `POST /api/admin/replay`로 09.18~09.24를 한 번씩 돌려 두기
