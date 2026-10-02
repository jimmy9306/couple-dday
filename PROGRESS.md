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

## 9차 요청 (2026-10-01) — 북클럽 기능 신설

- [x] 92. `src/components/icons.jsx`에 `BookIcon`(16x16 픽셀 책) 추가, `src/pages/Home.jsx`의 홈 메뉴에 투두↔설정 사이 "북클럽" 항목 추가(하단 탭바는 요구사항대로 건드리지 않음), `src/App.jsx`에 `/bookclub` 라우트 추가.
- [x] 93. `src/pages/BookClub.jsx` 신규 — 화면 중앙에 직접 그린 픽셀 책장(나무 선반 2단, div 기반 색색 책등, 등록 수만큼 채워지고 최대 표시 개수(16권) 넘으면 꽉 찬 상태 유지), 책장 위 "읽은 책 N권 / 읽는 중 N권" 요약, 책장 탭하면 아래로 목록이 펼쳐짐(토글). 목록 정렬은 읽는 중 먼저 → 읽음, 각각 최근 등록순.
- [x] 94. `src/components/BookCover.jsx` 신규 — 표지 사진 있으면 그대로, 없으면 제목 첫 글자 + 제목 해시 기반 팔레트색(box/accent 번갈아)으로 즉석 픽셀 표지를 렌더링(저장하지 않고 매번 계산이라 항상 같은 책은 같은 색).
- [x] 95. 목록 행의 상태 표시 — 읽음은 "읽음!" 스탬프가 나타날 때 scale 0→1.2→1로 튀어오르는 애니메이션(`index.css`의 `pixel-stamp-pop`, 기존 `pixel-clear-pop`과 동일하게 `steps()`로 픽셀 느낌 유지), 읽는 중은 "ing" 뒤에 점이 `.`→`..`→`...`→`..` 순으로 450ms 간격 반복되는 `IngDots` 컴포넌트.
- [x] 96. `src/components/BookFormModal.jsx` 신규(추가/수정 겸용) — 제목(필수)/저자/상태(읽는 중·읽음 토글 버튼)/표지 사진(선택, 기존 `compressPhoto`로 업로드 전 자동 압축). `src/components/BookViewModal.jsx` 신규 — 큰 표지+제목+저자+상태+등록자 이름, 수정/삭제 버튼. 삭제는 기존 공용 `ConfirmDialog` 재사용(detail=책 제목).
- [x] 97. 오른쪽 아래 픽셀 "+" 버튼 — `Layout.jsx`의 하단 탭바와 동일한 `fixed bottom-0 left-1/2 max-w-md -translate-x-1/2` 중앙정렬 트릭을 그대로 써서, 데스크톱 폭에서도 앱 컬럼 안쪽에 고정되고 탭바에 가리지 않도록 안전 여백을 둠.
- [x] 98. `src/lib/store.js` — `books` CRUD 4종(list/add/update/delete) + `resolveBookCoverUrl`('book-covers' 버킷 signed URL) 추가. comments와 동일하게 `isTableMissing`(PGRST205/42P01) 가드를 적용해 마이그레이션 전에도 에러로 화면이 깨지지 않게 함. 로컬 모드는 `dday_books` localStorage 키+ 표지는 `fileToDataUrl`로 저장. `subscribeToChanges`에 `books` 테이블 리스너 추가.
- [x] 99. `supabase/migration_004_books.sql` 신규 — `books` 테이블(제목/저자/상태 체크 제약/표지 경로/등록자 user_id) + RLS는 **본인 제한 없이 허용된 사용자(둘) 전원에게 select/insert/update/delete 전부 허용**(요구사항이 "둘 다 가능"이라 date_records/comments의 본인 전용 패턴과 의도적으로 다르게 설계), `book-covers` 비공개 스토리지 버킷 신설(삭제도 둘 다 가능 — photos 버킷의 본인만 삭제 정책과 다름), Realtime 방송 대상에 `books` 추가. 기존 테이블/데이터는 전혀 건드리지 않음.
- [x] 100. 로컬 모드 390px에서 실물 테스트 — 빈 책장(책 0권) → 책 4권 추가(읽는 중/읽음 섞어서) → 책장에 책등 색색으로 채워짐 + 요약 숫자 정확 → 목록 펼치기/접기 → 정렬(읽는 중 먼저, 각각 최근순) 확인 → 표지 없는 책 첫 글자 자동 생성 확인 → 상세 팝업(큰 표지/저자/상태/등록자) → 삭제 확인 팝업(취소 시 안 지워짐, 확인 시 실제 삭제) → 수정(상태 변경 후 재정렬 확인) → 아주 긴 제목/저자 말줄임 확인. 전부 통과.
- [x] 101. `npm run build` 성공 확인.
- [ ] 102. 단계별 커밋, push, 배포 확인.
- [ ] 103. migration_004_books.sql 채팅에 코드블록으로 전달 + 실행 전/후 확인 방법 안내.

## 10차 요청 (2026-10-01) — migration_003 재실행 에러 수정

- [x] 104. `migration_004_books.sql`에 003(date_records/comments) 내용이 섞여 있는지 grep으로 확인 — 섞여있지 않음(주석에서만 비교 언급), 에러의 실제 원인은 `migration_003_comments.sql` 자체의 멱등성 버그였음을 확인.
- [x] 105. `migration_003_comments.sql`의 `date_records_insert_own`/`update_own`/`delete_own`, `photos_delete_own` 4개 정책 — 옛 이름만 drop하고 자기 자신 이름은 drop 안 하던 버그 수정(자기 이름 drop 1줄씩 추가). `schema.sql`/`migration_004_books.sql`은 애초부터 멱등이라 수정 불필요(grep으로 재확인).
- [ ] 106. 수정 사항 커밋/푸시(SQL이라 배포 파이프라인과는 무관, 코드 빌드 영향 없음).
- [ ] 107. migration_004_books.sql만 다시 전달(003은 이미 라이브에 적용/검증 완료 상태라 재실행 불필요, 지금 재실행해도 안전은 하지만 필수는 아님).

## 11차 요청 (2026-10-01) — 북클럽 목록 배지/페이지 나누기

- [x] 108. "ing" 배지를 "읽음!"과 같은 크기의 테두리 배지로 변경 — 읽음!은 흰 배경(`bg-pastel-bg`)+핑크 테두리로 명확히 하고, ing는 진한 핑크 배경(`bg-pastel-accent` #FF8FB8)+흰 글씨+핑크 테두리로 색 구분. 두 배지 모두 `w-14` 고정 폭(`inline-flex items-center justify-center`)을 둬서 점 개수(`.`→`..`→`...`→`..`)가 바뀌어도 배지 폭이 흔들리지 않게 함.
- [x] 109. 목록 정렬을 "읽는 중 먼저" 그룹핑 제거하고 전체를 최신 등록순(`createdAt` desc)으로 단순화.
- [x] 110. 페이지네이션 추가 — `PAGE_SIZE=5`, 책장 아래(목록 아래) "◀ N / M ▶" 픽셀 버튼. 첫/마지막 페이지에서 해당 화살표 `disabled`(흐리게), 5권 이하면 페이지 컨트롤 자체를 숨김. `totalPages` 변경 시 `page`를 자동 clamp하는 `useEffect`로 "삭제로 현재 페이지가 비면 이전 페이지로" 구현. 책 추가 성공 시(수정이 아닐 때만) `setPage(1)`로 자동 이동.
- [x] 111. 로컬 모드 390px에서 책 12~14권으로 실물 테스트 — 배지 색/크기/고정폭 확인, 페이지 1→2→3 이동, 마지막 페이지 삭제로 페이지 수 줄어들 때 자동으로 앞 페이지로 이동하는 것까지 확인, 책 추가 시 1페이지로 복귀 확인.
- [x] 112. `npm run build` 성공 확인.
- [ ] 113. 커밋, push, 배포 확인.

## 12차 요청 (2026-10-01) — 북클럽 "ing" 배지 탭으로 완독 처리

- [x] 114. `src/components/ConfirmDialog.jsx`에 `confirmLabel`/`cancelLabel` props 추가(기본값 "삭제"/"취소"로 기존 호출부는 전혀 안 바뀜) — 공용 팝업 컴포넌트 그대로 재사용하면서 문구만 바꿀 수 있게 함.
- [x] 115. `src/pages/BookClub.jsx` — `StatusBadge`의 ing 배지를 클릭 가능하게 변경(`onRequestMarkRead`), 클릭 시 `e.stopPropagation()`으로 책 상세 팝업이 같이 안 열리게 막음. "읽음!" 배지는 onClick 자체가 없어 탭하면 그대로 행(row) 클릭이 버블링돼 상세 팝업이 열림(기존 동작 유지, 되돌리기는 거기서 수정으로).
- [x] 116. "다 읽으셨습니까?" 확인 팝업(`confirmingReadBook` state) — detail에 책 제목, cancelLabel="아직...", confirmLabel="읽었어!". 확인 시 `updateBook(id, { title, author, status: 'read' })` 호출(title/author는 기존 값 그대로 보존해서 날아가지 않게 함) 후 `load()`로 목록/요약 숫자 즉시 갱신. 배지가 read로 바뀌면 기존 `pixel-stamp-pop` 애니메이션이 자동 재생됨(같은 DOM 노드에 새 animation class가 적용되는 CSS 기본 동작).
- [x] 117. 로컬 모드 390px 실물 테스트 — ing 배지 탭 시 상세 팝업 안 열리고 확인 팝업만 뜨는 것, "아직..." 시 상태 불변, "읽었어!" 시 status=read + author 보존 + 요약 숫자(읽은 책/읽는 중) 즉시 갱신 + 배지가 읽음!으로 바뀌는 것, 읽음! 배지는 자체 반응 없이 행 클릭이 그대로 통과해 상세 팝업이 열리는 것까지 확인. 상대방 실시간 반영은 기존 `subscribeToChanges`+Realtime 구조를 그대로 타므로 별도 코드 불필요(단일 기기 로컬 모드라 실제 멀티 기기 테스트는 불가 — 라이브 배포 후 실사용으로 확인 필요).
- [x] 118. `npm run build` 성공 확인.
- [ ] 119. 커밋, push, 배포 확인.

## 13차 요청 (2026-10-01) — 북클럽 한줄평 기능

- [x] 120. `src/lib/store.js` — `book_reviews` CRUD 4종(list/listAll/add/update/delete) 추가, 기존 `isTableMissing` 가드 재사용(마이그레이션 전에도 에러로 안 깨짐), 로컬 모드는 `dday_book_reviews` 키 + `deleteBook`의 로컬 분기에서 연관 한줄평도 같이 삭제(FK cascade가 없는 로컬 모드 보정). `subscribeToChanges`에 `book_reviews` 테이블 추가.
- [x] 121. `src/components/ConfirmDialog.jsx`에 이미 추가돼 있던 `confirmLabel`/`cancelLabel`을 한줄평 삭제에도 그대로 재사용(기본값 "삭제"/"취소").
- [x] 122. `src/components/BookReviewSection.jsx` 신규 — 책 하나당 한줄평 최대 2개(내 것/상대 것) 표시. 내 한줄평 있으면 말풍선(작성자+내용+날짜)+수정/삭제, 없으면 "+ 한줄평 남기기" 버튼. 입력 중엔 textarea(50자 제한)+남은 글자 수+취소/저장. 상대 한줄평 있으면 말풍선(조회만), 없으면 "아직 한줄평이 없어요" 흐리게 표시. 삭제는 공용 `ConfirmDialog` 재사용(detail=한줄평 내용 20자 미리보기).
- [x] 123. `src/components/BookViewModal.jsx` — "등록: OOO" 아래에 `BookReviewSection` 삽입, 팝업을 `max-h-[85vh]` + 본문 `overflow-y-auto`로 재구성해서 내용이 길어져도 헤더/하단 버튼은 고정된 채 본문만 스크롤되게 함. `currentUserId`/`authorName`/`onReviewsChanged` props 추가.
- [x] 124. `src/pages/BookClub.jsx` — `listAllBookReviews()`로 책별 한줄평 개수를 집계해 목록 제목 옆에 `💬N` 표시(기존 댓글 개수 표시와 동일 패턴), `BookViewModal`에 `currentUserId`/`authorName`/`onReviewsChanged={load}` 전달, 모달 `onClose`에서도 `load()` 호출해 로컬 모드에서 개수가 즉시 갱신되게 함.
- [x] 125. `supabase/migration_005_book_reviews.sql` 작성 — `book_reviews` 테이블((book_id,user_id) 유니크, content 50자 체크 제약, book_id는 books에 on delete cascade), RLS는 조회=allowed_members 전원, 작성/수정/삭제=본인(user_id=auth.uid())만. 모든 정책이 "자기 이름 drop 후 생성" 패턴이라 몇 번을 실행해도 안전(migration_003 재실행 버그를 반복하지 않게 처음부터 멱등하게 작성). Realtime 등록. 기존 데이터는 전혀 건드리지 않음.
- [x] 126. 로컬 모드 390px 실물 테스트 — 💬 개수 표시, 상세 팝업에서 한줄평 섹션(내 것 추가/수정/수정취소/삭제, 상대 것 표시/수정삭제버튼 없음), 50자 제한+남은 글자 수, 삭제 확인 팝업, 책 삭제 시 한줄평도 같이 사라지는 것(로컬 cascade 보정)까지 확인. 실제 두 계정 멀티기기 realtime 동기화는 로컬 모드 특성상 테스트 불가 — 기존 comments/books와 동일한 `subscribeToChanges` 구조를 그대로 타므로 배포 후 라이브 계정으로 확인 필요.
- [x] 127. `npm run build` 성공 확인.
- [ ] 128. 커밋, push, 배포 확인.
- [ ] 129. migration_005_book_reviews.sql 채팅에 코드블록으로 전달 + 실행 안내.

## 14차 요청 (2026-10-01) — 읽는 중인 책은 한줄평 작성 차단

- [x] 130. `src/components/BookReviewSection.jsx`에 `bookStatus` prop 추가. 내 한줄평이 없을 때: `read`면 기존처럼 활성 버튼, `reading`이면 비활성 버튼(배경 `#E5DDE0`/글자 `#A8949B`, `pixel-btn` 제외해서 그림자 없음, `disabled`) + 안내문구 "다 읽어야 한줄평을 남길 수가 있어요." 상대방 한줄평이 없을 때 보이던 "아직 한줄평이 없어요"도 `reading`이면 숨김. 내 한줄평이 이미 있으면(상태를 읽는 중으로 되돌린 경우 포함) 버튼 자체가 안 보이고 기존 한줄평 말풍선(수정/삭제 포함)이 그대로 유지됨 — 별도 분기 없이 "새로 작성" 버튼만 상태에 따라 막은 구조라 자연히 요구사항 충족.
- [x] 131. `src/components/BookViewModal.jsx` — 상태 배지를 `read`면 기존처럼 정적 표시, `reading`이면 리스트의 ing 배지와 같은 색(진한 핑크+흰 글씨)으로 클릭 가능하게 변경, 탭하면 "다 읽으셨습니까?"(아직.../읽었어!) 확인 팝업 → 확인 시 `updateBook`으로 상태를 읽음으로 저장하고 `onBookUpdated` 콜백 호출. 팝업을 닫지 않고도 책 상세 안에서 바로 완독 처리 가능해짐.
- [x] 132. `src/pages/BookClub.jsx` — `load()`가 책 목록을 새로고침할 때마다 현재 열려있는 `viewBook`도 최신 데이터로 동기화(`bookList.find`)하도록 수정. 이 덕분에 (a) 상세 팝업 안에서 직접 완독 처리했을 때, (b) 상대방이 다른 기기에서 완독 처리해서 realtime으로 반영됐을 때 모두, 열려있는 팝업의 상태/한줄평 작성 가능 여부가 닫았다 열 필요 없이 즉시 갱신됨. `BookViewModal`에 `onBookUpdated={load}` 전달.
- [x] 133. 로컬 모드 390px 실물 테스트 — 읽는 중 책 상세 열어서 비활성 버튼+안내문구+플레이스홀더 숨김 확인 → 상세 안의 "읽는 중" 배지 탭해서 완독 확인 팝업 → 확인 시 팝업 닫지 않고 바로 버튼 활성화+안내문구 사라짐+"아직 한줄평이 없어요" 노출 확인 → 한줄평 작성 → 수정 폼에서 상태를 다시 "읽는 중"으로 되돌리고 저장 → 재진입 시 기존 한줄평은 그대로(수정/삭제 가능) + 새로 쓰기 버튼은 안 보이는 것(= 작성 자체가 막힌 상태) 확인. 전부 통과.
- [x] 134. `npm run build` 성공 확인.
- [ ] 135. 커밋, push, 배포 확인.

## 15차 요청 (2026-10-01) — "상대방 책만 한줄평 비활성화 안 됨" 버그 조사

- [x] 136. `src/pages/BookClub.jsx`/`BookViewModal.jsx`/`BookReviewSection.jsx`/`BookFormModal.jsx`/`store.js` 전체에서 `status === 'read'`/`'reading'` 비교 지점을 grep으로 전수 확인 — 모두 책 상태(`bookStatus`/`book.status`)만 비교하고 등록자(`userId`/`createdBy`)와 섞인 조건은 어디에도 없음. 필드명/문자열 리터럴도 전부 동일(오타·대소문자 차이 없음).
- [x] 137. 로컬 모드에서 "내가 등록 + 읽는 중", "상대가 등록 + 읽는 중", "상대가 등록 + 읽음" 3가지 조합을 직접 만들어 테스트 — 전부 코드 그대로 올바르게 동작함(상대 책이어도 읽는 중이면 버튼 비활성화+안내문구, 읽음으로 바뀌면 즉시 활성화). **코드 로직 자체에는 등록자 기준 버그가 없음을 확인.**
- [x] 138. 실제 원인으로 **PWA 서비스워커 캐시**를 지목 — `vite-plugin-pwa`의 기본 주입 스크립트(`registerSW.js`)는 `navigator.serviceWorker.register()`만 하고 끝나서, 이미 열려있던 PWA 세션(특히 홈 화면에 띄워두고 오래 켜둔 폰)은 새 배포가 서버에 올라가도 탭을 완전히 새로고침하기 전까진 메모리에 로드된 옛 JS를 계속 실행함 — "한 사람 기기는 최신, 다른 사람 기기는 예전 빌드"가 되는 전형적인 원인. 이번 버그 신고 시점이 "읽는 중 책 한줄평 차단" 기능을 배포한 지 얼마 안 된 시점이라 실제로 이 캐시 문제가 원인이었을 가능성이 높음.
- [x] 139. **근본 수정** — `vite.config.js`에 `injectRegister: false` + `workbox.skipWaiting: true`/`clientsClaim: true` 추가, `src/lib/registerServiceWorker.js` 신규(`virtual:pwa-register`로 직접 등록 + `controllerchange` 이벤트에서 자동 새로고침 1회 + 1시간마다 `registration.update()`로 새 버전 명시적 확인), `src/main.jsx`에서 앱 렌더 전 호출. 이제 배포만 하면 열려있던 세션도 짧은 시간 안에 자동으로 최신 버전으로 넘어감(수동 강제종료/재설치 불필요).
- [x] 140. `npm run build`로 `dist/registerSW.js`가 더 이상 별도 생성되지 않고 등록 로직이 메인 번들에 포함됐는지, `vite preview`로 실제 빌드 산출물에서 서비스워커가 정상 등록(active)되는지 확인.
- [x] 141. `npm run build` 성공 확인.
- [ ] 142. 커밋, push, 배포 확인. 배포 후 두 분 모두 **한 번은 수동으로 앱을 완전히 종료 후 재실행**(또는 새로고침)해서 이번 배포분을 받아야 함 — 그 이후부터는 자동 업데이트가 적용됨.

## 16차 요청 (2026-10-02) — 홈 화면 커플 픽셀 캐릭터 + 꾸미기

- [x] 143. `src/lib/pixelGrid.js` 신규 — 16x24 문자열 그리드('#'=칠해짐) ↔ boolean 배열 변환 공용 유틸(icons.jsx의 PixelIcon 패턴을 아바타용으로 일반화).
- [x] 144. `src/lib/avatarParts.js` 신규 — 완전히 새로 그린 16x24 픽셀 아트: 공용 몸(피부) 1종, 머리 남성 6종/여성 6종, 상의 6종(원피스 포함), 하의 5종, 신발 4종. 전부 손으로 그린 문자열 그리드이며, 길이 16자 검증을 Node 스크립트로 전수 확인함(실수로 한 글자 빠진 행 없음). 6색 공용 컬러 팔레트, 기본 코디, `MALE_EMAIL`/`FEMALE_EMAIL`/이름 폴백(지민/은지, allowed_members와 동일) 상수 정의.
- [x] 145. `src/components/AvatarSVG.jsx` 신규 — 레이어 순서(몸→신발→하의→상의→머리)대로 `<rect>`를 겹쳐 그리는 합성 방식(나중 레이어가 자연히 앞 레이어를 덮으므로 별도 병합 계산 불필요). 원피스(`isDress`) 선택 시 하의 레이어 자체를 렌더링하지 않음.
- [x] 146. `src/components/AvatarCustomizeModal.jsx` 신규 — 위: 선택 즉시 반영되는 큰 미리보기, 가운데: 머리/상의/하의/신발 4탭(원피스 선택 시 하의 탭 비활성화 — 회색+클릭 막음), 아래: 4열 픽셀 썸네일 그리드 + 색상 칩 6개, 하단 취소/저장.
- [x] 147. `src/components/AvatarViewModal.jsx` 신규 — 상대 캐릭터용 보기 전용 팝업("OOO의 코디" 제목, 꾸미기 버튼 없이 미리보기만).
- [x] 148. `src/lib/store.js` — `avatars` CRUD 2종(list/save, upsert 기반) 추가, `email`/`display_name` 컬럼을 스냅샷으로 저장해 "이메일로 남성/여성 캐릭터를 매칭"하는 방식 구현(auth.users 직접 조회 없이 클라이언트에서 매칭 가능). 로컬 모드는 이메일이 없어 항상 `MALE_EMAIL`로 저장(로컬 테스터=남성 캐릭터 고정). `subscribeToChanges`에 `avatars` 추가.
- [x] 149. `src/pages/Home.jsx` — 메뉴 패널 아래에 캐릭터 2명 + 사이 하트 + 이름(내 캐릭터는 실시간 authorName, 상대는 저장된 display_name 스냅샷, 둘 다 없으면 지민/은지 폴백) 표시. 내 이메일(`user.email`)과 `MALE_EMAIL`/`FEMALE_EMAIL`을 비교해 "내 캐릭터"를 판별, 탭하면 내 것은 꾸미기 팝업, 상대 것은 보기 전용 팝업이 열리도록 분기.
- [x] 150. `src/index.css`에 `avatar-idle` 키프레임 추가(1초 간격 2프레임 토글, `steps(1,end)`로 픽셀 느낌 유지), 두 캐릭터에 0.5초 애니메이션 딜레이 차이를 줘서 따로 통통 튀게 함.
- [x] 151. `supabase/migration_006_avatars.sql` 작성 — `avatars` 테이블(사람당 1행), RLS는 조회=allowed_members 둘 다, 작성/수정/삭제=본인(user_id=auth.uid())만(= "각자 자기 캐릭터만 꾸미기 가능"을 DB 레벨에서 강제). 모든 정책이 자기 이름을 drop한 뒤 생성하는 패턴이라 몇 번을 실행해도 안전. Realtime 등록.
- [x] 152. 로컬 모드 390px 실물 테스트 — 기본 코디로 두 캐릭터가 메뉴 아래 공간에 탭바 안 가리고 딱 들어오는 것 확인 → 내 캐릭터(지민) 탭 → 꾸미기 팝업에서 머리(포니테일)+상의(후드, 그린) 변경 → 저장 즉시 홈 화면에 반영 확인 → 원피스 선택 시 하의 탭 비활성화 확인(미리보기에 치마 모양 원피스가 정상 렌더링) → 상대 캐릭터(은지) 탭 → "은지의 코디" 보기 전용 팝업(꾸미기 버튼 없음) 확인. 전부 통과.
- [x] 153. `npm run build` 성공 확인.
- [ ] 154. 커밋, push, 배포 확인.
- [ ] 155. migration_006_avatars.sql 채팅에 코드블록으로 전달 + 실행 안내.

## 17차 요청 (2026-10-02) — 커플 캐릭터 재설계 (꾸미기 전체 제거 + 퀄리티 최우선 재작업)

- [x] 156. 꾸미기 기능 전체 삭제 — `src/components/AvatarCustomizeModal.jsx`, `AvatarViewModal.jsx`, `src/lib/pixelGrid.js` 파일 삭제. `src/lib/store.js`에서 `listAvatars`/`saveAvatar` 함수와 `avatars` LOCAL_KEYS 항목, realtime 구독 목록의 `avatars` 리스너 제거. **`avatars` 테이블 자체는 DB에 그대로 둠**(요청대로 SQL 실행/드롭 불필요, 그냥 앱이 더 이상 읽고 쓰지 않을 뿐).
- [x] 157. `src/lib/avatarParts.js` 전면 재작성 — 24x32 그리드, rect 단위로 부위를 쌓고 배경과 맞닿는 칸에 자동으로 외곽선을 둘러주는 방식(`addOutline`)으로 구현해 외곽선이 실루엣과 항상 정확히 맞게 함. 2등신(머리 16행/몸 16행), 2x3 눈+흰자 하이라이트 1px, 볼터치, 작은 입, 피부/머리/옷 각 2단계 음영, 앞머리 지그재그 텍스처로 "덩어리감" 표현. 남성(흑갈색 단발+파스텔 블루 티셔츠+청바지+운동화)/여성(어깨길이 갈색 단발+핑크 블라우스+치마+메리제인) 각각 완전히 새로 그림. 눈 깜빡임용 대체 프레임(`MALE_BLINK_ROWS`/`FEMALE_BLINK_ROWS`)도 같은 행 문자열을 부분 치환해서 생성.
- [x] 158. `src/components/AvatarSVG.jsx` 단순화 — `rows`(문자열 배열)+`palette`(글자→색상 맵)만 받아 그대로 `<rect>`로 그리는 순수 렌더러로 교체(이전의 레이어 합성/옵션 조회 로직 전부 제거).
- [x] 159. `src/pages/Home.jsx` — 캐릭터를 탭해도 팝업 없이 하트가 통통 튀어오르는 작은 애니메이션만 재생(`heart-pop`, 탭마다 key를 바꿔 재마운트시켜 연타해도 매번 재생), 1초 간격 아이들 바운스는 유지하되 두 캐릭터가 서로를 향해 살짝 기울어지도록 CSS `rotate(±4deg)` 추가, 2.5~5.5초 랜덤 간격으로 150ms 눈 깜빡임(`useBlink` 훅, 두 캐릭터 독립적으로 동작). 패널을 캐릭터 크기(96×128px, 4배 확대)에 맞춰 패딩을 줄임.
- [x] 160. `src/index.css`에 `heart-pop` 키프레임 추가(통통 튀어오르며 사라짐, `forwards`로 끝에 고정).
- [x] 161. **반드시 확대 캡처해서 직접 확인** — 브라우저에서 SVG를 일시적으로 크게 스케일링해 이목구비·비율·외곽선을 확인. 1차 결과에서 입 위치가 턱 쪽에 너무 붙어 보여 한 칸 위(볼터치 바로 아래)로 옮기고 재확인 — 자연스러운 이목구비 배치 완성. 실제 배포 크기(96x128)로도 재확인, 홈 화면 박스 안에 탭바 안 가리고 비율 좋게 들어가는 것도 확인.
- [x] 162. `npm run build` 성공 확인, 삭제한 컴포넌트/함수에 대한 잔여 참조 없음을 grep으로 확인.
- [ ] 163. 커밋, push, 배포 확인.

## 18차 요청 (2026-10-03) — 첨부 이미지로 홈 커플 캐릭터 교체

- [x] 164. 첨부된 건 PNG 2장이 아니라 **한 장(1408x1117, 불투명 흰 배경, 왼쪽=은지/오른쪽=지민)**이라 한 장에서 두 캐릭터를 분리해서 처리. 원본은 `scripts/characters-source.webp`로 저장.
- [x] 165. `scripts/process-characters.py`(Pillow+numpy) 작성 — 배경 제거(가장자리 flood fill, 안쪽 흰 디테일 보존) → 두 캐릭터 분리 → 공용 k-means 팔레트로 색 단순화 → 칸별 팔레트 번호 다수결로 축소 → ≤16색 병합(결과 각 7색), 알파는 0/255만 → 24x32 캔버스에 발(맨 아래 행) 정렬, 가로 중앙. `public/characters/{jimin,eunji}.png` + `-blink.png` 생성.
- [x] 166. **원본이 균일한 격자가 아님**(칸 크기 19~24px로 들쭉날쭉한 AI 생성 "픽셀풍" 이미지) → 격자 자동 감지(자기상관/에지 정렬/분산 최소화)는 전부 불안정해서, 캐릭터 bbox를 세로 32칸 정수로 정확히 나누는 방식으로 변경. 두 캐릭터 모두 세로 32칸이 되도록 칸 크기를 따로 잡아(은지 20.8px, 지민 22.5px) 크기·발 위치를 동일하게 맞춤.
- [x] 167. 1차 시도에서 눈이 통째로 사라지는 버그 — 근사 색을 그대로 다수결하면 검정 계열 노이즈가 여러 구간으로 쪼개져 평평한 피부색이 이기는 문제. 공용 팔레트 번호 다수결로 바꾸고, 눈은 원본에서 "양옆이 피부색인 어두운 덩어리"로 찾아 칸 좌표(1x2)로 직접 찍음.
- [x] 168. 눈 감은 프레임 — 눈 칸을 피부색으로 되돌리고 아래쪽 한 줄만 어둡게(바깥쪽으로 가로 2칸).
- [x] 169. 홈 적용 — `CoupleSprite.jsx`(눈 뜬/감은 이미지를 겹쳐 두고 hidden 토글, 96x128=4배, `image-rendering: pixelated`), 기존 SVG 코드(`AvatarSVG.jsx`, `avatarParts.js`) 삭제, 이메일/이름 상수는 `src/lib/couple.js`로 분리. 눈 깜빡임 3~5초 랜덤, 통통 바운스(-4px = 스프라이트 1픽셀). **이전의 ±4도 기울임은 제거**(픽셀 아트를 회전하면 계단 현상이 생김). 탭하면 하트 뿅은 유지.
- [x] 170. 390px 실물 확인(이미지 로딩 24x32, 렌더 96x128, 눈 깜빡임 토글, 탭 하트, 팝업 없음), `npm run build` 성공.
- [ ] 171. 커밋, push, 배포 확인.
