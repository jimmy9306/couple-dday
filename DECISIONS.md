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

## 10. (수정 요청 반영) 배포 시 저장소 공개 범위
- 요청대로 README의 `gh repo create`를 `--public`으로 변경함 — GitHub 무료 플랜은 private 저장소에서
  GitHub Pages를 못 쓰기 때문. `.env`(Supabase anon key)는 `.gitignore`에 있어 저장소에 올라가지 않고,
  배포 시 필요한 키는 GitHub Actions Secrets로만 주입됨 (anon key 자체는 클라이언트에 노출되는 게
  정상이지만, 그래도 레포에 하드코딩하지 않고 Secrets 경유로 빌드 타임에 주입하는 구조 유지).
