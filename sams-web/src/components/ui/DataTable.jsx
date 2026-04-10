import { clsx } from 'clsx'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'

/**
 * DataTable – reusable sortable table.
 * columns: [{ key, label, render?, className?, sortable? }]
 * rows: array of objects
 */
export function DataTable({ columns, rows, emptyMessage = 'No data available.' }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  const sorted = sort.key
    ? [...rows].sort((a, b) => {
        const av = a[sort.key], bv = b[sort.key]
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
        return sort.dir === 'asc' ? cmp : -cmp
      })
    : rows

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="min-w-full divide-y divide-slate-100">
        <thead>
          <tr className="tbl-head">
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                onClick={() => col.sortable && toggleSort(col.key)}
                className={clsx(
                  'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider select-none',
                  col.sortable && 'cursor-pointer hover:text-slate-700',
                  col.className,
                )}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="flex flex-col gap-0">
                      <ChevronUp   size={10} className={sort.key===col.key && sort.dir==='asc'  ? 'text-brand-600':'text-slate-300'} />
                      <ChevronDown size={10} className={sort.key===col.key && sort.dir==='desc' ? 'text-brand-600':'text-slate-300'} />
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-50">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr key={i} className="tbl-row">
                {columns.map(col => (
                  <td key={col.key} className={clsx('tbl-cell', col.className)}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
