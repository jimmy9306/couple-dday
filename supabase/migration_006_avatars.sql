-- ============================================================================
-- Migration 006: 홈 화면 커플 픽셀 캐릭터 (avatars 테이블)
--
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.
-- 몇 번을 실행해도 안전합니다(create table if not exists + 모든 정책이 자기 이름을
-- drop한 뒤 생성하는 패턴). 기존 date_records/comments/todos/books/book_reviews
-- 데이터는 전혀 건드리지 않습니다.
--
-- 이 마이그레이션이 하는 일:
--   1) avatars 테이블 신설 — 사람(user_id)당 한 줄, 머리/상의/하의/신발 스타일+색상
--      - email/display_name은 표시용 스냅샷(앱이 상대방 캐릭터 이름을 보여줄 때 씀)
--   2) RLS: 조회는 allowed_members 둘 다 가능, 작성/수정/삭제는 본인(user_id=auth.uid())만
--      → "남성 캐릭터(jiminppoppo93@gmail.com)/여성 캐릭터(eunjippoppo95@gmail.com)는
--        각자 자기 것만 꾸밀 수 있다"는 요구사항을 DB 레벨에서도 강제
--   3) Realtime 방송 대상에 추가 — 상대가 옷을 바꾸면 내 홈 화면에도 바로 반영
-- ============================================================================

create table if not exists public.avatars (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  hair text not null default 'short',
  hair_color text not null default '#3A3A3A',
  top text not null default 'tshirt',
  top_color text not null default '#6B8CBE',
  bottom text not null default 'jeans',
  bottom_color text not null default '#3A3A3A',
  shoes text not null default 'sneakers',
  shoes_color text not null default '#F2C14E',
  updated_at timestamptz not null default now()
);

alter table public.avatars enable row level security;

grant select, insert, update, delete on public.avatars to authenticated;

drop policy if exists "avatars_select_members" on public.avatars;
create policy "avatars_select_members" on public.avatars
  for select using (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
  );

drop policy if exists "avatars_insert_own" on public.avatars;
create policy "avatars_insert_own" on public.avatars
  for insert with check (
    exists (select 1 from public.allowed_members am where am.email = (auth.jwt() ->> 'email'))
    and user_id = auth.uid()
  );

drop policy if exists "avatars_update_own" on public.avatars;
create policy "avatars_update_own" on public.avatars
  for update using (user_id = auth.uid());

drop policy if exists "avatars_delete_own" on public.avatars;
create policy "avatars_delete_own" on public.avatars
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Realtime: avatars 테이블도 방송 대상에 추가 (멱등 — 여러 번 실행해도 안전)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'avatars'
  ) then
    alter publication supabase_realtime add table public.avatars;
  end if;
end $$;

-- ============================================================================
-- 끝.
--
-- 실행 전/후 확인 방법:
--   - 실행 전: 홈 화면에 캐릭터 2명이 기본 코디로 뜨고, 탭해도 "준비 중" 없이 그냥
--     저장이 안 될 뿐 화면은 안 깨짐(코드가 isTableMissing 가드로 빈 배열 처리함).
--   - 실행 후: 내 캐릭터 탭 → 꾸미기 팝업에서 머리/상의/하의/신발 바꿔서 저장 →
--     즉시 반영되는지 → 상대 캐릭터 탭하면 보기 전용 팝업만 뜨는지(꾸미기 버튼 없음) →
--     상대방 계정으로 옷을 바꾸면 내 홈 화면에도 새로고침 없이 반영되는지 확인.
-- ============================================================================
