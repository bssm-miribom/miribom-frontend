# 첫 대화 프롬프트 (복사해서 AI에게 붙여넣기)

```
나는 '미리봄' 프론트 담당이야. 부산에서 갑자기 관심이 몰리는 장소를 사람이 몰리기 전에 알려 주는 서비스고,
레포는 bssm-miribom/miribom-frontend (Expo SDK 58, React Native + 웹)야.

앞 담당자가 Figma 디자인대로 6개 화면(시민 검색·혼잡 안내, 관리자 로그인·대시보드·장소 상세·과거 사례 재현)을
PR #3(feat/figma-screens)에 만들어 뒀어. 이제 내가 이어서 맡아.

먼저 이것만 해 줘. 코드는 아직 고치지 마.
1. doc/handoff/AGENT.md, doc/handoff/SPEC.md, 루트 AGENTS.md, doc/md/design.md를 읽고 규칙을 지켜 줘
2. feat/figma-screens 브랜치 코드를 훑어보고, 폴더 구조와 화면별로 어떤 API를 쓰는지 5줄 안으로 정리해 줘
3. SPEC 6장 '남은 일' 중에서 지금 바로 할 수 있는 것(백엔드 변경 없이)과
   백엔드에 요청해야 하는 것을 나눠 줘
4. 웹으로 띄우는 방법(npm install, 백엔드 주소 설정, 시연 계정)을 내 컴퓨터 기준으로 알려 줘

답은 한국어로 짧게, 결과 먼저.
```

## 참고
- Figma: `Design-미리봄` 파일의 '디자인' 페이지 (Figma 커넥터를 연결해 두면 AI가 직접 읽음)
- 백엔드 API 명세: `miribom-backend/docs/API.md` (v0.3)
- 시연 계정: `busan`(부산시) · `donggu`(동구청) · `police_dong`(경찰), 비밀번호는 백엔드 README
