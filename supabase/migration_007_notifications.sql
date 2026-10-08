-- ============================================================================
-- Migration 007: 푸시 알림 + 안 읽은 알림(앱 아이콘 배지/탭 빨간 점)
--
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.
-- 몇 번을 실행해도 안전합니다(create ... if not exists / create or replace /
-- drop trigger|policy if exists 후 재생성). 기존 데이터는 전혀 건드리지 않습니다.
--
-- 구조:
--   [행동] date_records / comments / todos / books / book_reviews 에 행이 생기거나 바뀜
--      → (AFTER 트리거) 행동한 사람(auth.uid())을 뺀 "상대방"에게 notifications 행 생성
--      → (AFTER INSERT 트리거) pg_net 으로 Edge Function(send-push) 호출
--      → send-push 가 push_subscriptions 에 등록된 기기들로 Web Push 발송
--   [기념일] pg_cron 이 매일 09:00(KST)에 notify_anniversaries() 실행 → 둘 다에게 알림
--
-- 안전장치: 모든 알림 트리거는 예외를 삼키도록 감싸서(raise warning), 알림 쪽에서
--   무슨 문제가 생겨도 기록/댓글/투두 저장 자체는 절대 막히지 않음.
-- VAPID 비공개 키는 이 파일에 없음 (Supabase Edge Function secrets에만 저장).
-- ============================================================================

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- ----------------------------------------------------------------------------
-- 1) 테이블
-- ----------------------------------------------------------------------------

-- 기기(브라우저/홈 화면 앱)별 푸시 구독. endpoint 하나 = 기기 하나이므로 endpoint 가 유니크.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- 사용자별 알림 종류 on/off (꺼둔 종류만 저장 — 비어 있으면 전부 켜짐)
create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  disabled_kinds text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- 알림 본체. 앱 아이콘 숫자 = read=false 개수, 탭 빨간 점 = tab 별 read=false 존재 여부.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  kind text not null check (
    kind in ('post', 'comment', 'todo_add', 'todo_done', 'book_read', 'book_review', 'anniversary')
  ),
  tab text not null check (tab in ('dday', 'calendar', 'todo', 'bookclub')),
  title text not null,
  body text not null,
  read boolean not null default false,
  pushed_at timestamptz,
  dedupe_key text,
  created_at timestamptz not null default now()
);

-- 같은 기념일 알림이 중복 생성되지 않게 (dedupe_key 가 있는 것만)
create unique index if not exists notifications_dedupe_idx
  on public.notifications (recipient_id, dedupe_key) where dedupe_key is not null;
create index if not exists notifications_unread_idx
  on public.notifications (recipient_id) where read = false;

-- ----------------------------------------------------------------------------
-- 2) RLS / 권한
-- ----------------------------------------------------------------------------
alter table public.push_subscriptions enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.notifications enable row level security;

grant select, delete on public.push_subscriptions to authenticated;
grant select, insert, update on public.notification_prefs to authenticated;
grant select on public.notifications to authenticated;
-- 알림은 "읽음" 표시만 앱에서 바꿀 수 있고, 내용/수신자는 못 바꿈 (생성은 아래 트리거 함수만)
revoke update on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (user_id = auth.uid());

drop policy if exists "notification_prefs_select_own" on public.notification_prefs;
create policy "notification_prefs_select_own" on public.notification_prefs
  for select using (user_id = auth.uid());

drop policy if exists "notification_prefs_insert_own" on public.notification_prefs;
create policy "notification_prefs_insert_own" on public.notification_prefs
  for insert with check (user_id = auth.uid());

drop policy if exists "notification_prefs_update_own" on public.notification_prefs;
create policy "notification_prefs_update_own" on public.notification_prefs
  for update using (user_id = auth.uid());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (recipient_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (recipient_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3) 기기 등록 RPC — 같은 기기에서 다른 계정으로 로그인해도 endpoint 가 새 계정으로 넘어가도록
--    (RLS 만으로는 남의 행을 update 할 수 없어서 security definer 함수로 처리)
-- ----------------------------------------------------------------------------
create or replace function public.register_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth_key text,
  p_user_agent text default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.allowed_members am where lower(am.email) = lower(auth.jwt() ->> 'email')
  ) then
    raise exception 'not allowed';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth_key, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth_key, p_user_agent)
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth_key = excluded.auth_key,
        user_agent = excluded.user_agent;
end;
$$;

revoke all on function public.register_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.register_push_subscription(text, text, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 4) 알림 생성 헬퍼
-- ----------------------------------------------------------------------------

-- 한국어 조사: 받침 있으면 with_batchim, 없으면 without_batchim (한글이 아니면 받침 없음으로 처리)
create or replace function public.ko_josa(word text, with_batchim text, without_batchim text)
returns text
language sql
immutable
as $$
  select case
    when word is null or word = '' then without_batchim
    when ascii(right(word, 1)) between 44032 and 55203 then
      case when (ascii(right(word, 1)) - 44032) % 28 > 0 then with_batchim else without_batchim end
    else without_batchim
  end
$$;

-- 지금 요청한 사람의 표시 이름 (표시 이름이 없으면 이메일 앞부분)
create or replace function public.current_actor_name()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), split_part(u.email, '@', 1))
  from auth.users u
  where u.id = auth.uid()
$$;

-- 알림 한 건 생성 (수신자가 그 종류를 꺼뒀으면 만들지 않음)
create or replace function public.create_notification(
  p_recipient uuid,
  p_actor uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_dedupe text default null
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

  insert into public.notifications (recipient_id, actor_id, kind, tab, title, body, dedupe_key)
  values (p_recipient, p_actor, p_kind, v_tab, p_title, p_body, p_dedupe)
  on conflict do nothing;
end;
$$;

-- "행동한 사람(auth.uid())을 뺀 허용된 멤버" 전원에게 알림 (= 상대방)
create or replace function public.notify_other_members(p_kind text, p_title text, p_body text)
returns void
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
    perform public.create_notification(r.id, v_actor, p_kind, p_title, p_body);
  end loop;
end;
$$;

-- 이 함수들은 트리거(소유자 권한)에서만 쓰므로 앱 계정이 직접 호출하지 못하게 막음
revoke all on function public.create_notification(uuid, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.notify_other_members(text, text, text) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5) 행동별 트리거 (전부 예외를 삼켜서 본 작업을 절대 막지 않음)
-- ----------------------------------------------------------------------------

-- 달력 게시글 작성: "은지가 10/8 기록을 남겼어요"
create or replace function public.trg_notify_post() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text;
begin
  begin
    v_name := public.current_actor_name();
    perform public.notify_other_members(
      'post', '새 기록',
      v_name || public.ko_josa(v_name, '이', '가') || ' ' || to_char(new.date, 'FMMM/FMDD') || ' 기록을 남겼어요'
    );
  exception when others then
    raise warning 'notify post failed: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists notify_on_post on public.date_records;
create trigger notify_on_post after insert on public.date_records
  for each row execute function public.trg_notify_post();

-- 댓글 작성: "지민이 댓글을 달았어요: (내용 앞 20자)"
create or replace function public.trg_notify_comment() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_name text;
begin
  begin
    v_name := public.current_actor_name();
    perform public.notify_other_members(
      'comment', '새 댓글',
      v_name || public.ko_josa(v_name, '이', '가') || ' 댓글을 달았어요: '
        || left(new.content, 20) || case when char_length(new.content) > 20 then '…' else '' end
    );
  exception when others then
    raise warning 'notify comment failed: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists notify_on_comment on public.comments;
create trigger notify_on_comment after insert on public.comments
  for each row execute function public.trg_notify_comment();

-- 투두 추가: "새 할 일: ○○"
create or replace function public.trg_notify_todo_add() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  begin
    perform public.notify_other_members(
      'todo_add', '새 할 일',
      '새 할 일: ' || left(new.content, 40) || case when char_length(new.content) > 40 then '…' else '' end
    );
  exception when others then
    raise warning 'notify todo add failed: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists notify_on_todo_add on public.todos;
create trigger notify_on_todo_add after insert on public.todos
  for each row execute function public.trg_notify_todo_add();

-- 투두 완료: "○○ 완료!" (미완료 → 완료로 바뀔 때만)
create or replace function public.trg_notify_todo_done() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  begin
    perform public.notify_other_members(
      'todo_done', '할 일 완료',
      left(new.content, 40) || case when char_length(new.content) > 40 then '…' else '' end || ' 완료!'
    );
  exception when others then
    raise warning 'notify todo done failed: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists notify_on_todo_done on public.todos;
create trigger notify_on_todo_done after update of done on public.todos
  for each row when (old.done is distinct from new.done and new.done = true)
  execute function public.trg_notify_todo_done();

-- 북클럽 읽음 처리: "은지가 『○○』을 다 읽었어요" (읽는 중 → 읽음으로 바뀔 때만)
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
        || public.ko_josa(new.title, '을', '를') || ' 다 읽었어요'
    );
  exception when others then
    raise warning 'notify book read failed: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists notify_on_book_read on public.books;
create trigger notify_on_book_read after update of status on public.books
  for each row when (old.status is distinct from new.status and new.status = 'read')
  execute function public.trg_notify_book_read();

-- 한줄평 작성: "지민이 『○○』 한줄평을 남겼어요"
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
      v_name || public.ko_josa(v_name, '이', '가') || ' 『' || coalesce(v_title, '책') || '』 한줄평을 남겼어요'
    );
  exception when others then
    raise warning 'notify book review failed: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists notify_on_book_review on public.book_reviews;
create trigger notify_on_book_review after insert on public.book_reviews
  for each row execute function public.trg_notify_book_review();

-- ----------------------------------------------------------------------------
-- 6) 푸시 발송 호출 — 알림 행이 생기면 Edge Function(send-push)에 "알림 id"만 전달
--    (함수는 id로 DB에서 내용을 읽고, pushed_at 으로 한 번만 발송하므로 이 호출을 위조해도
--     새 알림을 만들 수 없음. 그래서 JWT 검증 없이(--no-verify-jwt) 배포하고 비밀값도 불필요)
-- ----------------------------------------------------------------------------
create or replace function public.trg_push_notification() returns trigger
language plpgsql security definer set search_path = public, extensions, net, pg_temp as $$
begin
  begin
    perform net.http_post(
      url := 'https://nlwajjurwlhvlvyaumsc.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('notification_id', new.id)
    );
  exception when others then
    raise warning 'push dispatch failed: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists push_on_notification on public.notifications;
create trigger push_on_notification after insert on public.notifications
  for each row execute function public.trg_push_notification();

-- ----------------------------------------------------------------------------
-- 7) 기념일 알림 — 100일 단위 / N주년의 "하루 전"과 "당일"에 둘 다에게
--    날짜 계산은 앱(date-utils.js)과 동일: k일째 = 만난 날 + (k-1)일, N주년 = 만난 날 + N년
--    p_today 는 테스트용(기본값: 한국 시간 오늘)
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
      for r in
        select u.id
        from auth.users u
        join public.allowed_members am on lower(am.email) = lower(u.email)
      loop
        perform public.create_notification(
          r.id, null, 'anniversary', '기념일', v_body,
          'ann:' || v_target::text || ':' || v_label || ':' || v_offset::text
        );
      end loop;
    end loop;
  end loop;
end;
$$;

revoke all on function public.notify_anniversaries(date) from public, anon, authenticated;

-- 매일 00:00 UTC = 09:00 KST (다시 실행해도 중복 등록되지 않게 먼저 지움)
do $$
begin
  perform cron.unschedule(j.jobid) from cron.job j where j.jobname = 'notify-anniversaries';
  perform cron.schedule('notify-anniversaries', '0 0 * * *', 'select public.notify_anniversaries()');
end $$;

-- ----------------------------------------------------------------------------
-- 8) Realtime: notifications 도 방송 대상에 추가 (상대가 뭔가 하면 내 화면의 빨간 점이 바로 켜짐)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ============================================================================
-- 끝. 실행 후:  Edge Function(send-push) 배포 + VAPID secrets 설정이 되어 있어야 푸시가
-- 실제로 기기에 도착함 (그 전에도 앱 안의 빨간 점/숫자는 동작).
-- ============================================================================
