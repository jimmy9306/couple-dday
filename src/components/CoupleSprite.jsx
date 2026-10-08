// public/characters/*.png (24x32 픽셀 아트)를 정수배(3x=72x96)로 확대해 보여줌.
// 눈 뜬/눈 감은/바람 포즈 프레임을 겹쳐 두고 hidden만 토글해서
// 이미지 로딩 깜빡임 없이 즉시 전환됨.
const BASE = import.meta.env.BASE_URL

export default function CoupleSprite({ name, blinking, windy, className = '', style }) {
  const common = {
    alt: '',
    draggable: false,
    className: `h-[96px] w-[72px] select-none ${className}`,
    style: { imageRendering: 'pixelated', ...style },
  }
  const frame = windy ? 'wind' : blinking ? 'blink' : 'open'
  return (
    <>
      <img src={`${BASE}characters/${name}.png`} {...common} hidden={frame !== 'open'} />
      <img src={`${BASE}characters/${name}-blink.png`} {...common} hidden={frame !== 'blink'} />
      <img src={`${BASE}characters/${name}-wind.png`} {...common} hidden={frame !== 'wind'} />
    </>
  )
}
