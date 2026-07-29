export function formatArabicDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA', {
    calendar: 'gregory',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getMonthName(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA', { calendar: 'gregory', month: 'long', year: 'numeric' })
}

export function formatDateRange(start: string, end: string, locale: string): string {
  if (start === end) return formatArabicDate(start, locale)
  return `${formatArabicDate(start, locale)} — ${formatArabicDate(end, locale)}`
}

// Days from `from` until the next occurrence of dateStr's month/day, wrapping
// to next year if that month/day has already passed this year. Used to sort
// dated items "soonest first" relative to today in real time, regardless of
// the year stored on the record (e.g. annual world days, or events whose
// date has slipped into the past).
export function daysUntilNextOccurrence(dateStr: string, from: Date = new Date()): number {
  const target = new Date(dateStr)
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  let next = new Date(from.getFullYear(), target.getMonth(), target.getDate())
  if (next < fromMidnight) {
    next = new Date(from.getFullYear() + 1, target.getMonth(), target.getDate())
  }
  return Math.round((next.getTime() - fromMidnight.getTime()) / 86400000)
}

export function sortSoonestFirst<T>(items: T[], getDate: (item: T) => string | null, from: Date = new Date()): T[] {
  return [...items].sort((a, b) => {
    const dateA = getDate(a)
    const dateB = getDate(b)
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1
    return daysUntilNextOccurrence(dateA, from) - daysUntilNextOccurrence(dateB, from)
  })
}
