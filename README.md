# 우리 디데이 — 귀가 후 할 일 ✅

앱은 다 만들어졌고 `npm run build`까지 성공 확인했어요. 아래 순서대로만 하면 끝!

## 1. Supabase에 테이블 만들기 (SQL 실행)

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트(`nlwajjurwlhvlvyaumsc`) → **SQL Editor** 열기
2. [`supabase/schema.sql`](supabase/schema.sql) 파일 내용 전체를 복사해서 붙여넣고 **Run**
   - 테이블 3개(`relationship`, `date_records`, `todos`) + RLS 정책 + `photos` 스토리지 버킷/정책이 한 번에 생성돼요.

## 2. 계정 2개 만들기

앱 접속 → **회원가입** 버튼으로 각자 이메일/비밀번호로 가입 (2명 모두).

> Supabase 프로젝트 설정에서 "Confirm email"이 켜져 있으면 가입 후 확인 메일의 링크를 눌러야 로그인이 됩니다. (Authentication → Providers → Email에서 끄면 확인 메일 없이 바로 로그인 가능)

가입 후 아무 계정으로나 로그인해서 "사귄 날짜"를 한 번 입력하면 둘이 같은 데이터를 보게 돼요.

## 3. 로컬에서 확인하기

```bash
cd ~/projects/couple-dday
npm run dev
```

브라우저에서 `http://localhost:5173` 접속해서 로그인 → 메인/달력/투두 한번씩 눌러보기.

## 4. GitHub에 올리고 GitHub Pages로 배포하기

```bash
cd ~/projects/couple-dday
gh repo create couple-dday --private --source=. --remote=origin
git push -u origin main
```

레포 이름을 `couple-dday`가 아닌 다른 이름으로 만들었다면 [`vite.config.js`](vite.config.js)의 `BASE_PATH` 값을 `"/실제-레포이름/"`으로 바꾸고 다시 커밋하세요.

그다음:

1. GitHub 레포 → **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정
2. GitHub 레포 → **Settings → Secrets and variables → Actions**에서 Repository secret 2개 추가:
   - `VITE_SUPABASE_URL` = `https://nlwajjurwlhvlvyaumsc.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (`.env` 파일에 있는 anon key)
3. `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드/배포해요. 몇 분 뒤 `https://<깃허브아이디>.github.io/couple-dday/` 에서 접속 가능.

## 5. (선택) 홈 화면에 앱처럼 추가하기 (PWA)

배포된 주소를 모바일 브라우저로 열고 "홈 화면에 추가"를 누르면 앱처럼 아이콘이 생겨요.

---

## 무엇을 만들었는지

커플 2인 전용 디데이 웹앱입니다.

- **메인**: 사귄 날 기준 오늘 며칠째 + 가장 가까운 기념일 D-day + 다가오는 기념일 5개
- **달력**: 월별 캘린더, 기념일(100일 단위/매년 N주년) 표시, 날짜를 누르면 제목·메모·사진으로 데이트 기록
- **투두**: 둘이 공유하는 할 일 목록 (추가/체크/삭제, 작성자 표시)
- **로그인**: Supabase Auth 이메일 로그인, RLS로 우리 둘 계정만 데이터 접근 가능
- Supabase 키가 없으면 자동으로 이 기기(브라우저)의 localStorage에만 저장되는 모드로 동작 (지금 `.env`에는 키가 이미 들어있어서 Supabase 모드로 동작 중)

## 기술 스택

Vite + React (JS) · Tailwind CSS · react-router-dom (Hash 라우팅) · Supabase (Auth/DB/Storage) · date-fns · browser-image-compression · vite-plugin-pwa

## 프로젝트 진행 기록

애매한 부분을 어떻게 가정하고 진행했는지는 [`DECISIONS.md`](DECISIONS.md), 전체 작업 단계는 [`PROGRESS.md`](PROGRESS.md)에 남겨뒀어요.

## 자주 쓰는 명령어

```bash
npm run dev       # 로컬 개발 서버
npm run build     # 프로덕션 빌드 (dist/ 생성)
npm run preview   # 빌드 결과 미리보기
npm run gen-icons # PWA 아이콘 재생성 (scripts/gen-icons.mjs)
```
