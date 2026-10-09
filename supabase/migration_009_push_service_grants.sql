-- ============================================================================
-- Migration 009: 푸시 발송 Edge Function(service_role)에 필요한 테이블 권한
--
-- 문제: 이 프로젝트는 새로 만든 테이블에 service_role 의 읽기/수정 권한이 자동으로 붙지 않아서
--   send-push 함수가 notifications 를 수정(pushed_at 선점)하지 못하고 "claim failed"(HTTP 500)로
--   매번 실패 → 알림 행은 생기는데 푸시는 한 번도 발송되지 않았음.
-- 해결: 함수가 쓰는 만큼만(최소 권한) service_role 에 권한 부여.
--   notifications      : 읽기(안 읽은 개수), 수정(pushed_at)
--   push_subscriptions : 읽기(발송 대상 기기), 삭제(만료된 기기 정리)
--
-- 몇 번 실행해도 안전합니다 (GRANT 는 이미 있으면 그대로 둠).
-- Supabase 대시보드 > SQL Editor 에서 실행 (이미 CLI 로 적용했다면 다시 안 해도 됨).
-- ============================================================================
grant select, update on public.notifications to service_role;
grant select, delete on public.push_subscriptions to service_role;
