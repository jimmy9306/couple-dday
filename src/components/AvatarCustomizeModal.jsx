import { useState } from 'react'
import AvatarSVG from './AvatarSVG'
import { gridFromRows } from '../lib/pixelGrid'
import { AVATAR_COLORS, BOTTOM_OPTIONS, SHOES_OPTIONS, TOP_OPTIONS, getHairOptions } from '../lib/avatarParts'

const TABS = [
  { key: 'hair', label: '머리' },
  { key: 'top', label: '상의' },
  { key: 'bottom', label: '하의' },
  { key: 'shoes', label: '신발' },
]

const COLOR_KEY_BY_TAB = { hair: 'hairColor', top: 'topColor', bottom: 'bottomColor', shoes: 'shoesColor' }
const STYLE_KEY_BY_TAB = { hair: 'hair', top: 'top', bottom: 'bottom', shoes: 'shoes' }

function PartThumb({ rowsData, color, label, selected, onClick }) {
  const grid = gridFromRows(rowsData)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pixel-tile flex flex-col items-center gap-1 border-2 border-pastel-border p-1 ${
        selected ? 'bg-pastel-accent' : 'bg-pastel-bg'
      }`}
    >
      <svg
        viewBox="0 0 16 24"
        className="h-10 w-7"
        shapeRendering="crispEdges"
        style={{ imageRendering: 'pixelated' }}
      >
        {grid.map((row, y) =>
          row.map(
            (filled, x) =>
              filled && <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />
          )
        )}
      </svg>
      <span className="font-body text-[9px] leading-none text-pastel-text">{label}</span>
    </button>
  )
}

function ColorSwatch({ color, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 w-7 flex-shrink-0 border-2 ${selected ? 'border-pastel-text' : 'border-pastel-border'}`}
      style={{ backgroundColor: color }}
    />
  )
}

// 내 캐릭터 꾸미기 팝업 — 위 미리보기(선택 즉시 반영) + 탭 4개 + 썸네일/색상 그리드.
export default function AvatarCustomizeModal({ gender, config, onClose, onSave }) {
  const [draft, setDraft] = useState(config)
  const [activeTab, setActiveTab] = useState('hair')
  const [busy, setBusy] = useState(false)

  const optionsByTab = {
    hair: getHairOptions(gender),
    top: TOP_OPTIONS,
    bottom: BOTTOM_OPTIONS,
    shoes: SHOES_OPTIONS,
  }
  const isDress = TOP_OPTIONS.find((o) => o.key === draft.top)?.isDress

  const activeOptions = optionsByTab[activeTab]
  const activeStyleKey = STYLE_KEY_BY_TAB[activeTab]
  const activeColorKey = COLOR_KEY_BY_TAB[activeTab]

  const handleTabClick = (key) => {
    if (key === 'bottom' && isDress) return
    setActiveTab(key)
  }

  const handleSave = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onSave(draft)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pastel-text/40 px-4"
      onClick={onClose}
    >
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex max-h-[88vh] flex-col border-2 border-pastel-border bg-pastel-box">
          <div className="flex items-center justify-between border-b-2 border-pastel-border p-3">
            <h3 className="font-title text-[14px] text-pastel-text">코디하기</h3>
            <button type="button" onClick={onClose} className="font-title text-[14px] text-pastel-text">
              ✕
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 border-b-2 border-pastel-border bg-pastel-bg py-4">
            <AvatarSVG gender={gender} config={draft} className="h-[150px] w-[100px]" />
          </div>

          <div className="flex border-b-2 border-pastel-border">
            {TABS.map((tab) => {
              const disabled = tab.key === 'bottom' && isDress
              return (
                <button
                  key={tab.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleTabClick(tab.key)}
                  className={`font-title flex-1 border-r-2 border-pastel-border py-2 text-[11px] last:border-r-0 ${
                    disabled
                      ? 'bg-[#E5DDE0] text-[#A8949B]'
                      : activeTab === tab.key
                        ? 'bg-pastel-accent text-pastel-text'
                        : 'bg-pastel-box text-pastel-text'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-4 gap-2">
              {activeOptions.map((opt) => (
                <PartThumb
                  key={opt.key}
                  rowsData={opt.rows}
                  color={draft[activeColorKey]}
                  label={opt.label}
                  selected={draft[activeStyleKey] === opt.key}
                  onClick={() => setDraft({ ...draft, [activeStyleKey]: opt.key })}
                />
              ))}
            </div>

            <div className="mt-3 flex justify-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <ColorSwatch
                  key={c.key}
                  color={c.value}
                  selected={draft[activeColorKey] === c.value}
                  onClick={() => setDraft({ ...draft, [activeColorKey]: c.value })}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 border-t-2 border-pastel-border p-3">
            <button
              type="button"
              onClick={onClose}
              className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-bg py-2 text-[14px] text-pastel-text"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="pixel-btn font-title flex-1 border-2 border-pastel-border bg-pastel-accent py-2 text-[14px] text-pastel-text disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
