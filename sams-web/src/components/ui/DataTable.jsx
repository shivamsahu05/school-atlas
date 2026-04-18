<<<<<<< HEAD
import React, { useState } from 'react'
import clsx from 'clsx'
import { ChevronUp, ChevronDown } from 'lucide-react'
=======
import { clsx } from 'clsx'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useState } from 'react'
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

/**
 * DataTable – reusable sortable table.
 * columns: [{ key, label, render?, className?, sortable? }]
 * rows: array of objects
<<<<<<< HEAD
 * expandableRender: function(row) returning JSX to be shown directly below the row.
 */
export default function DataTable({ columns, rows, emptyMessage = 'No data available.', expandableRender }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [expandedRows, setExpandedRows] = useState(new Set())
=======
 */
export function DataTable({ columns, rows, emptyMessage = 'No data available.' }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

<<<<<<< HEAD
  const toggleExpand = (rowIndex) => {
    const newSet = new Set(expandedRows)
    if (newSet.has(rowIndex)) newSet.delete(rowIndex)
    else newSet.add(rowIndex)
    setExpandedRows(newSet)
  }

  const sorted = sort.key
    ? [...rows].sort((a, b) => {
        const colDef = columns.find(c => c.key === sort.key) || {}
        const av = colDef.sortBy ? colDef.sortBy(a) : a[sort.key]
        const bv = colDef.sortBy ? colDef.sortBy(b) : b[sort.key]
        
        let cmp = 0
        if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv
        } else {
          cmp = String(av || '').localeCompare(String(bv || ''), undefined, { numeric: true, sensitivity: 'base' })
        }
        
=======
  const sorted = sort.key
    ? [...rows].sort((a, b) => {
        const av = a[sort.key], bv = b[sort.key]
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
        return sort.dir === 'asc' ? cmp : -cmp
      })
    : rows

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="min-w-full divide-y divide-slate-100">
        <thead>
          <tr className="tbl-head">
<<<<<<< HEAD
            {(columns || []).map((col, index) => (
              <th
                key={col.key || `col-${index}`}
=======
            {columns.map(col => (
              <th
                key={col.key}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
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
<<<<<<< HEAD
          {(!sorted || sorted.length === 0) ? (
=======
          {sorted.length === 0 ? (
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
<<<<<<< HEAD
            (sorted || []).map((row, i) => {
              const rowKey = row?.id || row?.key || `row-${i}`;
              return (
              <React.Fragment key={rowKey}>
                <tr className={clsx("tbl-row transition-colors", expandedRows.has(i) && "bg-slate-50/50")}>
                  {(columns || []).map((col, cIdx) => (
                    <td key={col.key || `col-cell-${cIdx}`} className={clsx('tbl-cell', col.className)}>
                      {col.render ? col.render(row?.[col.key], row, { toggleExpand: () => toggleExpand(i), isExpanded: expandedRows.has(i) }) : row?.[col.key]}
                    </td>
                  ))}
                </tr>
                {expandableRender && expandedRows.has(i) && (
                   <tr>
                     <td colSpan={(columns || []).length} className="p-0 border-b border-slate-100 bg-slate-50/40">
                       <div className="animate-slide-up w-full">
                         {expandableRender(row)}
                       </div>
                     </td>
                   </tr>
                )}
              </React.Fragment>
              )
            })
=======
            sorted.map((row, i) => (
              <tr key={i} className="tbl-row">
                {columns.map(col => (
                  <td key={col.key} className={clsx('tbl-cell', col.className)}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
          )}
        </tbody>
      </table>
    </div>
  )
}
