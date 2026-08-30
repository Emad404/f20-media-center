import * as XLSX from 'xlsx'

// Rows are plain objects keyed by their intended column header (e.g.
// "Title (Arabic)"), so json_to_sheet's own key-to-header behavior gives us
// human-readable headers for free - no separate header-mapping step needed.
export function exportToExcel(rows: Record<string, unknown>[], filenamePrefix: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `${filenamePrefix}-export-${date}.xlsx`)
}

// One sheet per entry in `sheets`, e.g. one employee's rows per sheet.
// Sheet names are sanitized to the characters Excel allows and de-duplicated,
// since two employees could otherwise collide after truncation to 31 chars.
export function exportToExcelSheets(sheets: { name: string; rows: Record<string, unknown>[] }[], filenamePrefix: string) {
  const workbook = XLSX.utils.book_new()
  const usedNames = new Set<string>()
  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows)
    const base = (sheet.name.replace(/[:\\/?*[\]]/g, ' ').trim() || 'Sheet').slice(0, 31)
    let name = base
    let suffixIndex = 2
    while (usedNames.has(name)) {
      const suffix = ` (${suffixIndex})`
      name = base.slice(0, 31 - suffix.length) + suffix
      suffixIndex++
    }
    usedNames.add(name)
    XLSX.utils.book_append_sheet(workbook, worksheet, name)
  })
  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `${filenamePrefix}-export-${date}.xlsx`)
}
