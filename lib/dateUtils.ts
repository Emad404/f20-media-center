export function formatArabicDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getMonthName(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })
}

export function formatDateRange(start: string, end: string): string {
  if (start === end) return formatArabicDate(start)
  return `${formatArabicDate(start)} — ${formatArabicDate(end)}`
}
