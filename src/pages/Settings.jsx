import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getRelationship, setStartDate } from '../lib/store'

export default function Settings() {
  const { authorName, updateDisplayName, mode } = useAuth()

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
      <h2 className="text-lg font-bold text-love-700">설정</h2>

      <section className="rounded-3xl bg-white p-5 shadow-sm shadow-love-100">
        <h3 className="mb-3 text-sm font-semibold text-love-700">만난 날</h3>
        {dateLoading ? (
          <p className="text-sm text-love-400">불러오는 중...</p>
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
              className="w-full rounded-xl border border-love-200 px-4 py-3 text-sm outline-none focus:border-love-400"
            />
            {dateError && <p className="text-xs text-red-500">{dateError}</p>}
            {dateSaved && <p className="text-xs text-love-600">저장했어요.</p>}
            <button
              type="submit"
              disabled={dateBusy}
              className="w-full rounded-xl bg-love-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              저장
            </button>
          </form>
        )}
        <p className="mt-2 text-xs text-gray-400">둘 중 누구나 수정할 수 있어요.</p>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm shadow-love-100">
        <h3 className="mb-3 text-sm font-semibold text-love-700">내 표시 이름</h3>
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
            className="w-full rounded-xl border border-love-200 px-4 py-3 text-sm outline-none focus:border-love-400"
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
          {nameSaved && <p className="text-xs text-love-600">저장했어요.</p>}
          <button
            type="submit"
            disabled={nameBusy}
            className="w-full rounded-xl bg-love-500 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            저장
          </button>
        </form>
        <p className="mt-2 text-xs text-gray-400">
          투두와 데이트 기록에 작성자로 표시돼요. {mode === 'local' && '(이 기기에만 저장)'}
        </p>
      </section>
    </div>
  )
}
