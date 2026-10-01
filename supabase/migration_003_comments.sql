-- ============================================================================
-- Migration 003: 댓글 기능 + 작성자 권한을 DB(RLS) 레벨에서 강제
--
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.
-- 기존 date_records/스토리지 사진 데이터는 전혀 삭제/변경하지 않습니다.
--
-- 이 마이그레이션이 하는 일:
--   1) date_records에 user_id(실제 작성자, auth.uid()) 컬럼 추가
--      - 기존 글은 현재 표시 이름과 작성 당시 created_by가 같은 사용자로
--        최선 노력 자동 연결(백필)하되, 매칭 안 되는 글은 null로 남김
--        (글/사진은 그대로 보이고 삭제되지 않음 — 다만 매칭 안 된 옛 글은
--        이후 수정/삭제가 안 될 수 있음)
--   2) comments 테이블 신설 (게시글 삭제 시 on delete cascade로 댓글도 함께 삭제)
--   3) date_records의 update/delete/insert 정책을 "허용된 사용자 전체"에서
--      "본인(user_id = auth.uid())만" 으로 강화
--   4) comments도 동일한 본인 전용 수정/삭제 정책 적용
--   5) storage(photos) 삭제 정책을 "업로드한 본인만" 으로 강화
--   6) comments 테이블을 Realtime 방송 대상에 추가
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) date_records.user_id 추가 + 최선 노력 백필
-- ----------------------------------------------------------------------------
alter table public.date_records
  add column if not exists user_id uuid references auth.users (id) on delete set null;

update public.date_records dr
set user_id = u.id
from auth.users u
where dr.user_id is null
  and dr.created_by = (u.raw_user_meta_data ->> 'display_name');

-- ----------------------------------------------------------------------------
-- 2) comments 테이블
-- ----------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.date_records (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_by text not null, -- 작성 당시 표시 이름 스냅샷 (앱 표시용)
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_record_id_idx on public.comments (record_id);

alter table public.comments enable row level security;

grant select, insert, update, delete on public.comments to authenticated;

drop policy if exists "comments_select_members" on public.comments;
create policy "comments_select_members" on public.comments
  for select using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert with check (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
    and user_id = auth.uid()
  );

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments
  for update using (user_id = auth.uid());

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3) date_records: insert/update/delete를 "허용된 사용자 전체" → "본인만"으로 강화
--    (select는 기존처럼 allowed_member 전원 조회 가능 — 그대로 둠)
-- ----------------------------------------------------------------------------
drop policy if exists "date_records_insert_members" on public.date_records;
create policy "date_records_insert_own" on public.date_records
  for insert with check (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
    and user_id = auth.uid()
  );

drop policy if exists "date_records_update_members" on public.date_records;
create policy "date_records_update_own" on public.date_records
  for update using (user_id = auth.uid());

drop policy if exists "date_records_delete_members" on public.date_records;
create policy "date_records_delete_own" on public.date_records
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4) storage(photos): 삭제는 업로드한 본인만 (select/insert는 기존처럼 공유 유지)
--    Supabase storage는 업로드 시 storage.objects.owner를 업로더의 auth.uid()로
--    자동 저장하므로, 기존에 올라간 사진들도 이미 owner가 올바르게 채워져 있음.
-- ----------------------------------------------------------------------------
drop policy if exists "photos_delete_members" on storage.objects;
create policy "photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'photos' and owner = auth.uid()
  );

-- ----------------------------------------------------------------------------
-- 5) Realtime: comments 테이블도 방송 대상에 추가 (멱등 — 여러 번 실행해도 안전)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end $$;

-- ============================================================================
-- 끝.
--
-- 실행 전/후 확인 방법:
--   - 실행 전: 기존 글 수정/삭제가 전원 가능한 상태(이전 정책) 그대로 동작.
--     앱은 에러 없이 그대로 쓸 수 있음 (댓글 UI는 아직 코드 배포 전이라 안 보임).
--   - 실행 후: 앱 배포본에서 로그인 → 아무 날짜 기록이나 열어서
--     1) 상대방이 쓴 글을 열었을 때 "수정/삭제" 버튼이 안 보이는지
--     2) 내가 쓴 글에는 "수정/삭제"가 보이고 실제로 되는지
--     3) 댓글을 달고 상대방 쪽 화면에서 새로고침 없이 뜨는지
--     를 확인하면 됨. (DECISIONS.md 참고)
-- ============================================================================
