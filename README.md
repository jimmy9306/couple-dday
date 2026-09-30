# 우리 디데이 — 귀가 후 할 일 ✅

앱은 다 만들어졌고 `npm run build`까지 성공 확인했어요. 이제 "우리 둘만" 쓸 수 있게 잠그는 절차까지 포함해서, 아래 순서대로만 하면 끝!

## 1. schema.sql에 우리 둘 이메일 채워넣기

1. 에디터로 [`supabase/schema.sql`](supabase/schema.sql) 파일을 엽니다.
2. 맨 위쪽 `insert into public.allowed_members (email) values ...` 부분의 자리표시자 2개를
   실제 로그인에 쓸 이메일 2개로 바꿉니다.

   ```sql
   insert into public.allowed_members (email) values
     ('본인 실제 이메일'),
     ('연인 실제 이메일')
   on conflict (email) do nothing;
   ```
3. 저장합니다. (이 파일은 git에 커밋해도 되는 파일이라, 원하면 나중에 `git add`/`git commit` 해도 돼요 — 비밀번호나 키가 아니라 이메일 주소만 들어가요.)

## 2. Supabase에 테이블 만들기 (SQL 실행)

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트(`nlwajjurwlhvlvyaumsc`) → **SQL Editor** 열기
2. 방금 이메일을 채운 [`supabase/schema.sql`](supabase/schema.sql) 파일 내용 **전체**를 복사해서 붙여넣고 **Run**
   - `allowed_members`(허용 이메일 2개) + 테이블 3개(`relationship`, `date_records`, `todos`) + 이메일 기반 RLS + `photos` 스토리지 버킷/정책 + Realtime 등록이 한 번에 처리돼요.
   - **이 SQL이 곧 "누가 이 앱을 쓸 수 있는지"를 정하는 부분**이라, 이메일을 제대로 넣었는지 한 번 더 확인하고 실행하세요.

## 3. 계정 2개 만들기

앱 접속 → **회원가입** 버튼으로 **1번에서 등록한 이메일 2개로만** 각자 가입합니다.

> Supabase 프로젝트 설정에서 "Confirm email"이 켜져 있으면 가입 후 확인 메일의 링크를 눌러야 로그인이 됩니다. (Authentication → Providers → Email에서 끄면 확인 메일 없이 바로 로그인 가능)

> ⚠️ `allowed_members`에 없는 이메일로 가입/로그인하면 앱이 "초대된 사용자만 이용 가능" 화면만 보여주고 데이터는 아예 못 봐요 (RLS로 DB 단에서도 막혀있음). 오타 없이 정확히 같은 이메일로 가입하세요.

로그인 후 아무 계정에서나 **설정 탭**에서 "만난 날"을 입력하면 둘 다 똑같은 데이터를 실시간으로 보게 돼요. 설정 탭에서 각자 "표시 이름"도 설정해두면 투두/데이트 기록에 작성자로 표시됩니다.

## 4. 로컬에서 확인하기

```bash
cd ~/projects/couple-dday
npm run dev
```

브라우저에서 `http://localhost:5173` 접속해서 로그인 → LOVE QUEST 홈 화면에서 디데이/달력/투두/설정 한번씩 눌러보기. 되도록 두 계정으로 각각 다른 브라우저(또는 시크릿 창)에 로그인해서, 한쪽에서 투두를 추가했을 때 다른 쪽에 새로고침 없이 뜨는지 확인해보면 좋아요 (Realtime 동작 확인).

## 5. GitHub에 올리고 GitHub Pages로 배포하기

**gh(GitHub CLI)가 없다면 먼저 설치하고 로그인하세요:**

```bash
brew install gh
gh auth login
```

그다음 저장소를 만들고 push:

```bash
cd ~/projects/couple-dday
gh repo create couple-dday --public --source=. --remote=origin
git push -u origin main
```

> `--public`으로 만드는 이유: GitHub 무료 계정은 **private 저장소에서는 GitHub Pages를 쓸 수 없어요.** 코드가 공개되긴 하지만, Supabase anon key는 원래 클라이언트(브라우저)에 노출되는 게 정상인 키이고(비밀키 아님), 실제 접근 제어는 `allowed_members` + RLS가 DB 단에서 해주기 때문에 코드가 공개돼도 우리 둘 외에는 데이터를 볼 수 없어요. `.env`(로컬의 실제 키 값)는 `.gitignore`에 있어서 애초에 저장소에 올라가지 않고, 배포 때 필요한 키는 GitHub Secrets로만 주입돼요.

레포 이름을 `couple-dday`가 아닌 다른 이름으로 만들었다면 [`vite.config.js`](vite.config.js)의 `BASE_PATH` 값을 `"/실제-레포이름/"`으로 바꾸고 다시 커밋하세요.

그다음:

1. GitHub 레포 → **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정
2. GitHub 레포 → **Settings → Secrets and variables → Actions**에서 Repository secret 2개 추가:
   - `VITE_SUPABASE_URL` = `https://nlwajjurwlhvlvyaumsc.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (`.env` 파일에 있는 anon key)
3. `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드/배포해요. 몇 분 뒤 `https://<깃허브아이디>.github.io/couple-dday/` 에서 접속 가능.

## 6. (선택) 홈 화면에 앱처럼 추가하기 (PWA)

배포된 주소를 모바일 브라우저로 열고 "홈 화면에 추가"를 누르면 앱처럼 아이콘이 생겨요.

## 7. 둘 다 가입 끝나면 — 추가 가입 막기 🔒

두 계정 가입/로그인이 다 확인되면, Supabase 대시보드 → **Authentication → Providers → Email**에서
**"Allow new users to sign up"을 꺼주세요.**

`allowed_members`가 데이터 접근 자체는 이미 막아주지만, 이 옵션을 꺼두면 제3자가 애초에 계정을 만드는 것 자체를 막을 수 있어서 한 번 더 안전해져요.

---

## 무엇을 만들었는지

**딱 둘(연인 2명)만 쓸 수 있는** 디데이 웹앱입니다. 디자인은 "파스텔 핑크 픽셀 RPG" 컨셉 — 크림 핑크 배경(#FFF4F7) 위에 5색(배경/박스/포인트/테두리·그림자/글자)만 쓰는 픽셀 폰트(Galmuri) UI, 네온/글로우 없이 각진 테두리 + 블러 없는 하드 섀도우.

- **홈(LOVE QUEST)**: RPG 메인 화면. 타이틀 + 대화창 스타일 박스에 "우리가 만난 지 N일째"와 LOVE 게이지(직전→다음 기념일 진행률 HP바), 그 아래 RPG 메뉴(디데이/달력/투두/설정, 깜빡이는 ▶ 커서로 선택 표시).
- **디데이**: 만난 날 기준 오늘 며칠째 + 가장 가까운 기념일 D-day + 다가오는 기념일 5개 목록. 만난 날이 없으면 입력창부터 표시.
- **달력**: 월별 캘린더를 픽셀 타일로, 기념일 칸은 하트 아이콘, 기록 있는 날은 작은 점. 날짜를 누르면 제목·메모·사진으로 데이트 기록.
- **투두**: 둘이 공유하는 할 일 목록 (추가/체크/삭제, 작성자 표시). 완료 체크 시 "CLEAR!" 짧게 표시.
- **설정**: 만난 날 수정(둘 중 누구나), 내 표시 이름 설정
- 하단에는 빠른 이동용 탭바(홈/디데이/달력/투두/설정)도 항상 떠 있어요.
- **로그인**: Supabase Auth 이메일 로그인. `allowed_members` 테이블에 등록된 이메일 2개만 가입 여부와 무관하게 데이터 접근 가능 (RLS로 DB 단에서 강제) — 그 외 계정은 로그인은 되더라도 "초대된 사용자만 이용 가능" 화면만 보임
- **실시간 동기화**: Supabase Realtime으로 상대방이 추가/수정/삭제하면 새로고침 없이 화면에 반영
- Supabase 키가 없을 때만(개발용) localStorage 모드로 동작 — 화면 상단에 "테스트 모드 - 공유 안 됨" 배지가 항상 표시됨. 키가 있으면(지금 `.env`에 이미 들어있음) 무조건 로그인 필수, localStorage 모드로 절대 안 빠짐.

## 기술 스택

Vite + React (JS) · Tailwind CSS · Galmuri(픽셀 폰트) · react-router-dom (Hash 라우팅) · Supabase (Auth/DB/Storage/Realtime) · date-fns · browser-image-compression · vite-plugin-pwa

## 프로젝트 진행 기록

애매한 부분을 어떻게 가정하고 진행했는지는 [`DECISIONS.md`](DECISIONS.md), 전체 작업 단계는 [`PROGRESS.md`](PROGRESS.md)에 남겨뒀어요.

## 자주 쓰는 명령어

```bash
npm run dev       # 로컬 개발 서버
npm run build     # 프로덕션 빌드 (dist/ 생성)
npm run preview   # 빌드 결과 미리보기
npm run gen-icons # PWA 아이콘 재생성 (scripts/gen-icons.mjs)
```
