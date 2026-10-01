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

/**
 * 오늘(포함)부터 yearsAhead년 이내의 모든 기념일(100일 단위 + 매년 N주년)을
 * 날짜순으로 전부 반환 (개수 제한 없음, 시간이 지나도 항상 "앞으로 N년치").
 * 1000일 단위(1000, 2000, ...)와 N주년은 highlight: true로 표시.
 */
export function getAnniversariesWithinYears(startDateStr, yearsAhead = 5, today = new Date()) {
  const t = startOfDay(today)
  const cutoff = addYears(t, yearsAhead)
  const list = []

  for (let n = 1; n <= 1000; n += 1) {
    const date = get100DayAnniversaryDate(startDateStr, n)
    if (date > cutoff) break
    if (date >= t) {
      list.push({ type: 'hundred', n, label: `${n * 100}일`, date, highlight: n % 10 === 0 })
    }
  }

  for (let n = 1; n <= 100; n += 1) {
    const date = getYearAnniversaryDate(startDateStr, n)
    if (date > cutoff) break
    if (date >= t) {
      list.push({ type: 'year', n, label: `${n}주년`, date, highlight: true })
    }
  }

  list.sort((a, b) => a.date - b.date)

  return list.map((c) => ({
    ...c,
    dday: differenceInCalendarDays(c.date, t),
    dateStr: toDateStr(c.date),
    dateLabel: format(c.date, 'yyyy.MM.dd'),
  }))
}

/**
 * "LOVE 게이지" 진행률: 직전 기념일 -> 다음 기념일 사이에서 오늘이 얼마나 왔는지 0~1.
 * 사귄 날 자체도 기준점(0번째 마일스톤)으로 포함한다.
 */
export function getLoveGaugeProgress(startDateStr, today = new Date()) {
  const start = toDate(startDateStr)
  const t = startOfDay(today)

  const milestones = [{ date: start, label: '시작' }]
  for (let n = 1; n <= 100; n += 1) {
    milestones.push({ date: get100DayAnniversaryDate(startDateStr, n), label: `${n * 100}일` })
    milestones.push({ date: getYearAnniversaryDate(startDateStr, n), label: `${n}주년` })
  }
  milestones.sort((a, b) => a.date - b.date)

  let prev = milestones[0]
  let next = milestones[milestones.length - 1]
  for (let i = 0; i < milestones.length; i += 1) {
    if (milestones[i].date <= t) prev = milestones[i]
    if (milestones[i].date > t) {
      next = milestones[i]
      break
    }
  }

  const totalMs = next.date - prev.date
  const doneMs = t - prev.date
  const progress = totalMs > 0 ? Math.min(1, Math.max(0, doneMs / totalMs)) : 1

  return {
    progress,
    prevLabel: prev.label,
    nextLabel: next.label,
    nextDday: differenceInCalendarDays(next.date, t),
    nextDateLabel: format(next.date, 'yyyy.MM.dd'),
  }
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
