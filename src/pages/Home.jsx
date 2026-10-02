import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getRelationship, subscribeToChanges } from '../lib/store'
import { getDayCount, getLoveGaugeProgress } from '../lib/date-utils'
import { EMAIL_FALLBACK_NAME, FEMALE_EMAIL, MALE_EMAIL } from '../lib/couple'
import PixelPanel from '../components/PixelPanel'
import CoupleSprite from '../components/CoupleSprite'
import { HeartIcon, CalendarIcon, CheckIcon, BookIcon, GearIcon } from '../components/icons'

const MENU_ITEMS = [
  { label: '디데이', to: '/dday', Icon: HeartIcon },
  { label: '달력', to: '/calendar', Icon: CalendarIcon },
  { label: '투두', to: '/todo', Icon: CheckIcon },
  { label: '북클럽', to: '/bookclub', Icon: BookIcon },
  { label: '설정', to: '/settings', Icon: GearIcon },
]

const GAUGE_BLOCKS = 10

function LoveGauge({ progress }) {
  const filled = Math.round(progress * GAUGE_BLOCKS)
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: GAUGE_BLOCKS }).map((_, i) => (
        <span
          key={i}
          className={`h-3 w-3 border-2 border-pastel-border ${
            i < filled ? 'bg-pastel-accent' : 'bg-pastel-bg'
          }`}
        />
      ))}
    </div>
  )
}

function MenuRow({ index, selected, label, Icon, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      className="flex w-full items-center gap-2 border-b-2 border-pastel-border px-3 py-3 text-left last:border-b-0"
    >
      <span
        className={`font-title w-3 text-[14px] leading-none text-pastel-border ${
          selected ? 'pixel-cursor' : 'invisible'
        }`}
      >
        ▶
      </span>
      <Icon className="h-4 w-4 text-pastel-border" />
      <span className="font-title text-[14px] text-pastel-text">{label}</span>
    </button>
  )
}

// 랜덤한 간격(3~5초)으로 150ms짜리 눈 깜빡임을 트리거.
function useBlink() {
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    let hideTimer
    let showTimer
    const schedule = () => {
      const delay = 3000 + Math.random() * 2000
      showTimer = window.setTimeout(() => {
        setBlinking(true)
        hideTimer = window.setTimeout(() => {
          setBlinking(false)
          schedule()
        }, 150)
      }, delay)
    }
    schedule()
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  return blinking
}

function CoupleCharacter({ name, sprite, animationDelay }) {
  const blinking = useBlink()
  const [heartPopKey, setHeartPopKey] = useState(0)

  return (
    <button
      type="button"
      onClick={() => setHeartPopKey((k) => k + 1)}
      className="relative flex flex-col items-center gap-1"
    >
      {heartPopKey > 0 && (
        <span
          key={heartPopKey}
          className="heart-pop pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2"
        >
          <HeartIcon className="h-4 w-4 text-pastel-border" />
        </span>
      )}
      <div className="avatar-idle" style={{ animationDelay }}>
        <CoupleSprite name={sprite} blinking={blinking} />
      </div>
      <span className="font-body text-[11px] text-pastel-text">{name}</span>
    </button>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user, authorName, mode } = useAuth()
  const [dayCount, setDayCount] = useState(null)
  const [gauge, setGauge] = useState(null)
  const [selected, setSelected] = useState(0)

  // 로컬(개발) 모드는 실제 이메일이 없어서 항상 "남성 캐릭터" 슬롯을 내 것으로 취급함.
  const myEmail = mode === 'supabase' ? user?.email : MALE_EMAIL
  const myGender = myEmail === MALE_EMAIL ? 'male' : myEmail === FEMALE_EMAIL ? 'female' : null

  useEffect(() => {
    const load = () => {
      getRelationship().then((rel) => {
        if (rel?.startDate) {
          setDayCount(getDayCount(rel.startDate))
          setGauge(getLoveGaugeProgress(rel.startDate))
        } else {
          setDayCount(null)
          setGauge(null)
        }
      })
    }
    load()
    const unsubscribe = subscribeToChanges(load)
    return unsubscribe
  }, [])

  const maleName = myGender === 'male' ? authorName : EMAIL_FALLBACK_NAME[MALE_EMAIL]
  const femaleName = myGender === 'female' ? authorName : EMAIL_FALLBACK_NAME[FEMALE_EMAIL]

  const handleSelect = (index) => {
    setSelected(index)
    window.setTimeout(() => navigate(MENU_ITEMS[index].to), 260)
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center gap-2">
          <HeartIcon className="h-4 w-4 text-pastel-border" />
          <h1 className="font-title text-[28px] leading-none text-pastel-text">LOVE QUEST</h1>
          <HeartIcon className="h-4 w-4 text-pastel-border" />
        </div>
        {authorName && (
          <p className="font-body text-[11px] text-pastel-accent">{authorName} 님</p>
        )}
      </div>

      <PixelPanel innerClassName="p-4">
        {dayCount === null ? (
          <p className="font-body text-[11px] text-pastel-text">
            설정에서 만난 날을 먼저 입력해주세요.
          </p>
        ) : (
          <>
            <p className="font-body text-[11px] text-pastel-text">우리가 만난 지</p>
            <p className="font-title mt-1 text-[42px] leading-none text-pastel-text">
              {dayCount.toLocaleString()}
              <span className="font-body ml-1 text-[14px]">일째</span>
            </p>

            {gauge && (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                <LoveGauge progress={gauge.progress} />
                <p className="font-body text-[11px] text-pastel-text">
                  {gauge.nextLabel}까지 D-{gauge.nextDday}
                </p>
              </div>
            )}
          </>
        )}
      </PixelPanel>

      <PixelPanel innerClassName="">
        {MENU_ITEMS.map((item, i) => (
          <MenuRow
            key={item.to}
            index={i}
            selected={selected === i}
            label={item.label}
            Icon={item.Icon}
            onSelect={handleSelect}
          />
        ))}
      </PixelPanel>

      <PixelPanel innerClassName="flex items-end justify-center gap-2 px-2 py-3">
        <CoupleCharacter name={maleName} sprite="jimin" />
        <HeartIcon className="mb-8 h-4 w-4 flex-shrink-0 text-pastel-border" />
        <CoupleCharacter name={femaleName} sprite="eunji" animationDelay="0.5s" />
      </PixelPanel>
    </div>
  )
}
