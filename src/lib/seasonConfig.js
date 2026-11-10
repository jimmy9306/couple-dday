// 계절(시즌) 테마 설정 — 날짜를 바꾸고 싶으면 이 파일만 고치면 됨.
//
// - 날짜는 한국 시간(KST, Asia/Seoul) 기준 "월-일"(MM-DD), 시작/끝 날짜 모두 포함, 해마다 반복.
// - 위에서부터 처음 맞는 항목이 적용됨. 어느 항목에도 안 맞으면 DEFAULT_THEME.
// - sprites: 홈 화면 캐릭터 이미지 묶음 (SPRITE_SETS 참고)
// - effect : 'leaves'(낙엽) | 'snow'(겨울 장면: 눈 + 눈 쌓인 바닥 + 캐릭터 입김) | null(효과 없음)
// - tree / stable / star / nose : true 이면 그 테마의 기간 동안만 겨울 장면에 각각
//     크리스마스 트리(금색 십자가 + LED 전구) / 마구간(따뜻한 빛) / 베들레헴의 별 / 캐릭터의 루돌프 빨간 코 가 나옴

export const SPRITE_SETS = {
  // dir: public/characters/ 아래 폴더 ('' = 바로 아래). ready: 이미지가 준비됐는지.
  autumn: { dir: '', ready: true }, //          public/characters/jimin.png ...
  winter: { dir: 'winter/', ready: true }, //   public/characters/winter/jimin.png ... (크리스마스)
  // 새해 캐릭터: public/characters/newyear/{jimin,eunji}{,-blink,-wind}.png 를 넣고 ready 를 true 로 바꾸면 적용됨.
  // 그 전까지는 fallback 세트(크리스마스 캐릭터)로 대체됨.
  newyear: { dir: 'newyear/', ready: false, fallback: 'winter' },
}

export const SEASON_THEMES = [
  { id: 'autumn', from: '09-01', to: '11-09', sprites: 'autumn', effect: 'leaves' },
  { id: 'christmas', from: '11-10', to: '12-31', sprites: 'winter', effect: 'snow', tree: true, stable: true, star: true, nose: true },
  { id: 'newyear', from: '01-01', to: '01-31', sprites: 'newyear', effect: 'snow' },
  { id: 'winter', from: '02-01', to: '02-29', sprites: 'winter', effect: 'snow' },
  { id: 'plain', from: '03-01', to: '08-31', sprites: 'autumn', effect: null },
]

const DEFAULT_THEME = { id: 'plain', sprites: 'autumn', effect: null }
const TIME_ZONE = 'Asia/Seoul'

/** 한국 시간 기준 "MM-DD" */
function monthDayInKorea(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type).value
  return `${get('month')}-${get('day')}`
}

/** 해당 시각에 적용할 테마 + 실제로 쓸 캐릭터 폴더(spriteDir) */
export function getSeasonTheme(date = new Date()) {
  const md = monthDayInKorea(date)
  const theme = SEASON_THEMES.find((t) => t.from <= md && md <= t.to) || DEFAULT_THEME
  let set = SPRITE_SETS[theme.sprites]
  if (!set.ready && set.fallback) set = SPRITE_SETS[set.fallback]
  return {
    id: theme.id,
    effect: theme.effect,
    tree: Boolean(theme.tree),
    stable: Boolean(theme.stable),
    star: Boolean(theme.star),
    nose: Boolean(theme.nose),
    spriteDir: set.dir,
  }
}
