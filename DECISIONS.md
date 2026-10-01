# 자율 진행 중 내린 결정 기록

애매한 부분은 아래처럼 합리적으로 가정하고 진행합니다. 마음에 안 드는 게 있으면 나중에 알려주세요.

## 0. 개발 환경
- 시스템에 Node.js가 없어서 `brew install node`로 설치함 (Node 26, npm 11).

## 1. 기술 스택
- Vite + React (JavaScript, TypeScript 아님) — 빠른 완성이 목표라 타입 설정 오버헤드 생략.
- 스타일링: Tailwind CSS — 모바일 우선 UI를 빠르고 일관되게 만들기 위해 채택.
- 라우팅: react-router-dom (HashRouter) — GitHub Pages 배포 시 서버 리라이트 설정 없이도 새로고침/딥링크가 깨지지 않도록 BrowserRouter 대신 HashRouter 사용.
- 날짜 계산: date-fns
- 이미지 압축: browser-image-compression (업로드 전 클라이언트에서 긴 변 1600px로 리사이즈)
- PWA: vite-plugin-pwa (자동 업데이트 서비스워커 + manifest)

## 2. 데이터 모델 / Supabase 구조
- 이 앱은 "커플 한 쌍 전용" 개인 프로젝트로 가정 (여러 커플이 같은 배포본을 쓰는 멀티테넌시 아님).
- 따라서 커플 매칭/초대 코드 같은 기능은 만들지 않고, **이 Supabase 프로젝트에 가입한 인증 사용자 전원(=우리 둘)이 같은 데이터를 공유**하는 구조로 설계함.
  - RLS 정책: `auth.role() = 'authenticated'` 이면 전체 read/write 허용.
  - 데이터 격리는 "이 프로젝트에는 우리 둘 계정만 존재한다"는 운영 규칙으로 보장 (계정 2개 생성은 귀가 후 README 체크리스트에 있음).
- 테이블 3개: `relationship`(사귄 날짜, 단일 row), `date_records`(캘린더 기록), `todos`(공유 투두).
- 사진은 Supabase Storage `photos` 버킷에 저장, RLS와 동일한 authenticated 정책 적용.
- service_role 키는 절대 사용하지 않음 (schema.sql은 SQL Editor에서 사용자가 직접 실행).

## 3. localStorage 폴백 모드
- `.env`에 Supabase URL/anon key가 없으면 자동으로 localStorage 모드로 동작.
- localStorage 모드에는 Supabase Auth가 없으므로, 최초 1회 "이름"을 입력받아 브라우저에 저장하고 이후 작성자 표시에 사용 (로그인 화면 대신 "이름 설정" 화면으로 대체).
- localStorage 모드의 사진은 base64로 인코딩해 압축 후 저장 (용량 주의 문구 표시).

## 4. 기념일 계산 규칙
- 1일차 = 사귄 날 당일.
- 100일 단위 기념일: 100일, 200일, 300일 ... 정각 도달일.
- 주년: 사귄 날로부터 매년 같은 날짜 (윤년 2/29 시작인 경우 평년에는 2/28로 처리).
- "다가오는 기념일 5개"는 오늘 이후(오늘 포함) 가장 가까운 것부터 100일 단위 + 주년을 합쳐서 정렬 후 5개.

## 5. 배포
- GitHub Pages 배포를 "가능하게 설정"만 하고 실제 push/배포는 하지 않음 (지시사항).
- `vite.config.js`의 `base`는 `/couple-dday/`로 가정 (레포 이름을 couple-dday로 만든다고 가정). 레포 이름이 다르면 귀가 후 README 체크리스트에서 base 값 수정 필요.
- 배포용 GitHub Actions workflow 파일을 포함해서, push만 하면 자동 배포되게 준비.

## 6. 아이콘
- 실제 디자인 리소스가 없어서, 빌드 스크립트(`scripts/gen-icons.mjs`)로 하트 모양 PNG 아이콘을 코드로 생성함 (외부 이미지 생성 도구 미사용).

## 7. (수정 요청 반영) 2인 전용 접근 제어
- `allowed_members` 테이블에 이메일 딱 2개만 저장하고, 모든 테이블의 RLS를 "로그인 전체 허용"에서
  "내 로그인 이메일이 allowed_members에 있는가(EXISTS 서브쿼리)"로 변경.
- `allowed_members`는 본인 이메일 row만 select 가능하도록 RLS를 걸고, insert/update/delete 정책은
  아예 만들지 않음 → 앱에서는 절대 추가/변경 불가, SQL Editor(테이블 소유자 권한)로만 관리.
  이렇게 하면 다른 테이블의 EXISTS 서브쿼리도 "내 이메일" 기준으로만 평가되어 안전함.
- 이메일 값은 schema.sql 맨 위 INSERT 문에 자리표시자로 남겨두고, 사용자가 직접 채워 넣도록 함.
- 로그인은 됐지만 allowed_members에 없는 사용자는 `App.jsx`의 `NotAllowed` 화면만 보게 하고
  앱의 나머지 라우트/데이터에는 접근 자체가 안 됨 (RLS가 최종 방어선, 화면은 UX용).

## 8. (수정 요청 반영) 표시 이름 저장 위치
- Supabase 모드: 별도 profiles 테이블을 만들지 않고 `auth.updateUser({ data: { display_name } })`로
  Supabase Auth의 user_metadata에 저장 (간단하고, RLS 걱정이 없음).
- 로컬(개발) 모드: 기존과 동일하게 localStorage에 저장.
- 작성자 표시(`created_by`)는 매 저장 시점의 표시 이름을 텍스트로 그대로 저장 — 이름을 나중에 바꿔도
  과거 기록의 작성자 텍스트는 소급 변경되지 않음 (간단함 우선, 스냅샷 방식).

## 9. (수정 요청 반영) 실시간 동기화 방식
- Supabase Realtime의 `postgres_changes`를 `relationship`/`date_records`/`todos` 테이블에 구독.
- 변경 이벤트가 오면 diff를 계산하지 않고 해당 화면의 데이터를 통째로 다시 불러오는 방식(단순 재조회)으로 구현.
  데이터량이 개인 커플 앱 규모라 성능 문제가 없고, 이벤트 payload를 세밀하게 머지하는 코드보다
  훨씬 버그가 적음.
- `schema.sql`에 `alter publication supabase_realtime add table ...`을 멱등하게(이미 등록돼 있으면 건너뜀) 추가.
- 로컬(개발) 모드는 기기가 하나뿐이라 realtime 구독을 아예 하지 않음(no-op).

## 10. (수정 요청 반영) "레트로 게임 메뉴판 + 파스텔 네온" 리디자인
- 팔레트: `tailwind.config.js`의 `love-*` 색상값 자체를 라일락/핑크(`#C77DD6` 계열)로 교체.
  기존 코드 전반이 `love-500`/`love-600` 등 시맨틱 이름을 쓰고 있어서, 값만 바꿔도 전 화면에
  일관되게 새 팔레트가 적용되도록 함 (클래스명을 일일이 바꾸는 것보다 값 교체가 안전하고 빠름).
- 글로우: box-shadow/text-shadow 조합을 `index.css`에 `.frame-glow`/`.text-glow`/`.text-glow-strong`
  유틸리티 클래스로 정의해서 재사용. 순수 CSS(그라디언트/네온 이미지 X)라 다크 배경 없이도
  밝은 크림 핑크 배경 위에서 은은하게만 보이도록 강도를 낮게 잡음.
- 폰트: 새 폰트 파일을 추가하지 않고 기존처럼 `Pretendard`를 시스템 폰트로 참조하되, `body`
  기본 굵기를 300(Thin)으로 낮춰 "가는 둥근 고딕" 느낌을 내고, 큰 숫자/타이틀만 `font-black`/
  `font-extrabold`로 대비를 줌.
- 아이콘: 하트/달력/체크/선물/톱니 5종을 외부 아이콘셋 없이 `src/components/icons.jsx`에 순수
  SVG stroke 라인아트로 직접 제작 (원작 캐릭터/로고 미사용).
- 메인 화면 구조 변경: 기존에는 "/"(Main.jsx)가 디데이 숫자+기념일 목록을 한 화면에 다 보여줬는데,
  이번 요청의 "게임 메뉴판" 컨셉에 맞춰 "/"를 LOVEPAD 메뉴 허브(Menu.jsx)로 바꾸고, 디데이 숫자는
  `/dday`(DDay.jsx)로, 기념일 5개 목록은 새 페이지 `/anniversaries`(Anniversaries.jsx)로 분리함.
  "기존 기능은 절대 빼지 말라"는 지시에 따라 두 기능 모두 그대로 유지하되 위치만 재구성.
  하단 탭 내비게이션은 사용성을 위해 유지하고(홈/디데이/달력/투두/기념일/설정 6개), 새로 스타일만
  네온 테마로 맞춤 — 게임 메뉴판이 "허브"이고 하단 탭은 빠른 이동 수단이라는 이중 구조.
- 메뉴 탭 애니메이션: 클릭 시 `is-pressed` 클래스를 잠깐 토글해 `@keyframes lp-flash`(배경색 살짝
  깜빡임 + 아이콘 글로우 강해짐)를 재생한 뒤 150ms 후 라우트 이동 — 애니메이션이 보이기도 전에
  화면이 바뀌지 않도록 약간의 지연을 둠.
- 로그인 화면 타이틀도 "우리 디데이" 대신 "LOVEPAD"로 통일 (메뉴 화면과 동일 톤 유지).

## 11. (수정 요청 반영) 배포 시 저장소 공개 범위
- 요청대로 README의 `gh repo create`를 `--public`으로 변경함 — GitHub 무료 플랜은 private 저장소에서
  GitHub Pages를 못 쓰기 때문. `.env`(Supabase anon key)는 `.gitignore`에 있어 저장소에 올라가지 않고,
  배포 시 필요한 키는 GitHub Actions Secrets로만 주입됨 (anon key 자체는 클라이언트에 노출되는 게
  정상이지만, 그래도 레포에 하드코딩하지 않고 Secrets 경유로 빌드 타임에 주입하는 구조 유지).

## 12. (수정 요청 반영) "파스텔 핑크 픽셀 RPG" 리디자인 — 네온/글로우 완전 제거
- 이전(10번) 리디자인에서 만든 네온/글로우 스타일(`frame-glow`/`text-glow`, box-shadow blur)을
  전부 제거하고 5색 고정 팔레트(`bg #FFF4F7 / box #FFC8DD / accent #FF8FB8 / border·shadow #D6457A
  / text #5A2A3A`)로 새로 교체. `tailwind.config.js`의 `love-*` 스케일을 통째로 걷어내고
  `pastel.{bg,box,accent,border,text}` 5개 키만 남겨서, 다른 색이 실수로 섞여 들어갈 여지를 원천 차단함.
  `index.css`에 `* { border-radius: 0 !important; }`도 걸어서 rounded 클래스가 어딘가 남아있어도
  강제로 각지게 만듦(안전망).
- 폰트: `npm i galmuri` 설치 후 `main.jsx`에서 `galmuri/dist/galmuri.css`를 그대로 import(요청대로).
  다만 이 CSS 하나에 Galmuri7/9/11/11-Bold/11-Condensed/14/Mono 등 9종 폰트가 전부 선언돼 있어서,
  vite-plugin-pwa가 오프라인 캐시(precache)에 전부 담아버리면 3.8MB나 됨 — 실제로 쓰는 건
  Galmuri11/Galmuri14 두 개뿐이라, `vite.config.js`의 workbox `globIgnores`로 나머지 굵기와
  모든 `.ttf`(구형 브라우저 폴백, woff2로 이미 커버됨)를 캐시 대상에서 제외해서 1.5MB로 줄임.
  실제 로드되는 폰트 파일 자체는 그대로(전부 설치됨), 오프라인 프리캐시 대상만 최적화한 것.
- 글자 크기는 "정수배" 규칙을 지키기 위해 Galmuri11 계열은 11px/22px, Galmuri14 계열은
  14px/28px/42px만 사용 (Tailwind 화살괄호 임의값 `text-[11px]` 등으로 명시).
- 계단식 픽셀 테두리 + 블러 없는 하드 섀도우는 `src/components/PixelPanel.jsx`라는 재사용 컴포넌트로
  구현. clip-path로 모서리를 계단 모양으로 깎은 바깥(테두리색)+안쪽(박스색) 2겹 구조를 만들고,
  `filter: drop-shadow(4px 4px 0 #D6457A)`로 그림자를 입힘 — box-shadow 대신 filter/drop-shadow를
  쓴 이유는, box-shadow는 clip-path로 깎인 모양을 무시하고 원래 사각형 기준으로 그려지는 반면
  drop-shadow는 실제 렌더링된(계단 깎인) 실루엣을 따라가기 때문. 이 패널을 모든 화면의
  카드/박스에 공통으로 사용.
- 버튼 프레스 효과(`pixel-btn`/`pixel-tile` 클래스)는 blur 없는 오프셋 그림자를 기본으로 두고
  `:active`에서 그림자를 없애면서 `translate(2px, 2px)`로 살짝 눌리게 처리 (요청 스펙 그대로).
- 아이콘: `src/components/icons.jsx`를 16x16 픽셀 그리드 기반으로 전면 재작성 (이전의 부드러운
  stroke 라인아트 → `<rect>` 픽셀 셀로 그린 진짜 픽셀아트). `shape-rendering="crispEdges"` +
  `image-rendering: pixelated` 둘 다 적용.
- 메인 화면을 다시 "하나의 화면"으로 합침: `Home.jsx`(기존 Menu.jsx를 대체)에 LOVE QUEST 타이틀
  + RPG 대화창(만난 지 N일째) + LOVE 게이지(HP바) + RPG 메뉴(▶ 커서, 디데이/달력/투두/설정 4개)를
  전부 담음. 이번 스펙의 메뉴가 4개뿐이라 "기념일"은 최상위 메뉴/탭에서 빠졌지만, 기능 자체는
  삭제하지 않고 `DDay.jsx`(디데이 화면) 안에 "다가오는 기념일" 목록으로 다시 합쳐 넣었음
  (선물 아이콘은 거기서 섹션 제목 옆에 사용). 하단 탭도 5개(홈/디데이/달력/투두/설정)로 맞춤.
  `Anniversaries.jsx` 페이지/라우트는 삭제.
- LOVE 게이지 계산: `date-utils.js`에 `getLoveGaugeProgress()` 추가. 사귄 날을 0번째 마일스톤으로
  포함해서 "직전 마일스톤 ~ 다음 마일스톤" 사이 경과 비율(0~1)을 구하고, 10칸짜리 HP바로 반올림해
  채움 칸 수를 표시.
- 투두 "CLEAR!" 연출: 완료로 체크하는 순간에만(체크 해제 시엔 X) 0.9초짜리 pop 애니메이션 배지를
  해당 행에 `pointer-events-none`으로 겹쳐 띄우고 타임아웃으로 제거. 완료 여부 자체는 기존
  `toggleTodo` 로직 그대로 사용 (기능 변경 없음).

## 13. (실사용 테스트 중 발견) GRANT 누락 버그
- SQL Editor로 `create table`을 실행하면, 대시보드 Table Editor로 만들 때와 달리 `authenticated`
  롤에 테이블 자체의 기본 권한(GRANT)이 자동으로 붙지 않음. RLS 정책을 아무리 정확히 짜도 이
  기본 GRANT가 없으면 `permission denied for table ...`로 전부 막힘 (RLS는 "이미 권한이 있는
  요청 중 어떤 row를 보여줄지"를 거르는 것이지, 권한 자체를 만들어주지 않음).
- `schema.sql`에 `grant select/insert/update/delete ...` 구문을 추가해서 해결. `allowed_members`는
  의도적으로 `select`만 부여함 (insert/update/delete 정책 자체가 없어서 막혀 있지만, GRANT 단계에서도
  한 번 더 막아두는 이중 방어).
- 이 문제는 REST API로 직접 쿼리해서 "RLS 정책은 맞는데 permission denied가 난다"는 정확한 증상을
  확인한 뒤 원인을 특정함 — 앱 로그만 봤으면 "허용 안 된 사용자"로 오인하기 쉬운 증상이라 기록해둠.

## 14. (배포 중 확인) GitHub CLI 권한/캐시 이슈
- `gh auth login` 기본 스코프(`repo` 등)로는 `.github/workflows/*.yml`이 포함된 push가 거부됨
  ("without `workflow` scope") — `gh auth refresh -h github.com -s workflow`로 스코프를 추가해야 함.
- GitHub Pages의 Source를 "GitHub Actions"로 바꾸는 것도 대시보드 클릭 없이
  `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`로 가능함.
- 배포 직후 "로컬모드로 보이는" 문제가 있었는데, 원인은 두 가지가 겹쳤음: (1) secrets를 등록하기
  직전에 이미 push로 트리거된 워크플로우가 먼저 끝나버려서 빈 키로 빌드된 것, (2) 그걸 재배포(`gh run
  rerun`)한 뒤에도 브라우저가 이전 `index.html`을 HTTP 캐시에서 그대로 써서 새 번들을 안 가져온 것
  (서버 응답 자체는 `curl`로 확인했을 때 이미 최신이었음). 캐시 우회 쿼리스트링으로 확인 후 정상 동작 확인함.

## 15. (수정 요청 반영) 댓글 기능 + 작성자 권한을 display_name에서 user_id로 전환
- 기존에는 "작성자 본인" 판정을 `record.createdBy === authorName`(표시 이름 문자열 비교)으로
  했는데, 이번 요청("DB 단에서도 확실히 막아줘")을 계기로 실제 `auth.uid()`를 저장하는
  `date_records.user_id` / `comments.user_id` 컬럼으로 전환함. 표시 이름을 바꿔도 소유권이
  유지되는 장점이 생김 (8번 항목에 적어둔 한계를 해결).
- 로컬(개발) 모드는 실제 Supabase Auth가 없어서, 이 기기에 고정되는 임의 uuid를
  `localStorage('dday_local_user_id')`로 하나 만들어 "로컬 사용자 id"로 씀. 로컬 모드에서
  표시 이름을 바꿔도 같은 기기면 같은 user_id를 쓰므로, "상대방 시점"을 제대로 재현하려면
  (테스트 목적으로) `dday_local_user_id`를 수동으로 바꿔야 함 — 로컬 모드는 원래 "혼자 쓰는
  테스트용"이라 이 한계는 허용 범위로 봄.
- 댓글(`comments`)은 `record_id`에 `on delete cascade`를 걸어서, 게시글을 지우면 댓글도 자동으로
  같이 지워지게 함 (요청사항). 로컬 모드는 FK가 없어서 `deleteDateRecord`에서 수동으로 같은
  `recordId`의 로컬 댓글을 같이 지워서 동일하게 동작하게 맞춤.
- 댓글 개수 표시(`💬N`)는 매번 레코드별로 따로 쿼리하지 않고, 화면 진입 시 전체 댓글을
  한 번에 가져와(`listAllComments`) 클라이언트에서 레코드별로 집계함 — 개인 커플 앱 규모라
  성능 문제 없고 코드가 훨씬 단순함.
- **마이그레이션 전후 호환성**: `migration_003_comments.sql`을 실행하기 전에도 앱이 에러 없이
  동작해야 한다는 요구사항 때문에,
  - `date_records` insert 시 `user_id` 컬럼이 아직 없으면(Postgres 에러 `42703`) user_id 없이
    재시도하도록 폴백을 넣음 (글 작성 자체는 계속 됨).
  - `comments` 테이블이 아직 없으면 PostgREST가 `42P01`이 아니라 **`PGRST205`**
    ("Could not find the table ... in schema cache")로 응답한다는 걸 실제 라이브 프로젝트에
    REST API로 직접 질의해서 확인함 — 두 코드를 모두 체크하도록 수정.
  - 다만 이 안전장치는 "에러로 전체 화면이 깨지지 않는 것"까지만 보장하고, user_id가 없는
    글(마이그레이션 전에 이미 있던 글, 또는 과거 백필 실패한 글)은 **아무도 수정/삭제 버튼을
    못 보는 상태**가 됨(의도적 fail-closed). SQL 실행 직후 정상화됨.
- Storage(`photos`) 삭제 정책을 업로드한 사람(`owner = auth.uid()`)만 가능하도록 좁혔지만,
  앱이 실제로 사진 파일을 삭제하는 코드 경로는 아직 없음(게시글 삭제 시 DB row만 지우고 스토리지
  파일은 그대로 남음 — 기존부터 있던 동작, 이번 요청 범위 밖이라 그대로 둠). 정책만 미리
  강화해둔 것으로, 나중에 삭제 기능을 추가해도 바로 안전하게 동작함.

## 16. 북클럽 — books 테이블 권한을 date_records/comments와 다르게(본인 제한 없이) 설계
- 요청사항이 명시적으로 "둘 다 추가·수정·삭제 가능"이라, `date_records`/`comments`에 적용한
  "본인(user_id = auth.uid())만 수정/삭제" 패턴을 그대로 복붙하지 않고, books는 RLS를
  "허용된 사용자(둘) 전원"에게 select/insert/update/delete 모두 열어둠(schema.sql 1차 버전의
  "전원 허용" 패턴으로 되돌아간 것과 비슷). `user_id`는 저장은 하되(표시용 "등록: OOO"), 권한
  제한에는 전혀 쓰지 않음.
- 표지 스토리지도 같은 이유로 `photos` 버킷(본인만 삭제, migration_003)과 분리해서 `book-covers`
  라는 새 버킷을 만들고 삭제도 둘 다 가능하게 열어둠. 기존 `photos` 버킷 정책은 건드리지 않음.
- 표지 사진이 없을 때 보여주는 "제목 첫 글자 픽셀 표지"는 DB에 전혀 저장하지 않고
  `BookCover.jsx`에서 매번 즉석으로 렌더링함(제목 문자열을 간단히 해시해서 팔레트 2색 중
  하나를 고정 배정 — 같은 책은 항상 같은 색, 저장 공간/마이그레이션 불필요).
- 책장 그림은 SVG가 아니라 div + Tailwind 유틸리티(box-shadow 없는 flat rect들)로 그림 — 기존
  PixelPanel/아이콘들과 달리 책 "등록 개수만큼 동적으로 늘어나는" UI라 고정 SVG grid보다
  배열 기반 렌더링이 다루기 쉬웠음. 최대 표시 개수(2단 × 8칸 = 16권)를 넘으면 더 그리지 않고
  "꽉 찬 상태"로 고정 — 요약 숫자(N권)는 실제 전체 개수를 쓰므로 정확함.

## 17. migration_003의 정책 재실행 버그 수정 (재실행 시 "already exists" 에러)
- SQL Editor에서 `ERROR: 42710: policy "date_records_insert_own" for table "date_records"
  already exists` 발생 — 원인 조사 결과 `migration_004_books.sql`에는 `date_records`/`comments`
  관련 SQL이 전혀 없음(주석에서만 언급)을 확인했고, 실제 원인은 `migration_003_comments.sql`
  자체에 있던 버그였음: `date_records_insert_own`/`update_own`/`delete_own`,
  `photos_delete_own` 4개 정책이 **옛 이름(`..._members`)만 drop하고 자기 자신과 같은
  이름은 drop하지 않은 채 create**하고 있어서, 이미 한 번 적용된 DB에 003을 다시 실행하면
  (또는 재확인 차 다시 붙여넣으면) 두 번째 create에서 "이미 있다"는 에러가 났음.
  `schema.sql`은 모든 정책이 항상 "구이름 drop + 신이름(자기자신) drop" 2줄을 갖춰 애초부터
  멱등이었고, `migration_004_books.sql`도 처음부터 모든 정책이 자기 이름을 drop한 뒤
  create해서 멱등이었음 — 이번에 003의 4곳만 동일한 패턴으로 맞춰 고침.
- 이 수정은 **이미 적용된 운영 DB의 정책 내용 자체는 전혀 바꾸지 않음**(동일한 이름/조건으로
  drop 후 재생성이라 결과 동일) — 그냥 "몇 번을 실행해도 안전"하게만 만든 것.

## 18. 북클럽 한줄평 — book_reviews를 본인 전용 RLS로(books와 다르게)
- `books` 테이블은 "둘 다 추가·수정·삭제 가능"(결정 16번)이지만, 한줄평은 요청사항이
  "작성·수정·삭제는 쓴 사람 본인만"이라 `date_records`/`comments`와 같은 본인 전용
  (`user_id = auth.uid()`) 패턴으로 설계함. 조회(select)는 책과 마찬가지로
  allowed_members 둘 다 가능.
- "한 사람당 책 1권에 1개"를 `unique (book_id, user_id)` DB 제약으로 강제함 — 클라이언트
  UI(이미 내 한줄평이 있으면 "+ 한줄평 남기기" 대신 수정 모드만 보여줌)와 이중 방어.
  로컬 모드는 이 유니크 제약이 없지만, UI 흐름상 중복 생성 경로가 없어서 별도 방어 로직은
  추가하지 않음(기존 코드 스타일과 동일하게 UI가 불변식을 지키는 걸 신뢰).
- 50자 제한을 클라이언트(textarea maxLength + slice)뿐 아니라 DB `check (char_length(content)
  <= 50)` 제약으로도 걸어서, 혹시 모를 우회(직접 API 호출 등)에도 이중으로 방어함.
- migration_003에서 발견했던 "재실행 시 already-exists 에러"(결정 17번) 버그를 반복하지
  않도록, migration_005의 모든 `create policy`는 처음부터 "자기 자신과 동일한 이름을
  drop policy if exists 한 뒤 생성"하는 패턴으로 작성함.
