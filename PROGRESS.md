# 진행 상황

자율 진행 중 이 파일을 계속 갱신합니다. 중간에 끊기면 여기부터 이어서 진행.

## 상태: 완전히 완료 ✅ (실사용 테스트 + 실제 배포까지 끝남, 남은 건 README 7번 "마지막 할 일"뿐)

- [x] 0. 프로젝트 디렉터리 + git init
- [x] 0.5 Node.js 설치 (brew), DECISIONS.md / PROGRESS.md 초기 작성
- [x] 1. Vite + React 스캐폴딩 (수동 구성, create-vite CLI가 비대화형에서 취소되어 package.json/vite.config.js 등 직접 작성)
- [x] 2. Tailwind CSS 설정 (postcss/tailwind config 완료, 의존성 설치는 다음 단계)
- [x] 3. lib: supabase client / storage 추상화 (localStorage ↔ supabase) — src/lib/supabase.js, src/lib/store.js, src/lib/AuthContext.jsx
- [x] 4. lib: 날짜/기념일 계산 유틸 — src/lib/date-utils.js
- [x] 5. 인증/이름설정 페이지 + 라우트 가드 — src/pages/Login.jsx, App.jsx RequireAuth
- [x] 6. 메인 페이지 (D-day + 다가오는 기념일) — src/pages/Main.jsx
- [x] 7. 달력 페이지 (월별, 기념일 표시, 날짜 기록 모달, 사진 압축 업로드) — src/pages/Calendar.jsx, src/components/DateRecordModal.jsx
- [x] 8. 투두 페이지 — src/pages/Todo.jsx
- [x] 9. PWA 설정 — vite-plugin-pwa 설정 + scripts/gen-icons.mjs로 하트 아이콘 PNG 5종 생성 완료 (icons/icon-192,512,maskable-512, apple-touch-icon, favicon)
- [x] 9.5 npm install 완료 (Node/npm 없어서 brew install node 먼저 진행), `npm run build` 1차 성공 확인 (PWA sw.js까지 정상 생성)
- [x] 10. GitHub Pages 배포 설정 — .github/workflows/deploy.yml (main 브랜치 push 시 자동 빌드/배포, secrets로 supabase 키 주입)
- [x] 11. supabase/schema.sql (테이블 + RLS + storage 정책) 작성 완료 (아직 실행 안 함 — 귀가 후 할 일)
- [x] 12. README.md 작성 (귀가 후 할 일 체크리스트 최상단 — SQL 실행, 계정 2개, 로컬 확인, GitHub Pages 배포 순서로 정리)
- [x] 13. 브라우저에서 localStorage 모드 스모크 테스트 완료 — 이름설정→메인(날짜계산/기념일 정렬)→달력(기록 추가/기념일 하이라이트)→투두(추가/체크) 전부 정상 확인. 테스트 중 .env를 임시로 치워서 localStorage 모드로 강제했고, 테스트 후 원래 .env(Supabase 키)로 복원함. 테스트 데이터는 브라우저 localStorage에만 남아있고 git에는 안 들어감.
- [x] 14. npm run build 최종 확인 (.env 복원 후 재확인 완료 — dist/ 정상 생성, PWA sw.js 포함)
- [x] 15. 최종 커밋

## 2차 수정 요청 (2026-09-30) — "딱 둘만 쓰는 앱" 강화

- [x] 16. schema.sql: `allowed_members` 테이블(이메일 2개, 본인 row만 select 가능한 RLS) 추가 + 모든 테이블/스토리지 정책을 "로그인 전체 허용" → "allowed_members에 있는 이메일만 허용"으로 전면 교체. 이메일 2개는 파일 맨 위 INSERT 문에 자리표시자로 남겨두고 주석으로 안내.
- [x] 17. AuthContext에 멤버십 체크(`isMember`) 추가, App.jsx에 `NotAllowed`("초대된 사용자만 이용 가능") 화면 + RequireAuth 로직 확장.
- [x] 18. 설정(⚙️) 탭 신설 — 만난 날 수정(둘 다 가능), 표시 이름 설정(Supabase: user_metadata.display_name / 로컬: localStorage). Main.jsx의 최초 입력 문구도 "만난 날을 입력해주세요"로 통일.
- [x] 19. Supabase Realtime 연동 — `subscribeToChanges()`(store.js)로 relationship/date_records/todos 변경을 구독, Main/Calendar/Todo에서 이벤트 오면 재조회. schema.sql에 `alter publication supabase_realtime add table ...` 멱등 추가.
- [x] 20. 로컬(localStorage) 모드 상단에 "🧪 테스트 모드 — 공유 안 됨" 배지 추가 (Layout.jsx). 키가 있으면 애초에 local 모드로 못 빠지는 구조는 기존에도 동일(isSupabaseEnabled가 모듈 로드 시점에 고정).
- [x] 21. README.md 전면 개정 — schema.sql에 이메일 채워넣는 단계를 맨 앞에 추가, `gh repo create`를 `--public`으로 변경(무료 GitHub Pages는 private repo 불가), `brew install gh`/`gh auth login` 단계 추가, 마지막에 "가입 끝나면 Supabase에서 신규 가입 끄기" 안내 추가.
- [x] 22. `/Users/jimmy/JUSIK/.claude/launch.json` 삭제 완료 (요청대로).
- [x] 23. 브라우저에서 로컬 모드로 재검증 — 테스트 모드 배지, 설정 탭(만난 날/표시이름 저장, 헤더 즉시 반영), 투두 탭 정상 동작 확인.
- [x] 24. `npm run build` 최종 재확인 성공.
- [x] 25. 단계별 커밋 완료.

## 참고
- GitHub push, 실제 배포, Supabase SQL 실행, 계정 생성은 지시대로 하지 않았음 — README.md 맨 위 체크리스트대로 귀가 후 진행하면 됨.
- Supabase 모드는 스키마(SQL)를 아직 실행하지 않아서 실제 로그인/allowed_members/realtime 동작은 로컬 모드로만 우회 검증했음 (테이블이 없어서 supabase 모드로는 에러 남). SQL 실행(이메일 채워서) + 계정 2개 생성 후 실제로 한 번씩 눌러보는 걸 권장.
- 지금 `.env`에는 실제 Supabase URL/anon key가 들어있어서, 로컬에서 `npm run dev` 하면 바로 Supabase 모드로 뜸 (로그인 필수, allowed_members 테이블 없으면 멤버십 체크에서 에러 나면서 "초대된 사용자만 이용 가능" 화면으로 빠질 수 있음 — SQL 실행 전이라 정상임).
- 표시 이름은 "작성 시점 스냅샷"이라, 나중에 이름을 바꿔도 과거 투두/기록의 작성자 텍스트는 안 바뀜 (DECISIONS.md 8번 참고).

## 3차 수정 요청 (2026-09-30) — "레트로 게임 메뉴판 + 파스텔 네온" 리디자인

- [x] 26. `tailwind.config.js` love 팔레트를 라일락/핑크(#C77DD6 계열)로 교체, 크림 핑크 배경(#FFF5FA) 유지.
- [x] 27. `index.css`에 글로우 유틸리티(`.frame-glow`/`.text-glow`/`.text-glow-strong`) + 메뉴 탭 프레스 플래시 애니메이션(`@keyframes lp-flash`) 추가, body 기본 굵기 300(Thin)으로 변경.
- [x] 28. `src/components/icons.jsx` 신규 — 하트/달력/체크/선물/톱니 5종 커스텀 라인 SVG 아이콘 직접 제작.
- [x] 29. `src/pages/Menu.jsx` 신규 — "/" 를 LOVEPAD 게임 메뉴판 허브로 교체 (좌상단 LOVEPAD 타이틀, 우상단 OUR ANNIVERSARY PROGRAM, 테두리 박스 안 아이콘+메뉴 5개 세로 나열, 우하단 Couple No.1 / Day N, 탭 시 글로우 플래시 후 라우팅).
- [x] 30. `src/pages/DDay.jsx` 신규(기존 Main.jsx의 만난 날 입력/일수 계산 로직을 그대로 이관) — "/dday"로 이동, 다음 기념일 D-day까지만 표시(목록은 분리).
- [x] 31. `src/pages/Anniversaries.jsx` 신규 — 기존 Main.jsx의 "다가오는 기념일 5개" 목록을 "/anniversaries"로 분리 이관.
- [x] 32. `src/pages/Main.jsx` 삭제 (Menu+DDay+Anniversaries로 대체), `App.jsx` 라우트 갱신.
- [x] 33. `Layout.jsx` 하단 탭을 홈/디데이/달력/투두/기념일/설정 6개로 재구성 + 네온 글로우 활성 탭 스타일, 새 라인아이콘 적용.
- [x] 34. Calendar/Todo/Settings/Login/DateRecordModal 전부 `frame-glow`/`text-glow` 스타일로 통일 (기존 카드 스타일 rounded-3xl+shadow-sm → 두꺼운 글로우 테두리로 교체). 기능 로직은 변경 없음.
- [x] 35. 390×844(모바일) 뷰포트로 로컬 모드에서 전체 화면(메뉴/디데이/달력/투두/기념일/설정/기록모달) 실물 확인 완료 — 검증용으로 `/Users/jimmy/JUSIK/.claude/launch.json`을 임시로 다시 만들었다가 검증 끝나고 즉시 재삭제함(지시사항 유지).
- [x] 36. `npm run build` 최종 성공 확인.
- [x] 37. 단계별 커밋 진행.

## 4차 수정 요청 (2026-09-30) — "파스텔 핑크 픽셀 RPG" 리디자인 (네온/글로우 전부 제거)

- [x] 38. `npm i galmuri` 설치, `main.jsx`에서 `galmuri/dist/galmuri.css` import.
- [x] 39. `tailwind.config.js` — `love-*` 팔레트 삭제, `pastel.{bg,box,accent,border,text}` 5색 고정 팔레트로 교체. `fontFamily.title`(Galmuri14)/`fontFamily.body`(Galmuri11) 추가.
- [x] 40. `index.css` 전면 재작성 — 네온/글로우 유틸리티(frame-glow/text-glow) 전부 삭제. `* { border-radius:0 !important }` 강제, `pixel-btn`/`pixel-tile`(눌림 효과 2px+그림자 제거), `pixel-cursor`(깜빡이는 ▶), `pixel-clear-flash`(CLEAR! 팝 애니메이션) 추가.
- [x] 41. `src/components/PixelPanel.jsx` 신규 — clip-path 계단식 모서리 + `filter:drop-shadow(4px 4px 0 #D6457A)` 하드 섀도우 패널 (모든 화면 카드에 공통 사용).
- [x] 42. `src/components/icons.jsx` 전면 재작성 — 16x16 픽셀 그리드 기반 진짜 픽셀아트로 하트/달력/체크/선물/톱니 다시 그림 (`shape-rendering:crispEdges` + `image-rendering:pixelated`).
- [x] 43. `src/lib/date-utils.js`에 `getLoveGaugeProgress()` 추가 (직전↔다음 마일스톤 진행률 0~1 계산, LOVE 게이지용).
- [x] 44. `src/pages/Menu.jsx` → `src/pages/Home.jsx`로 교체 — LOVE QUEST 타이틀+하트 2개, RPG 대화창(만난 지 N일째) + LOVE 게이지(HP바 10칸) + 다음 기념일 D-day, RPG 메뉴(▶ 깜빡이는 커서, 디데이/달력/투두/설정 4개, 탭 시 260ms 후 이동).
- [x] 45. `src/pages/DDay.jsx` 재작성 — 픽셀 스타일 + 이전에 분리했던 "다가오는 기념일" 목록을 다시 합쳐 넣음(선물 아이콘과 함께). 만난 날 미입력 시 입력 폼 로직은 그대로 유지.
- [x] 46. `src/pages/Anniversaries.jsx` 삭제 (내용은 DDay.jsx로 이관, 기능 손실 없음), `App.jsx` 라우트 갱신(Home/DDay/Calendar/Todo/Settings 5개, 기념일 라우트 제거).
- [x] 47. `Layout.jsx` 하단 탭 5개(홈/디데이/달력/투두/설정)로 축소 + 픽셀 스타일 재적용, 로컬모드 배지 픽셀화.
- [x] 48. `Calendar.jsx` — 날짜 칸을 픽셀 타일로, 기념일 칸엔 하트 아이콘 오버레이, 기록 있는 날은 작은 점. 월 그리드/기념일 목록 PixelPanel로 통일.
- [x] 49. `Todo.jsx` — 체크박스를 픽셀 네모(+픽셀 체크 아이콘)로, 완료 체크 시 "CLEAR!" 0.9초 플래시 배지 추가.
- [x] 50. `Settings.jsx`/`Login.jsx`/`DateRecordModal.jsx`/`App.jsx`(NotAllowed/로딩 화면) 전부 픽셀 스타일로 통일, LOVE QUEST 타이틀로 로그인 화면도 맞춤.
- [x] 51. `vite.config.js` — PWA manifest theme_color/background_color를 새 팔레트로 갱신, galmuri 미사용 굵기(7/9/Mono/Bold/Condensed) + 모든 `.ttf`를 workbox `globIgnores`로 오프라인 캐시에서 제외 (프리캐시 3.8MB → 1.5MB로 축소, DECISIONS.md 12번 참고).
- [x] 52. 390×844 로컬 모드 실물 확인 — 홈(LOVE QUEST 메뉴+게이지+커서), 디데이(기념일 목록 포함), 달력(픽셀 타일/기념일 하트/기록 점), 투두(픽셀 체크박스, 토글 정상 — 자동화 도구의 좌표 클릭이 간헐적으로 안 먹혀서 JS로 직접 dispatch해서 재확인함, 실제 앱 버그 아님), 설정, 날짜기록모달까지 전부 확인. 검증용 launch.json은 테스트 후 즉시 재삭제.
- [x] 53. `npm run build` 최종 성공 확인.
- [x] 54. 단계별 커밋 진행.

## 5차 요청 (2026-10-01) — 실제 SQL 실행 + 실제 2계정 실사용 테스트 + 배포

- [x] 55. `allowed_members`에 실제 이메일 2개(jiminppoppo93@gmail.com, eunjippoppo95@gmail.com) 입력 후 commit.
- [x] 56. SQL 실행: `supabase` CLI + `psql`(brew install)까지 설치해서 직접 접속 시도했지만 direct DB 호스트가 DNS로 안 풀리고(IPv6 전용 등 최신 Supabase 네트워크 이슈로 추정) pooler 접속 정보(리전 등)도 몰라서, 사용자 요청대로 SQL Editor 수동 실행으로 전환. (참고: 이 샌드박스의 `pbcopy`가 실제 사용자 클립보드에 닿지 않아서, 클립보드 복사 대신 채팅에 SQL을 코드블록으로 직접 나열하는 방식으로 전달함.)
- [x] 57. **버그 발견 및 수정**: SQL Editor로 테이블을 만들면 RLS 정책과 별개로 `authenticated` 롤에 테이블 기본 GRANT가 안 붙어서 "permission denied for table ..." 로 전부 막히는 문제 발견 (REST API로 직접 쿼리해서 진단). `schema.sql`에 `grant select/insert/update/delete ...` 구문 추가, 사용자가 추가 SQL 실행 후 해결 확인.
- [x] 58. 두 계정 가입 — Supabase Auth API로 직접 가입(브라우저 폼과 동일 엔드포인트) 후, "Confirm email"이 켜져 있어서 두 분 다 메일함에서 확인 링크 클릭 요청 → 완료.
- [x] 59. 실사용 테스트 4가지 — 브라우저 1개 탭(세션 전환) + REST API(상대 계정 동작 시뮬레이션) 조합으로 진행, **전부 통과**:
  - 만난 날 입력(지민) → 은지 계정 로그인 시 동일하게 보임 (690일째/700일까지 D-10 등 수치 일치)
  - 투두 추가(지민, API) → 은지 탭에 새로고침 없이 즉시 반영 (Realtime 정상)
  - 캘린더 기록+사진(지민, API+Storage 업로드) → 은지 탭에서 새로고침 없이 보이고, signed URL로 사진도 정상 로드 확인(`naturalWidth/Height` 체크)
  - 허용 목록에 없는 이메일 → "초대된 사용자만 이용 가능" 화면. (3번째 신규 가입은 Supabase 무료 티어 메일 발송 한도에 걸려서, 대신 지민 계정을 SQL로 잠깐 allowed_members에서 뺐다가 테스트 후 바로 복구하는 방식으로 안전하게 검증)
- [x] 60. 테스트용 더미 데이터(투두/캘린더 기록+사진/만난 날짜) 전부 삭제해서 실제 사용 전 깨끗한 상태로 정리.
- [x] 61. GitHub Pages 배포 — `brew install gh` → `gh auth login`(승인 요청, 이후 `.github/workflows` push에 필요한 `workflow` 스코프 부족으로 `gh auth refresh -s workflow` 한 번 더 승인 요청) → `gh repo create couple-dday --public` → push → `gh secret set`으로 VITE_SUPABASE_URL/ANON_KEY 등록 → Pages Source는 `gh api -X POST repos/.../pages -f build_type=workflow`로 API를 통해 직접 설정 성공 (클릭 안내 불필요했음).
- [x] 62. 배포 주소 확인 — https://jimmy9306.github.io/couple-dday/ . 첫 push 시점엔 secrets 등록 전에 워크플로우가 먼저 돌아서 로컬모드로 잘못 배포됐던 걸 발견 → `gh run rerun`으로 재배포하고 로그인까지 실사 확인해서 Supabase 모드 정상 동작 확인.

## 참고 (5차, 배포 관련)
- gh OAuth 토큰은 기본적으로 `repo` 스코프만 있어서 `.github/workflows/*.yml`을 포함한 최초 push가 "refusing to allow an OAuth App to create or update workflow ... without `workflow` scope"로 거부됨 — `gh auth refresh -h github.com -s workflow`로 스코프 추가해서 해결 (디바이스 코드 승인 한 번 더 필요했음).
- GitHub Pages를 Actions 소스로 켜는 것도 클릭 없이 `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`로 가능했음 (저장소에 Pages가 한 번도 설정된 적 없으면 POST, 이미 있으면 PUT).
- 배포 직후 사이트가 로컬모드로 보였던 건 "secret 등록 전에 이미 큐에 들어간 워크플로우가 실행됐기 때문" — push와 secret 등록 사이에 약간의 시차가 있으면 이런 일이 생길 수 있어서, 다음에도 비슷한 상황이면 `gh run list`로 최근 run의 트리거 시각과 secret 등록 시각을 비교해보는 게 좋음.
- 배포 직후 브라우저가 이전 `index.html`을 HTTP 캐시에서 그대로 재사용해서 새 번들이 안 보이는 현상이 있었음 (서버 쪽 `curl`로는 이미 최신 파일이 응답되는 걸 확인함, `age:0`/`x-cache:MISS`) — 쿼리스트링을 붙여 캐시를 우회해서 확인함. 사용자가 실제로 폰에서 처음 열 때는 이런 이슈가 없을 가능성이 높지만, 혹시 예전 화면이 보이면 새로고침(또는 캐시 지우기) 안내.

## 참고 (5차)
- 자동화 브라우저 도구에서 좌표/ref 기반 클릭이 PixelPanel의 clip-path 요소 근처에서 간헐적으로 안 먹히는 현상이 이번에도 있었음 — JS `element.click()`/`form.requestSubmit()` 직접 디스패치로 전부 우회해서 테스트함. 실제 앱 사용자가 손가락/마우스로 누르는 것과는 무관한 자동화 도구 한정 이슈로 보임 (실기기에서 추가 확인 권장).
- DB 직접 접속(psql)은 이번엔 못 뚫었지만, 혹시 나중에 또 필요하면 Supabase 대시보드 Settings → Database → Connection string(Session/Transaction pooler) 쪽 URI를 주면 바로 시도 가능.

## 6차 요청 (2026-10-01) — 아이폰 실사용 피드백 6건 수정

- [x] 63. [1] PWA 상단 잘림 — index.html에 apple-mobile-web-app-capable/status-bar-style(black-translucent) 메타 추가, Layout.jsx의 safe-area-inset-top 패딩을 최상위 컨테이너로 이동(로컬모드 배너가 있을 때도 안전하게 적용되도록). 하단 탭바 safe-area-inset-bottom은 기존에 이미 적용돼 있던 것 확인.
- [x] 64. [2,3] 달력 날짜별 다중 기록 — `RecordViewModal.jsx` 신규(보기 전용 팝업, 작성자만 수정/삭제 버튼), `Calendar.jsx` 전면 개편(날짜 탭 → 달력 아래 기록 목록+"+ 기록하기", 점 표시는 기록 개수만큼 최대 3개), `DateRecordModal.jsx`는 max-h-[90vh]+내부 스크롤 구조로 재구성하고 사진을 object-contain으로 변경. 기존 date_records 스키마가 날짜당 여러 행을 이미 허용해서 **DB 마이그레이션 불필요** (기존 9/26 기록 등 그대로 보존됨, 건드리지 않음).
- [x] 65. [4] 투두 하단 가림 — Layout.jsx `<main>`의 padding-bottom을 고정 96px → `calc(env(safe-area-inset-bottom)+6rem)`으로 변경 (모든 화면에 공통 적용).
- [x] 66. [5] 설정 날짜 입력칸 삐져나옴 — index.css에 `input[type=date]{-webkit-appearance:none;width:100%;min-width:0;box-sizing:border-box}` 전역 규칙 추가.
- [x] 67. [6] 앱 아이콘 재제작 — `scripts/gen-icons.mjs`를 32x32 그리드 기반으로 전면 교체 (하트 본체/외곽선/1px 하드섀도우/하이라이트 2~3픽셀/배경 반짝이 2개, 5색 팔레트만 사용), nearest-neighbor로 180/192/512/512(maskable) 생성. index.html·vite.config.js의 아이콘 경로는 파일명이 그대로라 변경 불필요.
- [x] 68. 로컬 모드로 6개 항목 전부 브라우저(390px) 실물 확인 — 다중 기록 추가/보기/수정/권한분리/삭제, 투두 15개 추가 후 스크롤+하단여백, 날짜 입력칸 폭, 아이콘 PNG 직접 확인. iOS 시뮬레이터는 이 Mac에 전체 Xcode가 없어서(Command Line Tools만 설치됨) 사용 불가 — 사용자에게 Xcode 설치 + `sudo xcode-select` 안내만 전달하고 조용히 다른 방법으로 대체하지 않음(명시적으로 고지).
- [x] 69. `npm run build` 성공 확인, 항목별로 커밋 5개(1 / 2+3 / 4 / 5 / 6)로 분리.
- [ ] 70. push 및 배포 확인.

## 참고 (6차)
- Chromium 기반 브라우저 패널은 iOS의 `env(safe-area-inset-*)`와 `input[type=date]` 네이티브 렌더링을 완전히 동일하게 재현하지 못함 — 코드 수정은 iOS Safari 공식 best practice를 따랐지만, 실제 아이폰(특히 노치/다이나믹아일랜드 기종)에서 한 번 더 육안 확인을 권장.

## 7차 요청 (2026-10-01) — 댓글 기능 + 작성자 권한 DB 레벨 강화

- [x] 71. `src/lib/AuthContext.jsx`에 `userId` 추가 — Supabase 모드는 `user.id`(auth.uid()), 로컬 모드는 기기 고정 임의 uuid(`dday_local_user_id`).
- [x] 72. `src/lib/store.js` — `date_records` CRUD에 `userId` 연동(신규 작성 시에만 설정, 수정 시엔 유지), `comments` 테이블 CRUD 4종(list/listAll/add/update/delete) 추가, `subscribeToChanges`에 `comments` 테이블 추가, `deleteDateRecord`의 로컬 모드 분기에서 연관 댓글도 같이 삭제(FK cascade가 없는 로컬 모드 보정).
- [x] 73. **마이그레이션 전후 호환성 처리** — `date_records` insert 시 `user_id` 컬럼 없음(`42703`)이면 폴백 재시도, `comments` 테이블 없음은 `listComments`/`listAllComments`에서 빈 배열로 처리. 실제 테이블 없을 때 PostgREST 에러 코드가 예상한 `42P01`이 아니라 **`PGRST205`**라는 걸 라이브 프로젝트에 직접 REST 쿼리해서 확인하고 수정함 (DECISIONS.md 15번).
- [x] 74. `src/components/RecordViewModal.jsx` 전면 개편 — 사진 아래 댓글 목록(작성자/내용/작성시간 `MM.dd HH:mm`), 내 댓글만 수정(인라인 편집)/삭제, 맨 아래 댓글 입력창+등록 버튼 고정, 글 자체의 수정/삭제는 헤더로 이동(작성자 본인만), 댓글 테이블이 아직 없을 때 등록 시도하면 친절한 안내 메시지 표시.
- [x] 75. `src/pages/Calendar.jsx` — 날짜별 글 목록에 댓글 개수(`💬N`) 표시(전체 댓글 1회 로드 후 집계), `isOwner` 판정을 `createdBy` 문자열 비교에서 `userId` 비교로 전환, 모달 닫을 때 `refresh()` 호출 추가(로컬 모드는 realtime이 no-op이라 안 그러면 댓글 개수가 안 갱신되는 버그 발견 후 수정).
- [x] 76. `supabase/migration_003_comments.sql` 작성 — user_id 컬럼+백필, comments 테이블, date_records/comments/storage RLS를 본인(auth.uid())전용으로 강화, Realtime 등록. 기존 글/사진 데이터는 전혀 삭제하지 않음.
- [x] 77. 로컬 모드로 전체 플로우 실물 테스트 — 글 작성 → 댓글 작성(본인) → `💬1` 집계 확인 → `dday_local_user_id`를 강제로 바꿔 "상대방" 시뮬레이션 → 글 수정/삭제 버튼 안 보임 + 상대 댓글 수정/삭제 안 보임 확인 → 새 댓글 추가(지민) → `💬2` 집계 확인 → 댓글 인라인 수정 확인. 실제 라이브 Supabase에도 REST로 직접 질의해서 "SQL 실행 전 에러 안 남" 가정이 맞는지 검증(위 73번).
- [x] 78. `npm run build` 성공 확인.
- [x] 79. 단계별 커밋, push, 배포 확인.
- [x] 80. migration_003_comments.sql 채팅에 코드블록으로 전달 + 실행 전/후 확인 방법 안내.
- [x] 81. **버그 발견/수정** — 배포 직후 라이브에서 직접 재현: 달력 화면 + 그 위에 연 보기 팝업이 동시에 `subscribeToChanges()`를 호출하면 같은 이름("dday-shared-data") 채널을 또 구독하려다 "cannot add postgres_changes callbacks ... after subscribe()" 에러 발생. 호출마다 고유한 채널 이름을 쓰도록 수정, 라이브에서 재확인 완료.
- [x] 82. SQL 실행 후 실제 두 계정(지민/은지)으로 라이브에서 전체 검증 — 기존 글 8개 모두 정확히 백필됨, 상대 글엔 수정/삭제 안 보임(양방향), 댓글 작성/권한분리(양방향), REST API로 댓글 추가 시 열려있는 화면에 새로고침 없이 반영됨(진짜 realtime 확인), 💬 개수 정확. 테스트로 단 댓글 3개는 각자 본인 권한으로 정리, 기존 게시글·사진은 전혀 건드리지 않음.

## 8차 요청 (2026-10-01) — 삭제 버튼 확인 팝업 (게시글/댓글/투두)

- [x] 83. `src/components/ConfirmDialog.jsx` 신규 — 픽셀 RPG 스타일 공통 확인 팝업. "정말 삭제하시겠습니까?" + 소문구(detail), 왼쪽 흰 배경 "취소" / 오른쪽 진한 핑크(`bg-pastel-border`) "삭제". 바깥 영역 탭 또는 취소 시 그냥 닫힘. 내부 `busy` state로 삭제 버튼 연타 시 한 번만 실행되게 가드.
- [x] 84. `src/pages/Todo.jsx` — 삭제 버튼이 즉시 삭제하지 않고 `pendingDelete`(해당 todo) 상태만 세팅 → ConfirmDialog(detail=할 일 내용) 렌더 → 확인 시에만 실제 삭제.
- [x] 85. `src/components/RecordViewModal.jsx` — 게시글 헤더의 "삭제"(detail="사진과 댓글도 함께 삭제돼요")와 각 댓글의 "삭제"(detail=댓글 내용 24자 미리보기+"…")를 각각 ConfirmDialog로 교체. 기존 `confirm('댓글을 삭제할까요?')` 네이티브 호출 제거.
- [x] 86. `src/components/DateRecordModal.jsx` — 수정 폼 하단의 "삭제" 버튼(게시글 삭제의 또 다른 진입점)도 동일하게 ConfirmDialog로 교체, 네이티브 `confirm()` 제거.
- [x] 87. `src/pages/Calendar.jsx`의 `handleDeleteFromView`에서 중복으로 남아있던 네이티브 `confirm()` 제거 (이제 RecordViewModal이 확인을 담당).
- [x] 88. `grep -rn "confirm(" src/` 로 네이티브 confirm() 호출이 전부 제거됐는지 확인.
- [x] 89. 로컬 모드 390px에서 실물 테스트 — 투두(바깥탭 취소 확인 → 실제 삭제 → 3번 연타해도 한 번만 처리), 게시글(보기팝업 헤더 삭제 + 수정폼 삭제 둘 다 "사진과 댓글도 함께 삭제돼요" 문구 확인), 댓글(24자 미리보기 말줄임 확인, 실제 삭제). 전부 통과.
- [x] 90. `npm run build` 성공 확인.
- [ ] 91. 단계별 커밋, push, 배포 확인.
