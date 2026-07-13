import { useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { parseDelimited } from '../../../lib/csv'
import {
  numericColumns,
  parseTableJson,
  serializeTableJson,
  type TableData
} from '../../../lib/tableData'
import type { DesmosSeed } from '../../../lib/desmos'
import { ConfirmDialog } from '../../ConfirmDialog/ConfirmDialog'
import styles from './DataTable.module.css'

export function DataTableView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos
}: NodeViewProps): React.JSX.Element {
  const editable = editor.isEditable
  const [data, setData] = useState<TableData>(() => parseTableJson(node.attrs.dataJson as string))
  const [pendingImport, setPendingImport] = useState<TableData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const commit = (next: TableData): void => {
    setData(next)
    if (!editable) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => updateAttributes({ dataJson: serializeTableJson(next) }), 500)
  }

  const setCell = (r: number, c: number, value: string): void => {
    const rows = data.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row))
    commit({ ...data, rows })
  }

  const setHeader = (c: number, value: string): void => {
    const headers = data.headers.map((h, ci) => (ci === c ? value : h))
    commit({ ...data, headers })
  }

  const addRow = (): void => commit({ ...data, rows: [...data.rows, new Array(data.headers.length).fill('')] })

  const addCol = (): void =>
    commit({
      headers: [...data.headers, `Column ${data.headers.length + 1}`],
      rows: data.rows.map((r) => [...r, ''])
    })

  const removeRow = (i: number): void => {
    if (data.rows.length <= 1) return
    commit({ ...data, rows: data.rows.filter((_, ri) => ri !== i) })
  }

  const removeCol = (i: number): void => {
    if (data.headers.length <= 1) return
    commit({
      headers: data.headers.filter((_, ci) => ci !== i),
      rows: data.rows.map((r) => r.filter((_, ci) => ci !== i))
    })
  }

  const onCellPaste = (r: number, c: number, e: React.ClipboardEvent<HTMLInputElement>): void => {
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    const grid = parseDelimited(text)
    if (grid.length <= 1 && (grid[0]?.length ?? 0) <= 1) return
    e.preventDefault()

    const neededCols = c + Math.max(...grid.map((row) => row.length))
    const neededRows = r + grid.length

    const headers = [...data.headers]
    while (headers.length < neededCols) headers.push(`Column ${headers.length + 1}`)

    const rows = data.rows.map((row) => {
      const nr = [...row]
      while (nr.length < headers.length) nr.push('')
      return nr
    })
    while (rows.length < neededRows) rows.push(new Array(headers.length).fill(''))

    grid.forEach((gRow, gi) => {
      gRow.forEach((val, gj) => {
        rows[r + gi][c + gj] = val
      })
    })
    commit({ headers, rows })
  }

  const hasContent = data.rows.some((r) => r.some((c) => c.trim() !== ''))

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await file.text()
    const grid = parseDelimited(text)
    if (!grid.length) return
    const [headerRow, ...dataRows] = grid
    const width = Math.max(headerRow.length, ...dataRows.map((r) => r.length), 1)
    const headers = Array.from({ length: width }, (_, i) => headerRow[i]?.trim() || `Column ${i + 1}`)
    const rows = dataRows.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''))
    const imported: TableData = { headers, rows: rows.length ? rows : [new Array(width).fill('')] }
    if (hasContent) setPendingImport(imported)
    else commit(imported)
  }

  const numCols = numericColumns(data)
  const canGraph = numCols.length >= 2

  const onGraph = (): void => {
    if (!canGraph) return
    const from = getPos()
    if (from == null) return
    const seed: DesmosSeed = {
      kind: 'table',
      columns: numCols.slice(0, 2).map((c) => ({ label: c.label, values: c.values }))
    }
    const pos = from + node.nodeSize
    editor
      .chain()
      .focus()
      .insertContentAt(pos, { type: 'desmos', attrs: { seed: JSON.stringify(seed) } })
      .run()
  }

  return (
    <NodeViewWrapper className={styles.wrap}>
      <div
        className={selected ? `${styles.frame} ${styles.sel}` : styles.frame}
        contentEditable={false}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.icon}>▦</span>
          <span className={styles.label}>Table</span>
          {editable && (
            <>
              <button type="button" className={styles.hbtn} onClick={addCol} title="Add column">
                + Col
              </button>
              <button type="button" className={styles.hbtn} onClick={addRow} title="Add row">
                + Row
              </button>
              <button
                type="button"
                className={styles.hbtn}
                onClick={() => fileInputRef.current?.click()}
                title="Import CSV / TSV file"
              >
                Import CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,text/csv,text/tab-separated-values,text/plain"
                className={styles.hiddenFile}
                onChange={(e) => void onFileChosen(e)}
              />
              <button
                type="button"
                className={styles.hbtn}
                onClick={onGraph}
                disabled={!canGraph}
                title={canGraph ? 'Graph the first two numeric columns' : 'Need at least 2 numeric columns to graph'}
              >
                📈 Graph
              </button>
            </>
          )}
        </div>

        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                {data.headers.map((h, c) => (
                  <th key={c} className={styles.th}>
                    <input
                      className={styles.headerInput}
                      value={h}
                      readOnly={!editable}
                      onChange={(e) => setHeader(c, e.target.value)}
                      onPaste={(e) => onCellPaste(0, c, e)}
                    />
                    {editable && data.headers.length > 1 && (
                      <button
                        type="button"
                        className={styles.colDel}
                        onClick={() => removeCol(c)}
                        title="Remove column"
                      >
                        ×
                      </button>
                    )}
                  </th>
                ))}
                {editable && data.rows.length > 1 && <th className={styles.rowDelCell} />}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className={styles.td}>
                      <input
                        className={styles.cellInput}
                        value={cell}
                        readOnly={!editable}
                        onChange={(e) => setCell(r, c, e.target.value)}
                        onPaste={(e) => onCellPaste(r, c, e)}
                      />
                    </td>
                  ))}
                  {editable && data.rows.length > 1 && (
                    <td className={styles.rowDelCell}>
                      <button
                        type="button"
                        className={styles.rowDel}
                        onClick={() => removeRow(r)}
                        title="Remove row"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        request={
          pendingImport
            ? {
                title: 'Replace table data?',
                message: 'Importing this file will replace the current table contents.',
                confirmLabel: 'Replace',
                danger: true
              }
            : null
        }
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) commit(pendingImport)
          setPendingImport(null)
        }}
      />
    </NodeViewWrapper>
  )
}
