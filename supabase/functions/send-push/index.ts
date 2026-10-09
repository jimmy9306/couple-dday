// 알림 행(notifications) 하나를 받아 수신자의 모든 기기로 Web Push 를 보내는 Edge Function.
//
// 호출: DB 트리거(pg_net)가 POST { notification_id } 로 호출. (migration_007_notifications.sql)
// 보안:
//  - 이 함수는 JWT 검증 없이 배포됨(--no-verify-jwt). 대신 요청 바디의 "알림 id"만 믿고,
//    제목/내용/수신자는 전부 DB에서 읽음 → 호출을 위조해도 새 알림/내용을 만들 수 없음.
//    (예외: { test: true } 는 로그인한 본인의 기기로만 고정 문구의 테스트 푸시를 보냄)
//  - pushed_at 을 원자적으로 선점(update ... where pushed_at is null)해서 같은 알림은 딱 한 번만 발송.
//  - VAPID 비공개 키는 Supabase secrets(VAPID_PRIVATE_KEY)에서만 읽음. 코드/로그/응답에 절대 노출하지 않음.
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'https://jimmy9306.github.io/couple-dday/'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const vapidConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
if (vapidConfigured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

// 설정 탭의 "테스트 알림 보내기"가 브라우저에서 직접 호출하므로 CORS 허용
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  // 설정 점검용: 값은 노출하지 않고 "설정돼 있는지"만 알려줌
  if (req.method === 'GET') {
    return json({
      ok: true,
      configured: {
        vapid: vapidConfigured,
        supabaseUrl: Boolean(SUPABASE_URL),
        serviceRoleKey: Boolean(SERVICE_ROLE_KEY),
      },
    })
  }
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)
  if (!vapidConfigured || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'function is not configured' }, 500)
  }

  let notificationId: unknown
  let isTest = false
  try {
    const body = await req.json()
    notificationId = body.notification_id
    isTest = body.test === true
  } catch {
    return json({ error: 'invalid json' }, 400)
  }

  // 디버그용 테스트 푸시: 로그인한 본인(Authorization 의 사용자 토큰)의 기기로만 보냄.
  // DB 알림 행은 만들지 않아서 알림 목록/빨간 점/아이콘 숫자에는 영향이 없음.
  if (isTest) {
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) return json({ error: 'not authenticated' }, 401)

    const { data: subs, error: subsError } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth_key')
      .eq('user_id', userData.user.id)
    if (subsError) return json({ error: 'subscriptions query failed' }, 500)

    const testPayload = JSON.stringify({
      title: '테스트 알림',
      body: '푸시가 이 기기에 정상적으로 도착했어요!',
      tab: 'settings',
    })
    let testSent = 0
    const testFailed: number[] = []
    const testExpired: string[] = []
    await Promise.all(
      (subs ?? []).map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
            testPayload,
            { TTL: 60, urgency: 'high' },
          )
          testSent += 1
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode ?? 0
          testFailed.push(status)
          if (status === 404 || status === 410) testExpired.push(sub.id)
        }
      }),
    )
    if (testExpired.length > 0) {
      await admin.from('push_subscriptions').delete().in('id', testExpired)
    }
    return json({ test: true, devices: subs?.length ?? 0, sent: testSent, failed: testFailed, removed: testExpired.length })
  }
  if (typeof notificationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(notificationId)) {
    return json({ error: 'invalid notification_id' }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 한 번만 발송: pushed_at 을 먼저 선점. 이미 발송됐거나 없는 id면 아무것도 안 함.
  const { data: notification, error: claimError } = await supabase
    .from('notifications')
    .update({ pushed_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('pushed_at', null)
    .select('id, recipient_id, title, body, tab')
    .maybeSingle()
  if (claimError) return json({ error: 'claim failed' }, 500)
  if (!notification) return json({ skipped: 'not found or already pushed' })

  const [{ count: unreadCount }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', notification.recipient_id)
      .eq('read', false),
    supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth_key')
      .eq('user_id', notification.recipient_id),
  ])

  const payload = JSON.stringify({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    tab: notification.tab,
    badge: unreadCount ?? 1,
  })

  let sent = 0
  const expired: string[] = []
  await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload,
          { TTL: 60 * 60 * 24, urgency: 'normal' },
        )
        sent += 1
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // 404/410 = 기기에서 구독이 해지/만료됨 → 정리
        if (status === 404 || status === 410) expired.push(sub.id)
        else console.error('push failed', status ?? String(err).slice(0, 200))
      }
    }),
  )

  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expired)
  }

  return json({ sent, removed: expired.length, devices: subscriptions?.length ?? 0 })
})
