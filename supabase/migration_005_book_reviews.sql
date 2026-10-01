-- ============================================================================
-- Migration 005: 북클럽 한줄평 (book_reviews 테이블)
--
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.
-- 몇 번을 실행해도 안전합니다(create table if not exists, drop policy if exists
-- + 자기 자신 이름 재생성 패턴 — migration_003에서 발견된 재실행 버그를 반복하지
-- 않도록 모든 정책에 동일하게 적용). 기존 date_records/comments/todos/books
-- 데이터는 전혀 건드리지 않습니다.
--
-- 이 마이그레이션이 하는 일:
--   1) book_reviews 테이블 신설
--      - (book_id, user_id) 유니크 제약으로 "한 사람당 책 1권에 1개"를 DB 레벨에서 강제
--      - content는 50자 제한을 DB에도 체크 제약으로 걸어둠(클라이언트 검증과 이중 방어)
--      - book_id는 books(id)를 on delete cascade로 참조 → 책 삭제 시 한줄평도 자동 삭제
--   2) RLS: 조회는 allowed_members 둘 다 가능, 작성/수정/삭제는 본인(user_id = auth.uid())만
--   3) Realtime 방송 대상에 추가
-- ============================================================================

create table if not exists public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_by text not null, -- 작성 당시 표시 이름 스냅샷 (앱 표시용)
  content text not null check (char_length(content) <= 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, user_id)
);

create index if not exists book_reviews_book_id_idx on public.book_reviews (book_id);

alter table public.book_reviews enable row level security;

grant select, insert, update, delete on public.book_reviews to authenticated;

drop policy if exists "book_reviews_select_members" on public.book_reviews;
create policy "book_reviews_select_members" on public.book_reviews
  for select using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "book_reviews_insert_own" on public.book_reviews;
create policy "book_reviews_insert_own" on public.book_reviews
  for insert with check (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
    and user_id = auth.uid()
  );

drop policy if exists "book_reviews_update_own" on public.book_reviews;
create policy "book_reviews_update_own" on public.book_reviews
  for update using (user_id = auth.uid());

drop policy if exists "book_reviews_delete_own" on public.book_reviews;
create policy "book_reviews_delete_own" on public.book_reviews
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Realtime: book_reviews 테이블도 방송 대상에 추가 (멱등 — 여러 번 실행해도 안전)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'book_reviews'
  ) then
    alter publication supabase_realtime add table public.book_reviews;
  end if;
end $$;

-- ============================================================================
-- 끝.
--
-- 실행 전/후 확인 방법:
--   - 실행 전: 책 상세 팝업에서 "한줄평" 섹션이 "아직 한줄평 기능 준비 중이에요"
--     안내만 뜨고 나머지는 에러 없이 정상 동작.
--   - 실행 후: 책 상세에서 "+ 한줄평 남기기" → 작성 → 💬1 표시 확인 → 상대방
--     계정으로 같은 책에 한줄평 추가 → 💬2 확인 → 내 것만 수정/삭제 버튼이 보이고
--     상대 것은 안 보이는지 → 책을 삭제하면 한줄평도 같이 사라지는지 확인.
-- ============================================================================
