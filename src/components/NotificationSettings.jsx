import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getDisabledNotificationKinds, saveDisabledNotificationKinds, sendTestPush } from '../lib/store'
import { disablePush, enablePush, getPushStatus } from '../lib/push'
import PixelPanel from './PixelPanel'
import { CheckIcon } from './icons'

const KINDS = [
  { key: 'post', label: '달력 기록' },
  { key: 'comment', label: '댓글' },
  { key: 'todo_add', label: '할 일 추가' },
  { key: 'todo_done', label: '할 일 완료' },
  { key: 'book_read', label: '북클럽 읽음' },
  { key: 'book_review', label: '한줄평' },
  { key: 'anniversary', label: '기념일 (둘 다에게)' },
]

const NOT_READY_CODES = ['PGRST205', '42P01', 'PGRST202', '42883'] // 테이블/함수가 아직 없음(SQL 미실행)

function describeError(err) {
  if (err?.code === 'PERMISSION_DENIED') return '알림이 차단돼 있어요. 아이폰 설정 → 알림에서 허용해주세요.'
  if (err?.code === 'PERMISSION_DISMISSED') return '알림 허용을 취소했어요. 다시 눌러서 허용해주세요.'
  if (NOT_READY_CODES.includes(err?.code)) return '아직 알림 기능 준비 중이에요 (관리자가 SQL을 실행하면 바로 쓸 수 있어요).'
  return err?.message || '알림 설정에 실패했어요.'
}

export default function NotificationSettings() {
  const { userId } = useAuth()
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [disabledKinds, setDisabledKinds] = useState([])
  const [kindError, setKindError] = useState('')
  // 디버그용 테스트 알림: 3초 카운트다운 뒤 발송
  const [testCountdown, setTestCountdown] = useState(0)
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    getPushStatus().then(setStatus)
    getDisabledNotificationKinds()
      .then(setDisabledKinds)
      .catch(() => setDisabledKinds([]))
  }, [])

  const on = Boolean(status?.subscribed && status.permission === 'granted')

  // 켤 수 없는 상황이면 이유를 안내하고 버튼을 비활성화
  let blockedMessage = ''
  if (status) {
    if (status.ios && !status.standalone) {
      blockedMessage = '홈 화면에 추가 후 이용해주세요.'
    } else if (!status.supported) {
      blockedMessage = '이 브라우저에서는 푸시 알림을 쓸 수 없어요.'
    } else if (!status.configured) {
      blockedMessage = '알림 설정이 아직 준비되지 않았어요.'
    } else if (status.permission === 'denied' && !on) {
      blockedMessage = '알림이 차단돼 있어요. 아이폰 설정 → 알림에서 허용해주세요.'
    }
  }

  const handleToggle = async () => {
    if (busy || blockedMessage) return
    setBusy(true)
    setError('')
    try {
      if (on) await disablePush()
      else await enablePush()
    } catch (err) {
      setError(describeError(err))
    } finally {
      setStatus(await getPushStatus())
      setBusy(false)
    }
  }

  const handleTestPush = async () => {
    if (testCountdown > 0 || testSending) return
    setTestResult('')
    for (let left = 3; left > 0; left -= 1) {
      setTestCountdown(left)
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => window.setTimeout(resolve, 1000))
    }
    setTestCountdown(0)
    setTestSending(true)
    try {
      const r = await sendTestPush()
      if (r.devices === 0) {
        setTestResult('이 계정에 등록된 기기가 없어요. "알림 켜기"를 먼저 눌러주세요.')
      } else if (r.sent > 0) {
        setTestResult(
          `테스트 알림을 보냈어요 (기기 ${r.devices}대 중 ${r.sent}대 성공). 앱을 닫거나 다른 화면으로 나가 있으면 잘 보여요. 안 오면 아이폰 설정 → 알림을 확인해주세요.`
        )
      } else if (r.removed > 0) {
        setTestResult('이 기기의 알림 등록이 만료돼서 정리했어요. "알림 끄기" 후 "알림 켜기"를 다시 눌러주세요.')
      } else {
        setTestResult(`발송에 실패했어요 (오류 코드: ${r.failed.join(', ') || '알 수 없음'}).`)
      }
    } catch (err) {
      setTestResult(`테스트 알림 요청에 실패했어요: ${err?.message || '알 수 없는 오류'}`)
    } finally {
      setTestSending(false)
    }
  }

  const toggleKind = async (key) => {
    const previous = disabledKinds
    const next = previous.includes(key) ? previous.filter((k) => k !== key) : [...previous, key]
    setDisabledKinds(next)
    setKindError('')
    try {
      await saveDisabledNotificationKinds(userId, next)
    } catch (err) {
      setDisabledKinds(previous)
      setKindError(describeError(err))
    }
  }

  return (
    <PixelPanel innerClassName="p-5">
      <h3 className="font-title mb-3 text-[14px] text-pastel-text">알림</h3>

      {status === null ? (
        <p className="font-body text-[11px] text-pastel-text">불러오는 중...</p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="font-body text-[11px] text-pastel-text">푸시 알림</span>
            <span
              className={`font-title border-2 border-pastel-border px-2 py-0.5 text-[11px] ${
                on ? 'bg-pastel-accent text-white' : 'bg-pastel-bg text-pastel-text'
              }`}
            >
              {on ? '켜짐' : '꺼짐'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={busy || Boolean(blockedMessage)}
            className={
              blockedMessage
                ? 'font-title w-full cursor-not-allowed border-2 border-pastel-border bg-[#E5DDE0] py-2 text-[14px] text-[#A8949B]'
                : `pixel-btn font-title w-full border-2 border-pastel-border py-2 text-[14px] text-pastel-text disabled:opacity-50 ${
                    on ? 'bg-pastel-bg' : 'bg-pastel-accent'
                  }`
            }
          >
            {busy ? '처리 중...' : on ? '알림 끄기' : '알림 켜기'}
          </button>

          {blockedMessage && (
            <p className="font-body mt-2 text-[11px] text-pastel-border">{blockedMessage}</p>
          )}
          {status.ios && !status.standalone && (
            <p className="font-body mt-1 text-[11px] text-pastel-accent">
              사파리 아래 공유 버튼 → "홈 화면에 추가"로 설치한 뒤, 그 앱에서 설정 탭을 열어주세요.
            </p>
          )}
          {error && <p className="font-body mt-2 text-[11px] text-pastel-border">{error}</p>}
          {!blockedMessage && !error && (
            <p className="font-body mt-2 text-[11px] text-pastel-accent">
              {on ? '이 기기로 알림을 보내드려요.' : '누르면 알림 허용을 물어봐요.'}
            </p>
          )}
        </>
      )}

      <div className="mt-4 border-t-2 border-pastel-border pt-3">
        <button
          type="button"
          onClick={handleTestPush}
          disabled={testCountdown > 0 || testSending || !on}
          className="pixel-btn font-title w-full border-2 border-pastel-border bg-pastel-bg py-2 text-[14px] text-pastel-text disabled:opacity-50"
        >
          {testCountdown > 0
            ? `${testCountdown}초 뒤 발송...`
            : testSending
              ? '보내는 중...'
              : '테스트 알림 보내기'}
        </button>
        <p className="font-body mt-2 text-[11px] text-pastel-accent">
          {on
            ? '누르면 3초 뒤 나에게 테스트 푸시가 와요 (점검용).'
            : '알림을 켠 뒤에 쓸 수 있어요 (점검용).'}
        </p>
        {testResult && <p className="font-body mt-1 text-[11px] text-pastel-border">{testResult}</p>}
      </div>

      <div className="mt-4 border-t-2 border-pastel-border pt-3">
        <p className="font-title mb-1 text-[11px] text-pastel-text">받을 알림 종류</p>
        {KINDS.map(({ key, label }) => {
          const enabled = !disabledKinds.includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleKind(key)}
              className="flex w-full items-center gap-3 py-1.5 text-left"
            >
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 border-pastel-border ${
                  enabled ? 'bg-pastel-accent' : 'bg-pastel-bg'
                }`}
              >
                {enabled && <CheckIcon className="h-3.5 w-3.5 text-pastel-border" />}
              </span>
              <span className="font-body text-[11px] text-pastel-text">{label}</span>
            </button>
          )
        })}
        {kindError && <p className="font-body mt-1 text-[11px] text-pastel-border">{kindError}</p>}
        <p className="font-body mt-2 text-[11px] text-pastel-accent">
          끈 알림은 푸시와 앱 안의 빨간 점 모두 오지 않아요.
        </p>
      </div>
    </PixelPanel>
  )
}
