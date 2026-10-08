import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getRelationship, setStartDate } from '../lib/store'
import PixelPanel from '../components/PixelPanel'
import NotificationSettings from '../components/NotificationSettings'

export default function Settings() {
  const { authorName, updateDisplayName, mode, signOut } = useAuth()

  const [date, setDate] = useState('')
  const [dateLoading, setDateLoading] = useState(true)
  const [dateBusy, setDateBusy] = useState(false)
  const [dateSaved, setDateSaved] = useState(false)
  const [dateError, setDateError] = useState('')

  const [name, setName] = useState(authorName || '')
  const [nameBusy, setNameBusy] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    getRelationship()
      .then((rel) => setDate(rel?.startDate || ''))
      .finally(() => setDateLoading(false))
  }, [])

  useEffect(() => {
    setName(authorName || '')
  }, [authorName])

  const handleSaveDate = async (e) => {
    e.preventDefault()
    if (!date) return
    setDateBusy(true)
    setDateError('')
    setDateSaved(false)
    try {
      await setStartDate(date)
      setDateSaved(true)
    } catch (err) {
      setDateError(err.message || '저장에 실패했어요.')
    } finally {
      setDateBusy(false)
    }
  }

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setNameBusy(true)
    setNameError('')
    setNameSaved(false)
    try {
      await updateDisplayName(name.trim())
      setNameSaved(true)
    } catch (err) {
      setNameError(err.message || '저장에 실패했어요.')
    } finally {
      setNameBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-6">
      <h2 className="font-title text-[14px] text-pastel-text">설정</h2>

      <PixelPanel innerClassName="p-5">
        <h3 className="font-title mb-3 text-[14px] text-pastel-text">만난 날</h3>
        {dateLoading ? (
          <p className="font-body text-[11px] text-pastel-text">불러오는 중...</p>
        ) : (
          <form onSubmit={handleSaveDate} className="space-y-3">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setDateSaved(false)
              }}
              className="font-body w-full border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
            />
            {dateError && <p className="font-body text-[11px] text-pastel-border">{dateError}</p>}
            {dateSaved && <p className="font-body text-[11px] text-pastel-text">저장했어요.</p>}
            <button
              type="submit"
              disabled={dateBusy}
              className="pixel-btn font-title w-full border-2 border-pastel-border bg-pastel-accent py-2 text-[14px] text-pastel-text disabled:opacity-50"
            >
              저장
            </button>
          </form>
        )}
        <p className="font-body mt-2 text-[11px] text-pastel-accent">둘 중 누구나 수정할 수 있어요.</p>
      </PixelPanel>

      <PixelPanel innerClassName="p-5">
        <h3 className="font-title mb-3 text-[14px] text-pastel-text">내 표시 이름</h3>
        <form onSubmit={handleSaveName} className="space-y-3">
          <input
            type="text"
            required
            placeholder="예: 지민"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setNameSaved(false)
            }}
            className="font-body w-full border-2 border-pastel-border bg-pastel-bg px-3 py-2 text-[11px] text-pastel-text outline-none"
          />
          {nameError && <p className="font-body text-[11px] text-pastel-border">{nameError}</p>}
          {nameSaved && <p className="font-body text-[11px] text-pastel-text">저장했어요.</p>}
          <button
            type="submit"
            disabled={nameBusy}
            className="pixel-btn font-title w-full border-2 border-pastel-border bg-pastel-accent py-2 text-[14px] text-pastel-text disabled:opacity-50"
          >
            저장
          </button>
        </form>
        <p className="font-body mt-2 text-[11px] text-pastel-accent">
          투두와 데이트 기록에 작성자로 표시돼요. {mode === 'local' && '(이 기기에만 저장)'}
        </p>
      </PixelPanel>

      {mode === 'supabase' && <NotificationSettings />}

      <button
        type="button"
        onClick={signOut}
        className="pixel-btn font-title w-full border-2 border-pastel-border bg-pastel-bg py-2 text-[14px] text-pastel-text"
      >
        {mode === 'supabase' ? '로그아웃' : '이름 재설정'}
      </button>
    </div>
  )
}
