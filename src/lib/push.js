// 브라우저 쪽 Web Push 처리: 지원/설치 여부 판별, 구독/해지, 내 계정에 기기 등록.
import { deletePushSubscription, registerPushSubscription } from './store'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
const READY_TIMEOUT_MS = 4000

export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY)

export function isIOS() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/** 홈 화면에 추가해서 연 앱인지 (iOS는 이때만 푸시/배지 사용 가능) */
export function isStandalone() {
  return (
    window.navigator.standalone === true ||
    Boolean(window.matchMedia?.('(display-mode: standalone)').matches)
  )
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function urlBase64ToUint8Array(base64) {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

function sameKey(buffer, bytes) {
  if (!buffer) return false
  const a = new Uint8Array(buffer)
  return a.length === bytes.length && a.every((v, i) => v === bytes[i])
}

// 서비스워커가 아직 등록되지 않은 환경(개발 서버 등)에서 영원히 기다리지 않도록 타임아웃을 둠
async function getRegistration() {
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => window.setTimeout(() => resolve(null), READY_TIMEOUT_MS)),
  ])
  if (!registration) {
    const err = new Error('서비스워커가 아직 준비되지 않았어요. 잠시 뒤 다시 시도해주세요.')
    err.code = 'SW_NOT_READY'
    throw err
  }
  return registration
}

async function currentSubscription() {
  try {
    const registration = await getRegistration()
    return await registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

export async function getPushStatus() {
  const supported = isPushSupported()
  const permission = supported ? Notification.permission : 'unsupported'
  const subscribed = supported && permission === 'granted' ? Boolean(await currentSubscription()) : false
  return {
    ios: isIOS(),
    standalone: isStandalone(),
    supported,
    configured: isPushConfigured,
    permission,
    subscribed,
  }
}

async function saveSubscription(subscription) {
  const json = subscription.toJSON()
  await registerPushSubscription({
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    authKey: json.keys.auth,
    userAgent: navigator.userAgent,
  })
}

/** 반드시 버튼 탭 같은 사용자 동작 안에서 호출 (iOS는 그때만 권한 요청 가능) */
export async function enablePush() {
  if (!isPushConfigured) {
    const err = new Error('알림 키가 설정되지 않았어요.')
    err.code = 'NOT_CONFIGURED'
    throw err
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    const err = new Error(permission === 'denied' ? '알림이 차단돼 있어요.' : '알림 허용이 취소됐어요.')
    err.code = permission === 'denied' ? 'PERMISSION_DENIED' : 'PERMISSION_DISMISSED'
    throw err
  }

  const registration = await getRegistration()
  const key = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  let subscription = await registration.pushManager.getSubscription()
  // 예전 키로 만든 구독이 남아 있으면 새 키로 다시 구독
  if (subscription && !sameKey(subscription.options?.applicationServerKey, key)) {
    await subscription.unsubscribe()
    subscription = null
  }
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    })
  }
  await saveSubscription(subscription)
}

export async function disablePush() {
  const subscription = await currentSubscription()
  if (!subscription) return
  const { endpoint } = subscription
  await subscription.unsubscribe()
  await deletePushSubscription(endpoint)
}

/**
 * 이미 알림을 켠 기기라면, 앱을 열 때마다 구독을 내 계정에 다시 등록(upsert).
 * - 구독 주소가 바뀌었거나, 같은 기기에서 다른 계정으로 로그인한 경우를 자동으로 바로잡음.
 */
export async function syncPushSubscription() {
  if (!isPushSupported() || Notification.permission !== 'granted') return
  const subscription = await currentSubscription()
  if (subscription) await saveSubscription(subscription)
}
