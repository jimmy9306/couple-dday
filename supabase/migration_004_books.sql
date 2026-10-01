-- ============================================================================
-- Migration 004: 북클럽 기능 (books 테이블 + 표지 스토리지)
--
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.
-- 기존 date_records/todos/comments 데이터는 전혀 삭제/변경하지 않습니다.
--
-- 이 마이그레이션이 하는 일:
--   1) books 테이블 신설 (제목/저자/상태/표지 경로/등록자)
--   2) books의 select/insert/update/delete를 "허용된 사용자(둘) 전원"에게 허용
--      (comments/date_records와 달리 본인 전용이 아님 — 둘 다 서로의 책도
--       수정/삭제할 수 있게 하는 게 요구사항)
--   3) 'book-covers' 스토리지 버킷 신설 (비공개, signed URL로만 조회), 업로드/삭제도
--      둘 다 가능 (photos 버킷의 "본인만 삭제" 정책과 다름 — 의도적으로 다르게 설정)
--   4) books 테이블을 Realtime 방송 대상에 추가
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) books 테이블
-- ----------------------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  status text not null default 'reading' check (status in ('reading', 'read')),
  cover_path text, -- storage 'book-covers' 버킷 내 경로 (signed URL로 읽음)
  created_by text, -- 등록 당시 표시 이름 스냅샷 (앱 표시용)
  user_id uuid references auth.users (id) on delete set null, -- 등록자 (표시용, 권한 제한에는 안 씀)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.books enable row level security;

grant select, insert, update, delete on public.books to authenticated;

drop policy if exists "books_select_members" on public.books;
create policy "books_select_members" on public.books
  for select using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "books_insert_members" on public.books;
create policy "books_insert_members" on public.books
  for insert with check (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

-- 둘 다 추가/수정/삭제 가능 (본인 글만 가능한 date_records/comments와 다르게,
-- 요청사항이 "둘 다 가능"이라 user_id 제한 없이 허용된 사용자 전원에게 열어둠.
drop policy if exists "books_update_members" on public.books;
create policy "books_update_members" on public.books
  for update using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "books_delete_members" on public.books;
create policy "books_delete_members" on public.books
  for delete using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

-- ----------------------------------------------------------------------------
-- 2) storage: 'book-covers' 버킷 (비공개, signed URL로만 조회)
--    photos 버킷과 달리 삭제도 둘 다 가능하게 열어둠 (요구사항).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', false)
on conflict (id) do nothing;

drop policy if exists "book_covers_select_members" on storage.objects;
create policy "book_covers_select_members" on storage.objects
  for select using (
    bucket_id = 'book-covers'
    and exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "book_covers_insert_members" on storage.objects;
create policy "book_covers_insert_members" on storage.objects
  for insert with check (
    bucket_id = 'book-covers'
    and exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "book_covers_update_members" on storage.objects;
create policy "book_covers_update_members" on storage.objects
  for update using (
    bucket_id = 'book-covers'
    and exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "book_covers_delete_members" on storage.objects;
create policy "book_covers_delete_members" on storage.objects
  for delete using (
    bucket_id = 'book-covers'
    and exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

-- ----------------------------------------------------------------------------
-- 3) Realtime: books 테이블도 방송 대상에 추가 (멱등 — 여러 번 실행해도 안전)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'books'
  ) then
    alter publication supabase_realtime add table public.books;
  end if;
end $$;

-- ============================================================================
-- 끝.
--
-- 실행 전/후 확인 방법:
--   - 실행 전: 앱 배포본에서 "북클럽" 메뉴에 들어가면 빈 책장만 보이고, 책을
--     추가하려 하면 "아직 북클럽 기능 준비 중이에요" 안내가 뜸 (에러로 화면이
--     깨지지 않음).
--   - 실행 후: 책 추가 → 책장에 책등이 채워지는지 → 목록 펼쳐서 확인 → 상대방
--     계정으로도 똑같이 추가/수정/삭제가 되는지(권한 공유 확인) → 실시간으로
--     상대 화면에도 새로고침 없이 반영되는지 확인하면 됨.
-- ============================================================================
