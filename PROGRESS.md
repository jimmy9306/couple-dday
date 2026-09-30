# 진행 상황

자율 진행 중 이 파일을 계속 갱신합니다. 중간에 끊기면 여기부터 이어서 진행.

## 상태: 완료 ✅ (귀가 후 README.md 체크리스트만 진행하면 됨)

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
