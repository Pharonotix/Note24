/** Data model for the Table block: a small header + rows grid stored as JSON in a node attr. */

export interface TableData {
  headers: string[]
  rows: string[][]
}

export const DEFAULT_TABLE: TableData = {
  headers: ['Column 1', 'Column 2', 'Column 3'],
  rows: [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ]
}

export function serializeTableJson(data: TableData): string {
  return JSON.stringify(data)
}

export function parseTableJson(json: string): TableData {
  try {
    const parsed = JSON.parse(json)
    if (
      parsed &&
      Array.isArray(parsed.headers) &&
      Array.isArray(parsed.rows) &&
      parsed.rows.every((r: unknown) => Array.isArray(r))
    ) {
      return parsed as TableData
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_TABLE
}

export interface NumericColumn {
  index: number
  label: string
  values: string[]
}

/** Columns where every non-empty cell parses as a finite number and at least one cell is non-empty. */
export function numericColumns(data: TableData): NumericColumn[] {
  const out: NumericColumn[] = []
  for (let c = 0; c < data.headers.length; c++) {
    let any = false
    let ok = true
    for (const row of data.rows) {
      const v = (row[c] ?? '').trim()
      if (v === '') continue
      any = true
      if (!Number.isFinite(Number(v))) {
        ok = false
        break
      }
    }
    if (any && ok) {
      out.push({ index: c, label: data.headers[c] || `Column ${c + 1}`, values: data.rows.map((r) => r[c] ?? '') })
    }
  }
  return out
}
