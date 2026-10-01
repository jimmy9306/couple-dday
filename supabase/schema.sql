-- ============================================================================
-- 커플 디데이 앱 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.
--
-- 설계 전제 (DECISIONS.md 참고):
--   이 앱은 딱 두 사람(연인 두 명)만 쓴다는 게 핵심 요구사항입니다.
--   그래서 "로그인한 사용자 전체 허용"이 아니라, allowed_members 테이블에
--   등록된 이메일 2개만 모든 데이터에 read/write 할 수 있도록 RLS를 구성했습니다.
--   (Supabase Auth 자체는 별도 설정 없이는 이메일 가입을 막지 않기 때문에,
--    "가입은 됐지만 허용 목록엔 없는" 제3자가 생겨도 데이터는 절대 못 보게 하는
--    이중 방어선입니다.)
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 0. allowed_members: 이 앱을 쓸 수 있는 이메일 딱 2개
--    아래 INSERT의 자리표시자를 본인 이메일 2개로 바꾼 뒤 실행하세요.
--    (이 테이블은 앱에서 직접 추가/수정하지 않고, 여기 SQL로만 관리합니다.)
-- ----------------------------------------------------------------------------
create table if not exists public.allowed_members (
  email text primary key
);

alter table public.allowed_members enable row level security;

-- 본인 이메일 row만 조회 가능 (앱이 "나는 허용된 사용자인가?"를 확인하는 용도).
-- insert/update/delete 정책은 일부러 만들지 않음 -> 앱에서는 절대 수정 불가,
-- SQL Editor(소유자 권한)에서만 관리.
drop policy if exists "allowed_members_select_self" on public.allowed_members;
create policy "allowed_members_select_self" on public.allowed_members
  for select using (email = (auth.jwt() ->> 'email'));

insert into public.allowed_members (email) values
  ('jiminppoppo93@gmail.com'),
  ('eunjippoppo95@gmail.com')
on conflict (email) do nothing;

-- ----------------------------------------------------------------------------
-- 이후 모든 테이블의 RLS는 아래 패턴을 공통으로 씀:
--   "내 로그인 이메일이 allowed_members에 존재하는가?"
-- allowed_members 자체가 "본인 이메일만 select 가능"하게 막혀 있어서,
-- 이 EXISTS는 항상 "내 이메일"에 대해서만 결과가 나옴 (다른 사람 이메일 유출 없음).
-- ----------------------------------------------------------------------------

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
drop policy if exists "relationship_select_members" on public.relationship;
create policy "relationship_select_members" on public.relationship
  for select using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "relationship_insert_authenticated" on public.relationship;
drop policy if exists "relationship_insert_members" on public.relationship;
create policy "relationship_insert_members" on public.relationship
  for insert with check (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "relationship_update_authenticated" on public.relationship;
drop policy if exists "relationship_update_members" on public.relationship;
create policy "relationship_update_members" on public.relationship
  for update using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "relationship_delete_authenticated" on public.relationship;
drop policy if exists "relationship_delete_members" on public.relationship;
create policy "relationship_delete_members" on public.relationship
  for delete using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

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
drop policy if exists "date_records_select_members" on public.date_records;
create policy "date_records_select_members" on public.date_records
  for select using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "date_records_insert_authenticated" on public.date_records;
drop policy if exists "date_records_insert_members" on public.date_records;
create policy "date_records_insert_members" on public.date_records
  for insert with check (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "date_records_update_authenticated" on public.date_records;
drop policy if exists "date_records_update_members" on public.date_records;
create policy "date_records_update_members" on public.date_records
  for update using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "date_records_delete_authenticated" on public.date_records;
drop policy if exists "date_records_delete_members" on public.date_records;
create policy "date_records_delete_members" on public.date_records
  for delete using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

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
drop policy if exists "todos_select_members" on public.todos;
create policy "todos_select_members" on public.todos
  for select using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "todos_insert_authenticated" on public.todos;
drop policy if exists "todos_insert_members" on public.todos;
create policy "todos_insert_members" on public.todos
  for insert with check (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "todos_update_authenticated" on public.todos;
drop policy if exists "todos_update_members" on public.todos;
create policy "todos_update_members" on public.todos
  for update using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "todos_delete_authenticated" on public.todos;
drop policy if exists "todos_delete_members" on public.todos;
create policy "todos_delete_members" on public.todos
  for delete using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

-- ----------------------------------------------------------------------------
-- 4. storage: 'photos' 버킷 (비공개, signed URL로만 조회)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "photos_select_authenticated" on storage.objects;
drop policy if exists "photos_select_members" on storage.objects;
create policy "photos_select_members" on storage.objects
  for select using (
    bucket_id = 'photos'
    and exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "photos_insert_authenticated" on storage.objects;
drop policy if exists "photos_insert_members" on storage.objects;
create policy "photos_insert_members" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "photos_update_authenticated" on storage.objects;
drop policy if exists "photos_update_members" on storage.objects;
create policy "photos_update_members" on storage.objects
  for update using (
    bucket_id = 'photos'
    and exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "photos_delete_authenticated" on storage.objects;
drop policy if exists "photos_delete_members" on storage.objects;
create policy "photos_delete_members" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

-- ----------------------------------------------------------------------------
-- 5. 권한(GRANT): RLS 정책과는 별개로 꼭 필요함
--    SQL Editor에서 테이블을 만들면(대시보드 Table Editor와 달리) authenticated
--    롤에 테이블 자체의 기본 GRANT가 자동으로 안 붙어서, RLS 정책이 맞아도
--    "permission denied for table ..." 로 전부 막힘. 그래서 명시적으로 부여함.
-- ----------------------------------------------------------------------------
grant usage on schema public to authenticated;

grant select on public.allowed_members to authenticated;
grant select, insert, update, delete on public.relationship to authenticated;
grant select, insert, update, delete on public.date_records to authenticated;
grant select, insert, update, delete on public.todos to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Realtime: 상대방이 추가/수정하면 새로고침 없이 반영되도록 방송 대상 테이블 등록
--    (이미 등록돼 있으면 조용히 건너뜀 — 여러 번 실행해도 안전)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'relationship'
  ) then
    alter publication supabase_realtime add table public.relationship;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'date_records'
  ) then
    alter publication supabase_realtime add table public.date_records;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'todos'
  ) then
    alter publication supabase_realtime add table public.todos;
  end if;
end $$;

-- ============================================================================
-- 끝. 이 아래로는 실행할 필요 없음.
--
-- 다음 순서로 진행하세요:
--   1) 이 파일 맨 위 allowed_members INSERT의 이메일 2개를 실제 이메일로 바꿔서 실행
--   2) 앱의 "회원가입" 버튼으로 그 이메일 2개로 각자 가입
--      (Supabase 대시보드 Authentication 설정에서 "Confirm email"이 켜져 있으면
--       가입 시 확인 메일 링크를 눌러야 로그인 가능)
--   3) 두 명 가입이 끝나면 Supabase 대시보드 > Authentication > Providers > Email
--      에서 "Allow new users to sign up"을 꺼서 추가 가입을 막으세요.
--      (allowed_members로 데이터 접근은 이미 막혀 있지만, 신원 도용/스팸 가입
--       자체를 막는 한 번 더 안전장치입니다.)
-- ============================================================================
