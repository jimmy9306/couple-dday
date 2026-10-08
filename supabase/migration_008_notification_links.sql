-- ============================================================================
-- Migration 008: 알림 센터 — 알림에 "이동 정보" + 알림 센터용 문구/미리보기 추가
--
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.
-- 반드시 migration_007 을 먼저 실행한 뒤에 실행하세요 (007 은 이미 실행했다면 다시 안 해도 됨).
-- 몇 번을 실행해도 안전합니다(add column if not exists / create or replace /
-- drop trigger|function if exists 후 재생성). 기존 알림 행은 하나도 지우거나 바꾸지 않습니다.
--
-- 이 마이그레이션이 하는 일:
--   1) notifications 에 컬럼 추가 (전부 null 허용 → 기존 알림은 그대로 유지)
--        message      알림 센터에 보이는 문구 ("지민 님이 달력에 게시물을 등록했습니다.")
--        preview      문구 아래 작은 글씨 (투두 내용 / 댓글 앞 20자 / 게시물 제목 / 한줄평)
--        target_id    대상 id (게시물 id / 투두 id / 책 id)
--        target_date  날짜 (게시물 날짜 / 기념일 날짜)
--        comment_id   댓글 id
--      푸시 알림 자체의 제목/내용(title, body)은 그대로 둠.
--      (종류는 기존 kind 컬럼이 "이동 정보의 종류" 역할을 함)
--   2) 알림 목록을 최신순으로 20개씩 읽는 인덱스
--   3) 알림 생성 함수/트리거를 위 컬럼도 채우도록 교체 (문구의 이름은 "표시 이름" 사용)
--   4) 기념일 알림도 문구/날짜를 채우도록 교체 (pg_cron 작업은 그대로 — 이름으로 호출함)
--
-- 기존(007 이전 형식) 알림은 message 가 비어 있어서 앱이 기존 문구(body)를 보여주고,
-- 눌렀을 때는 해당 탭으로만 이동함 (이동 정보가 없으므로).
--
-- 주의: 007 을 나중에 다시 실행하면 알림 함수가 옛 버전으로 돌아가니, 그땐 이 008 을 다시 실행하세요.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) 컬럼 추가 + 인덱스
-- ----------------------------------------------------------------------------
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists preview text;
alter table public.notifications add column if not exists target_id uuid;
alter table public.notifications add column if not exists target_date date;
alter table public.notifications add column if not exists comment_id uuid;

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 2) 헬퍼
-- ----------------------------------------------------------------------------

-- 표시 이름 (설정의 표시 이름, 없으면 이메일 앞부분)
create or replace function public.user_display_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), split_part(u.email, '@', 1))
  from auth.users u
  where u.id = p_user
$$;

revoke all on function public.user_display_name(uuid) from public, anon, authenticated;

-- 미리보기용 자르기 ("가나다…")
create or replace function public.ko_clip(p_text text, p_max int)
returns text
language sql
immutable
as $$
  select case
    when p_text is null or btrim(p_text) = '' then null
    when char_length(p_text) > p_max then left(p_text, p_max) || '…'
    else p_text
  end
$$;

-- ----------------------------------------------------------------------------
-- 3) 알림 생성 헬퍼 교체 (새 컬럼 포함). 옛 시그니처는 지우고 새로 만듦.
-- ----------------------------------------------------------------------------
drop function if exists public.create_notification(uuid, uuid, text, text, text, text);
drop function if exists public.notify_other_members(text, text, text);

create or replace function public.create_notification(
  p_recipient uuid,
  p_actor uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_dedupe text default null,
  p_message text default null,
  p_preview text default null,
  p_target_id uuid default null,
  p_target_date date default null,
  p_comment_id uuid default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tab text;
begin
  v_tab := case p_kind
    when 'post' then 'calendar'
    when 'comment' then 'calendar'
    when 'todo_add' then 'todo'
    when 'todo_done' then 'todo'
    when 'book_read' then 'bookclub'
    when 'book_review' then 'bookclub'
    else 'dday'
  end;

  if exists (
    select 1 from public.notification_prefs np
    where np.user_id = p_recipient and p_kind = any (np.disabled_kinds)
  ) then
    return;
  end if;

  insert into public.notifications (
    recipient_id, actor_id, kind, tab, title, body, dedupe_key,
    message, preview, target_id, target_date, comment_id
  )
  values (
    p_recipient, p_actor, p_kind, v_tab, p_title, p_body, p_dedupe,
    p_message, p_preview, p_target_id, p_target_date, p_comment_id
  )
  on conflict do nothing;
end;
$$;

create or replace function public.notify_other_members(
  p_kind text,
  p_title text,
  p_body text,
  p_message text default null,
  p_preview text default null,
  p_target_id uuid default null,
  p_target_date date default null,
  p_comment_id uuid default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  r record;
begin
  if v_actor is null then
    return;
  end if;
  for r in
    select u.id
    from auth.users u
    join public.allowed_members am on lower(am.email) = lower(u.email)
    where u.id <> v_actor
  loop
    perform public.create_notification(
      r.id, v_actor, p_kind, p_title, p_body, null,
      p_message, p_preview, p_target_id, p_target_date, p_comment_id
    );
  end loop;
end;
$$;

revoke all on function public.create_notification(uuid, uuid, text, text, text, text, text, text, uuid, date, uuid)
  from public, anon, authenticated;
revoke all on function public.notify_other_members(text, text, text, text, text, uuid, date, uuid)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4) 행동별 트리거 함수 교체 (트리거 자체는 007 에서 이미 연결돼 있고, 함수 이름으로 호출함)
--    푸시용 title/body 는 007 그대로, 알림 센터용 message/preview/이동 정보만 추가.
-- ----------------------------------------------------------------------------

-- 달력 게시글: "지민 님이 달력에 게시물을 등록했습니다." / 미리보기 = 게시물 제목
create or replace function public.trg_notify_post() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text;
begin
  begin
    v_name := public.current_actor_name();
    perform public.notify_other_members(
      'post', '새 기록',
      v_name || public.ko_josa(v_name, '이', '가') || ' ' || to_char(new.date, 'FMMM/FMDD') || ' 기록을 남겼어요',
      v_name || ' 님이 달력에 게시물을 등록했습니다.',
      public.ko_clip(coalesce(nullif(btrim(new.title), ''), new.memo), 30),
      new.id,
      new.date,
      null
    );
  exception when others then
    raise warning 'notify post failed: %', sqlerrm;
  end;
  return null;
end;
$$;

-- 댓글: "지민 님이 은지 님의 달력 게시물에 댓글을 달았습니다." (본인 글이면 "자신의")
--       미리보기 = 댓글 앞 20자
create or replace function public.trg_notify_comment() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text;
  v_rec record;
  v_author text;
  v_self boolean;
begin
  begin
    v_name := public.current_actor_name();
    select dr.user_id, dr.date, dr.created_by into v_rec
    from public.date_records dr where dr.id = new.record_id;

    v_author := coalesce(public.user_display_name(v_rec.user_id), v_rec.created_by);
    v_self := (v_rec.user_id is not null and v_rec.user_id = auth.uid())
      or (v_rec.user_id is null and v_rec.created_by is not distinct from v_name);

    perform public.notify_other_members(
      'comment', '새 댓글',
      v_name || public.ko_josa(v_name, '이', '가') || ' 댓글을 달았어요: '
        || left(new.content, 20) || case when char_length(new.content) > 20 then '…' else '' end,
      case
        when v_self or v_author is null then v_name || ' 님이 자신의 달력 게시물에 댓글을 달았습니다.'
        else v_name || ' 님이 ' || v_author || ' 님의 달력 게시물에 댓글을 달았습니다.'
      end,
      public.ko_clip(new.content, 20),
      new.record_id,
      v_rec.date,
      new.id
    );
  exception when others then
    raise warning 'notify comment failed: %', sqlerrm;
  end;
  return null;
end;
$$;

-- 투두 추가: "지민 님이 투두리스트를 추가했습니다." / 미리보기 = 투두 내용
create or replace function public.trg_notify_todo_add() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text;
begin
  begin
    v_name := public.current_actor_name();
    perform public.notify_other_members(
      'todo_add', '새 할 일',
      '새 할 일: ' || left(new.content, 40) || case when char_length(new.content) > 40 then '…' else '' end,
      v_name || ' 님이 투두리스트를 추가했습니다.',
      public.ko_clip(new.content, 40),
      new.id,
      null,
      null
    );
  exception when others then
    raise warning 'notify todo add failed: %', sqlerrm;
  end;
  return null;
end;
$$;

-- 투두 완료: "지민 님이 투두리스트를 체크했습니다." / 미리보기 = 투두 내용
create or replace function public.trg_notify_todo_done() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text;
begin
  begin
    v_name := public.current_actor_name();
    perform public.notify_other_members(
      'todo_done', '할 일 완료',
      left(new.content, 40) || case when char_length(new.content) > 40 then '…' else '' end || ' 완료!',
      v_name || ' 님이 투두리스트를 체크했습니다.',
      public.ko_clip(new.content, 40),
      new.id,
      null,
      null
    );
  exception when others then
    raise warning 'notify todo done failed: %', sqlerrm;
  end;
  return null;
end;
$$;

-- 북클럽 읽음: "지민 님이 『책 제목』을 다 읽었습니다."
create or replace function public.trg_notify_book_read() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text;
begin
  begin
    v_name := public.current_actor_name();
    perform public.notify_other_members(
      'book_read', '독서 완료',
      v_name || public.ko_josa(v_name, '이', '가') || ' 『' || new.title || '』'
        || public.ko_josa(new.title, '을', '를') || ' 다 읽었어요',
      v_name || ' 님이 『' || new.title || '』' || public.ko_josa(new.title, '을', '를') || ' 다 읽었습니다.',
      null,
      new.id,
      null,
      null
    );
  exception when others then
    raise warning 'notify book read failed: %', sqlerrm;
  end;
  return null;
end;
$$;

-- 한줄평: "지민 님이 『책 제목』에 한줄평을 남겼습니다." / 미리보기 = 한줄평 내용
create or replace function public.trg_notify_book_review() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text;
  v_title text;
begin
  begin
    v_name := public.current_actor_name();
    select b.title into v_title from public.books b where b.id = new.book_id;
    perform public.notify_other_members(
      'book_review', '새 한줄평',
      v_name || public.ko_josa(v_name, '이', '가') || ' 『' || coalesce(v_title, '책') || '』 한줄평을 남겼어요',
      v_name || ' 님이 『' || coalesce(v_title, '책') || '』에 한줄평을 남겼습니다.',
      public.ko_clip(new.content, 50),
      new.book_id,
      null,
      null
    );
  exception when others then
    raise warning 'notify book review failed: %', sqlerrm;
  end;
  return null;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5) 기념일 알림 교체: "내일은 100일이에요!" / "오늘은 1주년이에요!" + 기념일 날짜 저장
--    (날짜 계산/대상/중복 방지/크론 작업은 007 과 동일)
-- ----------------------------------------------------------------------------
create or replace function public.notify_anniversaries(p_today date default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_start date;
  v_today date := coalesce(p_today, (now() at time zone 'Asia/Seoul')::date);
  v_offset int;
  v_target date;
  v_days int;
  v_years int;
  v_labels text[];
  v_label text;
  v_body text;
  v_message text;
  r record;
begin
  select rel.start_date into v_start from public.relationship rel order by rel.updated_at desc limit 1;
  if v_start is null then
    return;
  end if;

  for v_offset in 0..1 loop
    v_target := v_today + v_offset;
    v_labels := '{}';

    v_days := v_target - v_start + 1;
    if v_days > 0 and v_days % 100 = 0 then
      v_labels := v_labels || (v_days::text || '일');
    end if;

    v_years := extract(year from v_target)::int - extract(year from v_start)::int;
    if v_years >= 1 and (v_start + make_interval(years => v_years))::date = v_target then
      v_labels := v_labels || (v_years::text || '주년');
    end if;

    foreach v_label in array v_labels loop
      v_body := case when v_offset = 1
        then '내일은 우리 ' || v_label || '이에요'
        else '오늘은 우리 ' || v_label || '이에요!'
      end;
      v_message := case when v_offset = 1
        then '내일은 ' || v_label || '이에요!'
        else '오늘은 ' || v_label || '이에요!'
      end;
      for r in
        select u.id
        from auth.users u
        join public.allowed_members am on lower(am.email) = lower(u.email)
      loop
        perform public.create_notification(
          r.id, null, 'anniversary', '기념일', v_body,
          'ann:' || v_target::text || ':' || v_label || ':' || v_offset::text,
          v_message, null, null, v_target, null
        );
      end loop;
    end loop;
  end loop;
end;
$$;

revoke all on function public.notify_anniversaries(date) from public, anon, authenticated;

-- ============================================================================
-- 끝. 앱의 알림 센터(종 아이콘)는 이 SQL 실행 전에도 동작하지만(기존 알림은 기존 문구로 표시),
-- 실행 후 새로 생기는 알림부터 새 문구/미리보기/이동 정보가 붙음.
-- ============================================================================
