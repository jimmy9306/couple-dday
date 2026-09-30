-- ============================================================================
-- 커플 디데이 앱 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.
--
-- 설계 전제 (DECISIONS.md 참고):
--   이 Supabase 프로젝트에는 우리 둘의 계정만 존재한다고 가정하고,
--   "로그인한 사용자(authenticated)"면 전체 데이터에 read/write 가능하도록
--   RLS를 단순하게 구성했습니다. 커플 매칭/초대코드 같은 멀티테넌시 기능은 없습니다.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. relationship: 사귄 날짜 (앱 전체에서 사용하는 단일 row)
-- ----------------------------------------------------------------------------
create table if not exists public.relationship (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  updated_at timestamptz not null default now()
);

alter table public.relationship enable row level security;

drop policy if exists "relationship_select_authenticated" on public.relationship;
create policy "relationship_select_authenticated" on public.relationship
  for select using (auth.role() = 'authenticated');

drop policy if exists "relationship_insert_authenticated" on public.relationship;
create policy "relationship_insert_authenticated" on public.relationship
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "relationship_update_authenticated" on public.relationship;
create policy "relationship_update_authenticated" on public.relationship
  for update using (auth.role() = 'authenticated');

drop policy if exists "relationship_delete_authenticated" on public.relationship;
create policy "relationship_delete_authenticated" on public.relationship
  for delete using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 2. date_records: 캘린더 데이트 기록 (제목/메모/사진)
-- ----------------------------------------------------------------------------
create table if not exists public.date_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text,
  memo text,
  photo_path text, -- storage 'photos' 버킷 내 경로 (공개 URL 아님, signed URL로 읽음)
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists date_records_date_idx on public.date_records (date);

alter table public.date_records enable row level security;

drop policy if exists "date_records_select_authenticated" on public.date_records;
create policy "date_records_select_authenticated" on public.date_records
  for select using (auth.role() = 'authenticated');

drop policy if exists "date_records_insert_authenticated" on public.date_records;
create policy "date_records_insert_authenticated" on public.date_records
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "date_records_update_authenticated" on public.date_records;
create policy "date_records_update_authenticated" on public.date_records
  for update using (auth.role() = 'authenticated');

drop policy if exists "date_records_delete_authenticated" on public.date_records;
create policy "date_records_delete_authenticated" on public.date_records
  for delete using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 3. todos: 둘이 공유하는 투두리스트
-- ----------------------------------------------------------------------------
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  done boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

drop policy if exists "todos_select_authenticated" on public.todos;
create policy "todos_select_authenticated" on public.todos
  for select using (auth.role() = 'authenticated');

drop policy if exists "todos_insert_authenticated" on public.todos;
create policy "todos_insert_authenticated" on public.todos
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "todos_update_authenticated" on public.todos;
create policy "todos_update_authenticated" on public.todos
  for update using (auth.role() = 'authenticated');

drop policy if exists "todos_delete_authenticated" on public.todos;
create policy "todos_delete_authenticated" on public.todos
  for delete using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 4. storage: 'photos' 버킷 (비공개, signed URL로만 조회)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "photos_select_authenticated" on storage.objects;
create policy "photos_select_authenticated" on storage.objects
  for select using (bucket_id = 'photos' and auth.role() = 'authenticated');

drop policy if exists "photos_insert_authenticated" on storage.objects;
create policy "photos_insert_authenticated" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');

drop policy if exists "photos_update_authenticated" on storage.objects;
create policy "photos_update_authenticated" on storage.objects
  for update using (bucket_id = 'photos' and auth.role() = 'authenticated');

drop policy if exists "photos_delete_authenticated" on storage.objects;
create policy "photos_delete_authenticated" on storage.objects
  for delete using (bucket_id = 'photos' and auth.role() = 'authenticated');

-- ============================================================================
-- 끝. 이 아래로는 실행할 필요 없음.
-- 이후 회원가입은 앱의 "회원가입" 버튼으로 이메일 2개를 등록하면 됩니다.
-- (Supabase 대시보드 Authentication 설정에서 "Confirm email"이 켜져 있으면
--  가입 시 확인 메일을 받아야 로그인할 수 있습니다.)
-- ============================================================================
