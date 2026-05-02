import { useState, useEffect, useCallback } from 'react'
import {
  Bell, Download, Clock, Loader2
} from 'lucide-react'
import { StatCard, Tabs, StatusBadge, DataTable } from '../../components/ui/index.jsx'
import { academicApi } from '../../api'

const TABS = [
  { value: 'leaves', label: 'Leave Requests' },
]

function downloadCSV(rows, filename) {
  if (!rows || rows.length === 0) return;
  const cols = Object.keys(rows[0]);
  const header = cols.join(',')
  const body = rows.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
  Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename }).click()
}

export default function AdminFollowUps() {
  const [tab, setTab] = useState('leaves')
  const [data, setData] = useState({ leaves: [], summary: {} })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filterMonth, setFilterMonth] = useState('All')
  const [filterYear, setFilterYear] = useState('All')

  const MONTHS = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const YEARS = ['All', '2024', '2025', '2026']

  const fetchFollowUps = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Pass filters to API
      const res = await academicApi.getFollowUps({ month: filterMonth, year: filterYear })
      setData(res.data)
      console.log("[FollowUps] Leave data fetched:", res.data.leaves)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load followup data.')
    } finally {
      setLoading(false)
    }
  }, [filterMonth, filterYear])

  useEffect(() => { fetchFollowUps() }, [fetchFollowUps])

  const leaveCols = [
    { key: 'teacher_name', label: 'Teacher', sortable: true },
    { key: 'type', label: 'Leave Type', sortable: true },
    { key: 'from_date', label: 'From Date', sortable: true, render: v => v?.slice(0, 10) || '—' },
    { key: 'to_date', label: 'To Date', sortable: true, render: v => v?.slice(0, 10) || '—' },
    { key: 'reason', label: 'Reason', sortable: false },
    { key: 'status', label: 'Status', sortable: true, render: v => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Applied On', sortable: true, render: v => v?.slice(0, 10) || '—' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── KPI Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard 
          title="Pending Leave Requests" 
          value={data.summary?.totalPending || 0} 
          icon={Clock} 
          color="amber" 
        />
        <StatCard 
          title="Total Leave History" 
          value={data.leaves?.length || 0} 
          icon={Bell} 
          color="blue" 
        />
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Tabs tabs={TABS} active={tab} onChange={setTab} />
            <div className="flex gap-2">
              <select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(e.target.value)}
                className="text-xs border rounded-md px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-brand-500"
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select 
                value={filterYear} 
                onChange={(e) => setFilterYear(e.target.value)}
                className="text-xs border rounded-md px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-brand-500"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <button 
            onClick={() => downloadCSV(data.leaves || [], `leaves-followups.csv`)}
            className="btn-secondary btn btn-sm gap-1.5"
            disabled={!data.leaves?.length}
          >
            <Download size={13} /> Export History
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-rose-600 text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 size={32} className="animate-spin text-brand-500" />
            <p className="text-sm font-medium">Loading leave follow-ups...</p>
          </div>
        ) : (
          <DataTable 
            columns={leaveCols} 
            rows={data.leaves || []} 
            emptyMessage={`No leave records found for selected filters.`} 
          />
        )}
      </div>
    </div>
  )
}
