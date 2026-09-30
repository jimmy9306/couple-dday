import {
  addDays,
  addYears,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from 'date-fns'

/** 'yyyy-MM-dd' 문자열 -> Date (로컬 자정 기준) */
export function toDate(dateStr) {
  return startOfDay(parseISO(dateStr))
}

export function toDateStr(date) {
  return format(date, 'yyyy-MM-dd')
}

/**
 * 사귄 날짜를 1일차로 하는 오늘 며칠째.
 * @param {string} startDateStr yyyy-MM-dd
 * @param {Date} [today]
 */
export function getDayCount(startDateStr, today = new Date()) {
  const start = toDate(startDateStr)
  const t = startOfDay(today)
  return differenceInCalendarDays(t, start) + 1
}

/**
 * 100일 단위 기념일의 날짜 (n=1 -> 100일, n=2 -> 200일 ...)
 * 1일차 = 사귄 날 이므로, k일째 = start + (k-1)일
 */
export function get100DayAnniversaryDate(startDateStr, n) {
  const start = toDate(startDateStr)
  return addDays(start, n * 100 - 1)
}

/** n주년 날짜 (사귄 날로부터 n년 후 같은 날. 2/29 시작이면 평년엔 2/28로 처리) */
export function getYearAnniversaryDate(startDateStr, n) {
  const start = toDate(startDateStr)
  return addYears(start, n)
}

/**
 * 오늘(포함) 이후로 다가오는 기념일을 가까운 순으로 count개 반환.
 * 100일 단위 + 매년 N주년을 합쳐서 정렬.
 */
export function getUpcomingAnniversaries(startDateStr, today = new Date(), count = 5) {
  const t = startOfDay(today)
  const candidates = []

  for (let n = 1; n <= 100; n += 1) {
    const date = get100DayAnniversaryDate(startDateStr, n)
    if (date >= t) {
      candidates.push({
        type: 'hundred',
        n,
        label: `${n * 100}일`,
        date,
      })
    }
    if (candidates.filter((c) => c.type === 'hundred').length >= count) break
  }

  for (let n = 1; n <= 100; n += 1) {
    const date = getYearAnniversaryDate(startDateStr, n)
    if (date >= t) {
      candidates.push({
        type: 'year',
        n,
        label: `${n}주년`,
        date,
      })
    }
    if (candidates.filter((c) => c.type === 'year').length >= count) break
  }

  candidates.sort((a, b) => a.date - b.date)

  return candidates.slice(0, count).map((c) => ({
    ...c,
    dday: differenceInCalendarDays(c.date, t),
    dateStr: toDateStr(c.date),
    dateLabel: format(c.date, 'yyyy.MM.dd'),
  }))
}

/** 특정 날짜(yyyy-MM-dd)가 100일 단위 또는 주년 기념일이면 라벨을, 아니면 null을 반환 */
export function getAnniversaryLabelForDate(startDateStr, dateStr) {
  const start = toDate(startDateStr)
  const target = toDate(dateStr)
  if (target < start) return null

  const dayNum = differenceInCalendarDays(target, start) + 1
  if (dayNum > 0 && dayNum % 100 === 0) {
    return `${dayNum}일`
  }

  for (let n = 1; n <= 100; n += 1) {
    const yearDate = getYearAnniversaryDate(startDateStr, n)
    if (toDateStr(yearDate) === dateStr) {
      return `${n}주년`
    }
    if (yearDate > target) break
  }

  return null
}
