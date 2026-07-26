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
