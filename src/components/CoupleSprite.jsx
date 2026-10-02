// public/characters/*.png (24x32 픽셀 아트)를 정수배(3x=72x96)로 확대해 보여줌.
// 눈 뜬 프레임/감은 프레임 두 장을 겹쳐 두고 blinking일 때만 바꿔 보여줘서
// 이미지 로딩 깜빡임 없이 즉시 전환됨.
const BASE = import.meta.env.BASE_URL

export default function CoupleSprite({ name, blinking, className = '', style }) {
  const common = {
    alt: '',
    draggable: false,
    className: `h-[96px] w-[72px] select-none ${className}`,
    style: { imageRendering: 'pixelated', ...style },
  }
  return (
    <>
      <img src={`${BASE}characters/${name}.png`} {...common} hidden={blinking} />
      <img src={`${BASE}characters/${name}-blink.png`} {...common} hidden={!blinking} />
    </>
  )
}
