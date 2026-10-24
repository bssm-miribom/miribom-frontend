# 미리봄 프론트엔드

Expo(React Native + TypeScript) 하나로 관리자 대시보드(웹)와 시민 화면(모바일 웹)을 같이 만듦. 웹은 react-native-web으로 뜸.

## 화면 경로 (화면 명세서 기준)

| 경로 | 화면 |
|---|---|
| `/` | C1 장소 검색 (시민) |
| `/place/[id]` | C2 장소 혼잡 안내 (시민) |
| `/admin/login` | A1 로그인 |
| `/admin` | A2 경보 대시보드 메인 |
| `/admin/place/[id]` | A3 장소 상세 |
| `/admin/replay` | A4 과거 사례 재현 |

## 실행

도커 (루트 `개발/`에서):

```bash
docker compose up frontend   # http://localhost:8081
```

로컬:

```bash
cd miribom-frontend
cp .env.example .env
npm install
npm run web        # 웹
npm start          # 폰은 Expo Go로 QR 스캔
```

## 폴더

- `src/app/` 라우트 (파일 하나 = 화면 하나)
- `src/components/` 공통 컴포넌트
- `src/lib/api.ts` 백엔드 호출 (`EXPO_PUBLIC_API_URL` + `/api`)
- `src/constants/colors.ts` 경보 단계·혼잡 단계 색

## 체크

```bash
npm run typecheck
npm run lint
```
