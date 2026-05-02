import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle, AlertCircle, XCircle, Download, Calendar,
  MessageCircle, Clock, BarChart2, ChevronRight, ChevronLeft, List, Loader2
} from 'lucide-react'
import {
  StatCard, SectionHeader, StatusBadge, FilterChips
} from '../../components/ui/index.jsx'
import { leaveApi } from '../../services/schoolApi'
import clsx from 'clsx'

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ────────────────────────────────────────────────────────────────────────────
// Leave Calendar Sub-Component
// ────────────────────────────────────────────────────────────────────────────
function LeaveCalendar({ leaves }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-display font-bold text-slate-800">{monthName} {year}</h3>
          <p className="text-xs text-slate-400 mt-1">Calendar view of all approved staff leaves</p>
        </div>
        <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 gap-1">
          <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-500 transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-t border-l border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {DAYS.map(day => (
          <div key={day} className="bg-slate-50/50 p-4 text-center border-r border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{day}</span>
          </div>
        ))}
        {Array.from({ length: 42 }).map((_, i) => {
          const dayNum = i - firstDay + 1
          const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth
          
          let dayLeaves = []
          if (isCurrentMonth) {
            const thisDate = new Date(year, month, dayNum)
            thisDate.setHours(0,0,0,0)
            
            dayLeaves = leaves.filter(l => {
              const start = new Date(l.from_date)
              const end = new Date(l.to_date)
              start.setHours(0,0,0,0)
              end.setHours(23,59,59,999)
              return thisDate >= start && thisDate <= end
            })
          }

          const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString()

          return (
            <div 
              key={i} 
              className={clsx(
                "min-h-[120px] p-2 border-r border-b border-slate-100 group transition-colors",
                !isCurrentMonth ? "bg-slate-50/30" : "bg-white hover:bg-slate-50/50",
                isToday && "bg-brand-50/30 ring-1 ring-inset ring-brand-100"
              )}
            >
              {isCurrentMonth && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx(
                      "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                      isToday ? "bg-brand-500 text-white shadow-md shadow-brand-100 scale-110" : "text-slate-400 group-hover:text-slate-600"
                    )}>
                      {dayNum}
                    </span>
                    {dayLeaves.length > 0 && (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md">
                        {dayLeaves.length} Out
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayLeaves.map((l, idx) => (
                      <div 
                        key={`${l.id}-${dayNum}-${idx}`} 
                        className="text-[9px] px-1.5 py-1 rounded-md border border-rose-100 bg-rose-50 text-rose-700 truncate font-semibold shadow-sm animate-fade-in"
                        title={`${l.user?.name || 'Teacher'}: ${l.reason || l.type}`}
                      >
                        {l.user?.name || 'Teacher'}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


export default function AdminLeave() {
  const [searchParams] = useSearchParams()
  const [leaves, setLeaves] = useState([])
  const [summary, setSummary] = useState({ Pending: 0, Approved: 0, Rejected: 0 })
  const [filter, setFilter] = useState('Pending')
  const [mode, setMode] = useState(searchParams.get('view') === 'calendar' ? 'calendar' : 'list')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    loadLeaves()
  }, [])

  const loadLeaves = async () => {
    setLoading(true)
    try {
      const res = await leaveApi.getAll()
      const data = res.data?.data || res.data || {}
      const items = Array.isArray(data?.items) ? data.items
        : Array.isArray(data) ? data : []
      setLeaves(items)
      if (data?.summary) setSummary({ Pending: 0, Approved: 0, Rejected: 0, ...data.summary })
    } catch (err) {
      console.error('Failed to load leaves:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'All' ? leaves : leaves.filter(l => l.status === filter)

  const updateStatus = async (id, status) => {
    setActionLoading(id)
    try {
      await leaveApi.update(id, { status })
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l))
      loadLeaves() // reload for summary
    } catch (err) {
      alert('Failed to update leave: ' + (err.response?.data?.message || err.message))
    } finally {
      setActionLoading(null)
    }
  }

  const handleExportCSV = () => {
    const headers = ['Teacher', 'Type', 'From', 'To', 'Applied Date', 'Reason', 'Status']
    const rows = leaves.map(l => [
      l.user?.name || '-',
      l.type || '-',
      formatDate(l.from_date),
      formatDate(l.to_date),
      formatDate(l.applied_date),
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      l.status || '-'
    ])
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `SAMS_Leave_Report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Leave Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track, approve & export staff leave records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
            <button onClick={() => setMode('list')} className={clsx("px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all", mode === 'list' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}><List size={14} /> List View</button>
            <button onClick={() => setMode('calendar')} className={clsx("px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all", mode === 'calendar' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}><Calendar size={14} /> Calendar</button>
          </div>
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 px-5 py-2.5 font-bold"><Download size={16} /> Export</button>
        </div>
      </div>

      {mode === 'calendar' ? (
        <LeaveCalendar leaves={leaves.filter(l => l.status === 'Approved')} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Pending" value={summary.Pending} icon={AlertTriangle} color="amber" loading={loading} />
            <StatCard title="Approved" value={summary.Approved} icon={CheckCircle} color="green" loading={loading} />
            <StatCard title="Rejected" value={summary.Rejected} icon={AlertCircle} color="red" loading={loading} />
          </div>

          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <SectionHeader title="Staff Leave Requests" subtitle="Approval & tracking" />
              <FilterChips options={['All', 'Pending', 'Approved', 'Rejected']} value={filter} onChange={setFilter} />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-brand-500" size={32} />
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(leave => (
                  <div key={leave.id} className="border border-slate-100 rounded-2xl p-4 transition-all hover:bg-slate-50/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                            {(leave.user?.name || '?')[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{leave.user?.name || 'Unknown Teacher'}</p>
                            <p className="text-[10px] text-slate-400">{leave.user?.email || ''}</p>
                          </div>
                          <span className="badge-gray badge text-[10px]">{leave.type || 'Leave'}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 font-medium">
                          {formatDate(leave.from_date)} – {formatDate(leave.to_date)} · Applied: {formatDate(leave.applied_date)}
                        </p>
                        {leave.reason && (
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md italic">"{leave.reason}"</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={leave.status} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
                      {leave.status !== 'Approved' && (
                        <button
                          onClick={() => updateStatus(leave.id, 'Approved')}
                          disabled={actionLoading === leave.id}
                          className="btn-success px-4 py-2 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                      )}
                      {leave.status !== 'Rejected' && (
                        <button
                          onClick={() => updateStatus(leave.id, 'Rejected')}
                          disabled={actionLoading === leave.id}
                          className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      )}
                      {leave.status !== 'Pending' && (
                        <button
                          onClick={() => updateStatus(leave.id, 'Pending')}
                          disabled={actionLoading === leave.id}
                          className="bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Clock size={14} /> Reset
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No {filter.toLowerCase()} leave requests.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
