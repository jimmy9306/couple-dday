# 우리 디데이 — 배포 완료 ✅

**1~6번은 제가 다 해놨어요.** 아래 "지금 사이트 주소"로 바로 들어가 보시면 됩니다. 남은 건 **7번(가입 막기)**과 **8번(홈 화면 추가, 선택)** 뿐이에요.

## 🔗 지금 사이트 주소

**https://jimmy9306.github.io/couple-dday/**

- `jiminppoppo93@gmail.com` / `eunjippoppo95@gmail.com` 계정으로 로그인 가능 (비밀번호: 채팅에서 알려주신 임시 비밀번호 — 로그인 후 원하면 바꾸셔도 됩니다, 단 비밀번호 변경 UI는 아직 없어서 바꾸려면 Supabase 대시보드 Authentication에서 직접 재설정해야 해요).
- 테스트하면서 넣었던 더미 데이터(만난 날짜, 테스트 투두, 테스트 사진)는 전부 지워뒀어요. 실제 만난 날짜는 로그인 후 설정 탭에서 입력해주세요.

## ✅ 실사용 테스트 결과 (2026-10-01, 두 계정으로 직접 확인)

- [x] 만난 날 입력 → 양쪽 계정에 동일하게 표시됨
- [x] 투두 추가 → 새로고침 없이 상대 쪽에 바로 반영됨 (Realtime)
- [x] 캘린더 기록 + 사진 → 새로고침 없이 상대 쪽에 보이고 사진도 정상 로드됨
- [x] 허용 목록에 없는 이메일 → "초대된 사용자만 이용 가능" 화면 정상 표시

테스트 중 SQL Editor로 테이블을 만들면 `authenticated` 롤에 기본 권한(GRANT)이 자동으로 안 붙는 Supabase 함정을 하나 발견해서 `supabase/schema.sql`에 고쳐뒀어요 (자세한 건 [DECISIONS.md](DECISIONS.md) 13번).

---

## 7. 둘 다 가입 끝났으니 — 추가 가입 막기 🔒 (이거는 꼭 해주세요)

Supabase 대시보드 → **Authentication → Providers → Email**에서
**"Allow new users to sign up"을 꺼주세요.**

`allowed_members`가 데이터 접근 자체는 이미 막아주지만(제3자가 가입해도 데이터는 절대 못 봄), 이 옵션까지 꺼두면 애초에 다른 사람이 계정을 만드는 것 자체를 막을 수 있어서 한 번 더 안전해져요.

## 8. (선택) 폰 홈 화면에 앱처럼 추가하기

위 사이트 주소를 모바일 브라우저(사파리/크롬)로 열고 **"홈 화면에 추가"**를 누르면 앱처럼 아이콘이 생겨요.

---

## (참고) 로컬에서 다시 확인하고 싶을 때

```bash
cd ~/projects/couple-dday
npm run dev
```

`http://localhost:5173` 접속 → 로그인 → LOVE QUEST 홈에서 디데이/달력/투두/설정 확인.

## (참고) 코드를 고친 뒤 다시 배포하고 싶을 때

```bash
cd ~/projects/couple-dday
git add -A
git commit -m "변경 내용"
git push
```

`main`에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드하고 몇 분 안에 위 주소에 반영돼요. GitHub Secrets(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)는 이미 등록돼 있어서 추가로 할 건 없어요.

> 배포 직후에는 가끔 브라우저가 이전 페이지를 캐시해서 옛날 화면이 보일 수 있어요. 그럴 땐 새로고침(또는 캐시 지우고 새로고침)하면 최신 버전이 보여요.

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
- Supabase 키가 없을 때만(개발용) localStorage 모드로 동작 — 화면 상단에 "테스트 모드 - 공유 안 됨" 배지가 항상 표시됨. 키가 있으면 무조건 로그인 필수, localStorage 모드로 절대 안 빠짐.

## 기술 스택

Vite + React (JS) · Tailwind CSS · Galmuri(픽셀 폰트) · react-router-dom (Hash 라우팅) · Supabase (Auth/DB/Storage/Realtime) · date-fns · browser-image-compression · vite-plugin-pwa · GitHub Actions + GitHub Pages

## 프로젝트 진행 기록

애매한 부분을 어떻게 가정하고 진행했는지는 [`DECISIONS.md`](DECISIONS.md), 전체 작업 단계는 [`PROGRESS.md`](PROGRESS.md)에 남겨뒀어요.

## 자주 쓰는 명령어

```bash
npm run dev       # 로컬 개발 서버
npm run build     # 프로덕션 빌드 (dist/ 생성)
npm run preview   # 빌드 결과 미리보기
npm run gen-icons # PWA 아이콘 재생성 (scripts/gen-icons.mjs)
```

---

## 푸시 알림 (아이폰 홈 화면 앱)

1. Supabase SQL Editor에서 `supabase/migration_007_notifications.sql` 실행 (여러 번 실행해도 안전)
2. 각자 아이폰 사파리로 사이트를 열고 **공유 → 홈 화면에 추가** → 홈 화면의 앱으로 열어 로그인
3. **설정 탭 → 알림 켜기** → 알림 허용 (iOS 16.4 이상, 홈 화면 앱에서만 가능)

Edge Function(`supabase/functions/send-push`)과 VAPID 키는 이미 배포/등록돼 있어요. 비공개 키는 Supabase secrets에만 있고, 다시 배포하려면 `supabase functions deploy send-push --no-verify-jwt --use-api --project-ref <프로젝트 ref>`.

## 알림 센터 (우측 상단 종 아이콘)

모든 화면 우측 상단의 종을 누르면 받은 알림을 최신순으로(20개씩, 스크롤하면 더) 모아 볼 수 있고, 알림을 누르면 해당 위치(달력 게시물/댓글, 투두, 북클럽 책 팝업, 디데이 기념일)로 이동해요. 푸시 알림을 눌러 앱이 열릴 때도 같은 위치로 이동해요.

- Supabase SQL Editor에서 `supabase/migration_008_notification_links.sql` 실행 (007 다음에, 여러 번 실행해도 안전 / 기존 알림 보존). 실행 전에도 종/목록은 동작하지만(옛 알림은 옛 문구로 표시, 눌러도 해당 탭으로만 이동) 새 문구·미리보기·이동 정보는 실행 후 생기는 알림부터 붙어요.
