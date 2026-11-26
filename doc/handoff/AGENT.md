# AGENT.md — 미리봄 프론트 작업 규칙 (AI용)

너는 미리봄 프론트(`miribom-frontend`)를 같이 만드는 개발 파트너다. 이 파일과 `doc/handoff/SPEC.md`, 레포 루트 `AGENTS.md`(Expo 규칙)를 먼저 읽고 작업한다.

## 1. 먼저 알 것
- 서비스: 부산에서 갑자기 관심이 몰리는 장소를 사람이 몰리기 전에 알려 줌. 관리자 웹(1440) + 시민 모바일 웹(390)
- 기준 문서: 화면은 Figma `Design-미리봄`, 데이터는 백엔드 `miribom-backend/docs/API.md` (v0.3), 말투·금지어는 `doc/md/design.md`
- `design.md`의 글꼴(IBM Plex Mono)·모서리(2px)는 Figma와 다름 → **Figma와 `constants/theme.ts`가 기준**
- 화면 6개는 이미 있음 (SPEC 5장). 새로 짜지 말고 **있는 코드를 고치거나 넓힌다**
- 사용자는 한국어로 짧은 답을 좋아함. 답은 결과 먼저, 짧게

## 2. 코드 규칙
- Expo SDK 58. 기억에 의존하지 말고 `https://docs.expo.dev/versions/v58.0.0/` 확인. 패키지는 `npx expo install`로만 추가
- 화면은 `src/app/`, 화면 아닌 코드는 `src/components`, `src/lib`
- **색·글자·모서리는 `constants/theme.ts`, `constants/colors.ts`만 씀.** 화면에 hex·폰트 이름 직접 쓰지 않기
- 글자는 `AppText`(variant), 아이콘은 `Icon`(Figma SVG, `constants/icons.ts`에 등록)
- API 호출은 `src/lib/api/`의 함수만. 새 API는 `types.ts`에 타입 → `admin.ts`/`citizen.ts`에 함수 추가. 필드 이름은 서버 그대로 snake_case
- 화면 조회는 `useApi(load, deps)`. 로딩·오류·빈 결과 상태를 항상 그림 (`Loading`, `ErrorView`)
- 숫자·날짜 표기는 `lib/format`만 (`range`, `people`, `density`, `judgeTime`, `mmdd`, `relativeDay`)
- 웹 호버는 `Pressable` style 함수의 `hovered` 사용 (타입은 `src/types/react-native-web.d.ts`)
- 주석은 한국어, 짧게, "왜"만
- 끝내기 전에 반드시 `npx tsc --noEmit`, `npx eslint src` 통과

## 3. 디자인을 코드로 옮길 때
- Figma 커넥터가 있으면 해당 노드의 디자인 컨텍스트와 스크린샷을 먼저 받는다
- Figma 코드의 절대 위치는 flex 레이아웃으로 바꾼다. 수치(간격·크기)는 Figma 값 그대로
- 새 아이콘은 `assets/figma/`에 받아서 `icons.ts`에 등록. Figma 임시 URL을 코드에 남기지 않기
- 차트는 그림 파일이 아니라 `react-native-svg`로 데이터에서 그림 (`components/admin/charts.tsx`)
- 만든 뒤 웹에서 실제로 띄워서 Figma 스크린샷과 비교

## 4. 하면 안 되는 것
- 없는 데이터를 지어내서 화면에 넣기 ❌ → API에 없으면 빼거나 "준비 중"으로 두고 SPEC 6장에 적기
- 시민 화면에 '인기·핫플·순위·급상승 TOP' 같은 말 ❌ (사람을 더 몰리게 함)
- 예측값을 확정처럼 쓰기 ❌ → 범위·단위·기준 시각·"추정치"를 같이
- 경보 단계를 색만으로 구분 ❌ → 글자 같이
- 권한 체크를 화면에서만 하기 ❌ → 화면은 숨기기만, 실제 권한은 서버(401·403·404 처리. 볼 수 없는 장소는 404로 옴)
- 토큰·비밀번호를 콘솔·로그·URL에 남기기 ❌. 루트 `.env` 내용 출력 ❌
- `main`에 바로 커밋 ❌ → 브랜치 만들고 PR

## 5. 작업 순서
1. 요청이 짧으면 SPEC에서 해당 화면·API를 찾아 범위를 한 줄로 정리하고 시작 (모호하면 한 번에 묻기)
2. 관련 파일 읽기 → 고치기 → 타입체크·린트 → 웹에서 확인
3. 끝나면: 바꾼 것, 디자인과 다른 부분(이유), 확인 못 한 것을 짧게 보고
4. API가 없어서 못 하는 건 백엔드 담당에게 보낼 요청(경로·필드 예시)을 같이 적어 줌
