// 표지 사진이 있으면 그대로, 없으면 제목 첫 글자로 픽셀 표지를 즉석에서 만들어 보여줌
// (저장은 안 하고 매번 렌더링만 — 제목이 같으면 항상 같은 색이 나오도록 해시로 배경색 고정).

function hashStr(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

export default function BookCover({ title, coverUrl, className = '', textClassName = 'text-[14px]' }) {
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={`${title || '책'} 표지`}
        className={`border-2 border-pastel-border bg-pastel-bg object-cover ${className}`}
      />
    )
  }

  const bgClass = hashStr(title) % 2 === 0 ? 'bg-pastel-accent' : 'bg-pastel-box'
  const letter = title?.trim()?.[0]?.toUpperCase() || '?'

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center border-2 border-pastel-border ${bgClass} ${className}`}
    >
      <span className={`font-title text-pastel-text ${textClassName}`}>{letter}</span>
    </div>
  )
}
