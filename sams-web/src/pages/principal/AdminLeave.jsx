import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Bell, BookOpen, AlertTriangle, CheckCircle, AlertCircle, Eye, Plus, Send, Trash2,
  Edit2, Save, XCircle, Download, Calendar, IndianRupee, MessageCircle, Clock, BarChart2,
  ChevronDown, GraduationCap, LayoutGrid, Users, RotateCcw, Search, ChevronRight,
  ChevronLeft, List, Zap, UserPlus
} from 'lucide-react'
import {
  StatCard, SectionHeader, Tabs, StatusBadge, ProgressBar,
  Modal, FilterChips, DataTable, FormInput, SelectDropdown
} from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { HOMEWORK, WEEKLY_HOMEWORK, SYLLABUS_ITEMS, WEEKLY_SYLLABUS, OBSERVATIONS as INIT_OBS, TEACHER_PERFORMANCE, OBS_CHART, LEAVES as INIT_LEAVES, ALL_TEACHERS as INIT_TEACHERS, STUDENTS as INIT_STUDENTS, WEEKLY_SCHEDULE, MARKS_OVERVIEW } from '../../data/dummyData'
import { ALL_CLASSES, DEPARTMENTS, SUBJECTS, PERFORMANCE_WEIGHTS, OBSERVATION_CRITERIA } from '../../data/constants'
import clsx from 'clsx'

// ────────────────────────────────────────────────────────────────────────────
// Leave Calendar Sub-Component
// ────────────────────────────────────────────────────────────────────────────
function LeaveCalendar({ leaves }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay() // 0-6

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
              const start = new Date(l.from)
              const end = new Date(l.to)
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
                        title={`${l.teacher}: ${l.reason}`}
                      >
                        {l.teacher}
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
  const [leaves, setLeaves] = useState(INIT_LEAVES)
  const [filter, setFilter] = useState('Pending')
  const [mode, setMode] = useState(searchParams.get('view') === 'calendar' ? 'calendar' : 'list')
  const [showExport, setShowExport] = useState(false)
  const [exportPeriod, setExportPeriod] = useState('month')
  const [exportStatus, setExportStatus] = useState('All')
  const [showForceModal, setShowForceModal] = useState(false)

  // Force leave form state
  const [forceForm, setForceForm] = useState({
    teacherId: '',
    teacherName: '',
    from: '',
    to: '',
    reason: '',
    deductionDays: 1
  })

  // Urgent leave state (existing)
  const [urgentLeaves, setUrgentLeaves] = useState([
    { id: 'u1', teacher: 'Ramesh Patel', subject: 'Mathematics', class: 'Grade 8-A', type: 'Sick', tag: 'Same Day', reason: 'Severe migraine, unable to attend school today.', from: 'Today', to: 'Tomorrow', applied: 'Just now', penalty: '2-day salary deduction applies (same-day application)' },
    { id: 'u2', teacher: 'Sunita Joshi', subject: 'Science', class: 'Grade 9-B', type: 'Medical Emergency', tag: 'Emergency', reason: 'Family medical emergency, need to rush to hospital immediately.', from: 'Today', to: '3 days', applied: '30 min ago', penalty: 'Salary deduction as per emergency leave policy' },
  ])
  const [urgentHistory, setUrgentHistory] = useState([])

  // Teacher list for dropdown
  const teacherOptions = useMemo(() => {
    return INIT_TEACHERS.map(t => ({ value: t.id, label: t.name }))
  }, [])

  const handleUrgentAction = (id, action) => {
    const leave = urgentLeaves.find(l => l.id === id)
    if (!leave) return
    if (action === 'Approved') {
      const msg = `Hello ${leave.teacher}, your urgent ${leave.type} leave for ${leave.from} has been APPROVED by the Principal. Regards, SAMS Admin.`
      window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank')
    } else if (action === 'Rejected') {
      const msg = `Hello ${leave.teacher}, your urgent ${leave.type} leave for ${leave.from} has been REJECTED by the Principal. Please contact administration. Regards, SAMS Admin.`
      window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank')
    }
    setUrgentHistory(prev => [...prev, { ...leave, status: action, actionTime: new Date().toLocaleTimeString() }])
    setUrgentLeaves(prev => prev.filter(l => l.id !== id))
  }

  const handleHistoryAction = (id, action) => {
    const leave = urgentHistory.find(l => l.id === id)
    if (!leave) return
    if (action === 'Approved') {
      const msg = `Hello ${leave.teacher}, your urgent ${leave.type} leave for ${leave.from} has been APPROVED by the Principal. Regards, SAMS Admin.`
      window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank')
    } else if (action === 'Rejected') {
      const msg = `Hello ${leave.teacher}, your urgent ${leave.type} leave for ${leave.from} has been REJECTED by the Principal. Please contact administration. Regards, SAMS Admin.`
      window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank')
    }
    setUrgentHistory(prev => prev.map(l => l.id === id ? { ...l, status: action, actionTime: new Date().toLocaleTimeString() } : l))
    alert(`Leave status changed to ${action}.`)
  }

  const filtered = filter === 'All' ? leaves : leaves.filter(l => l.status === filter)

  const updateStatus = (id, status) => {
    setLeaves(prev => prev.map(l => {
      if (l.id === id) {
        if (status === 'Approved') {
          const msg = `Hello ${l.teacher}, your leave request for ${l.from} to ${l.to} has been APPROVED by the Principal. Regards, SAMS Admin.`
          const url = `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`
          window.open(url, '_blank')
        }
        return { ...l, status }
      }
      return l
    }))
  }

  const checkDeduction = (applyDate, fromDate) => {
    const apply = new Date(applyDate)
    const start = new Date(fromDate)
    const diff = (start.getTime() - apply.getTime()) / (1000 * 3600 * 24)
    return diff < 1
  }

  const handleExportExcel = () => {
    let rows = []
    if (exportStatus === 'Urgent') {
      const allUrgent = [...urgentLeaves.map(l => ({ ...l, status: 'Pending' })), ...urgentHistory]
      rows = allUrgent.map(l => [l.teacher, l.type, l.from, l.to, l.applied, `"${l.reason}"`, l.status, `"${l.tag} - ${l.penalty || ''}"`])
    } else {
      const now = new Date()
      const periodDays = { week: 7, month: 30, '6months': 180, year: 365 }
      const cutoff = new Date(now.getTime() - periodDays[exportPeriod] * 24 * 60 * 60 * 1000)
      let exportData = leaves.filter(l => {
        const leaveDate = new Date(l.from)
        if (isNaN(leaveDate)) return true
        return leaveDate >= cutoff
      })
      if (exportStatus !== 'All') exportData = exportData.filter(l => l.status === exportStatus)
      rows = exportData.map(l => [
        l.teacher, l.type, l.from, l.to, l.applied, `"${l.reason}"`, l.status, l.isForced ? `Forced - ${l.deductionDays || 0} days deduction` : ''
      ])
    }
    const headers = ['Teacher', 'Type', 'From', 'To', 'Applied Date', 'Reason', 'Status', 'Urgent Notes']
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const periodLabel = { week: 'Weekly', month: 'Monthly', '6months': '6Months', year: 'Yearly' }
    link.href = url
    link.download = `SAMS_Leave_Report_${periodLabel[exportPeriod]}_${exportStatus}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  const handleForceLeaveSubmit = () => {
    const { teacherId, teacherName, from, to, reason, deductionDays } = forceForm
    if (!teacherId || !teacherName || !from || !to || !reason) {
      alert('Please fill all required fields.')
      return
    }
    const newLeave = {
      id: Date.now(),
      teacher: teacherName,
      type: 'Forced Leave',
      from,
      to,
      applied: new Date().toLocaleDateString('en-IN'),
      reason,
      status: 'Approved',
      isForced: true,
      deductionDays: parseInt(deductionDays) || 0,
    }
    setLeaves(prev => [newLeave, ...prev])
    // Optional WhatsApp notification to teacher
    const msg = `Dear ${teacherName}, the administration has recorded a forced leave for you from ${from} to ${to}. Reason: ${reason}. ${deductionDays} day(s) salary deduction will apply. Regards, SAMS Admin.`
    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank')
    setShowForceModal(false)
    setForceForm({ teacherId: '', teacherName: '', from: '', to: '', reason: '', deductionDays: 1 })
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

          {/* Force Leave Button */}
          <button onClick={() => setShowForceModal(true)} className="btn-secondary flex items-center gap-2 px-5 py-2.5 font-bold bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100">
            <UserPlus size={16} /> Force Leave
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button onClick={() => setShowExport(!showExport)} className="btn-secondary flex items-center gap-2 px-5 py-2.5 font-bold"><Download size={16} /> Export</button>
            {showExport && (
              <div className="absolute right-0 top-12 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-[320px] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800">📊 Export Leave Data</h4>
                  <button onClick={() => setShowExport(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={16} /></button>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Period</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[{ id: 'week', label: 'Last Week' }, { id: 'month', label: 'Last Month' }, { id: '6months', label: '6 Months' }, { id: 'year', label: 'Full Year' }].map(p => (
                      <button key={p.id} onClick={() => setExportPeriod(p.id)} className={clsx("px-3 py-2 rounded-lg text-[11px] font-bold border transition-all text-center", exportPeriod === p.id ? "bg-brand-50 border-brand-200 text-brand-600" : "bg-white border-slate-100 text-slate-500")}>{p.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Status</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {['All', 'Approved', 'Pending', 'Urgent'].map(s => (
                      <button key={s} onClick={() => setExportStatus(s)} className={clsx("px-3 py-2 rounded-lg text-[11px] font-bold border transition-all text-center", exportStatus === s ? "bg-teal-50 border-teal-200 text-teal-600" : "bg-white border-slate-100 text-slate-500")}>{s}</button>
                    ))}
                  </div>
                </div>
                <button onClick={handleExportExcel} className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">Download Report (.csv)</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mode === 'calendar' ? (
        <LeaveCalendar leaves={leaves.filter(l => l.status === 'Approved')} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Pending" value={leaves.filter(l => l.status === 'Pending').length} icon={AlertTriangle} color="amber" />
            <StatCard title="Approved" value={leaves.filter(l => l.status === 'Approved').length} icon={CheckCircle} color="green" />
            <StatCard title="Rejected" value={leaves.filter(l => l.status === 'Rejected').length} icon={AlertCircle} color="red" />
            <StatCard title="Deductions" value={leaves.filter(l => l.isForced || l.status === 'Rejected' || checkDeduction(l.applied, l.from)).length} icon={BarChart2} color="purple" />
          </div>

          {/* Urgent Leave Section (existing) */}
          {urgentLeaves.length > 0 && (
            <div className="bg-white p-6 rounded-[32px] border-2 border-rose-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center animate-pulse"><AlertTriangle size={20} /></div>
                <div>
                  <h3 className="text-sm font-bold text-rose-700">⚡ Urgent Leave Requests</h3>
                  <p className="text-[11px] text-rose-400 font-medium">Same-day or emergency leaves requiring immediate action</p>
                </div>
                <span className="ml-auto bg-rose-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">{urgentLeaves.length} Urgent</span>
              </div>
              <div className="space-y-3">
                {urgentLeaves.map(leave => (
                  <div key={leave.id} className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">{leave.teacher[0]}</div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{leave.teacher}</p>
                            <p className="text-[10px] text-slate-400">{leave.subject} · {leave.class}</p>
                          </div>
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-bold"><Clock size={10} /> {leave.tag}</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">{leave.type}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 font-medium"><span className="font-bold text-slate-700">{leave.from}</span> – <span className="font-bold text-slate-700">{leave.to}</span><span className="text-slate-300 mx-2">·</span>Applied: {leave.applied}</p>
                        <p className="text-xs text-slate-500 mt-1 italic">"{leave.reason}"</p>
                        <p className="text-[10px] text-rose-500 font-bold mt-2 bg-rose-50 inline-block px-2 py-0.5 rounded-md border border-rose-100">⚠ {leave.penalty}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleUrgentAction(leave.id, 'Approved')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-1.5"><CheckCircle size={13} /> Approve & Notify</button>
                        <button onClick={() => handleUrgentAction(leave.id, 'Rejected')} className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"><XCircle size={13} /> Reject & Notify</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Urgent History */}
          {urgentHistory.length > 0 && (
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><Clock size={20} /></div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">📋 Urgent Leave Actions</h3>
                  <p className="text-[11px] text-slate-400 font-medium">History of approved & rejected urgent leaves</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full">{urgentHistory.filter(l => l.status === 'Approved').length} Approved</span>
                  <span className="bg-rose-100 text-rose-700 text-[11px] font-bold px-3 py-1 rounded-full">{urgentHistory.filter(l => l.status === 'Rejected').length} Rejected</span>
                </div>
              </div>
              <div className="space-y-2">
                {urgentHistory.map(leave => (
                  <div key={`hist-${leave.id}`} className={clsx("rounded-xl p-4 border transition-all", leave.status === 'Approved' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100')}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs", leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600')}>{leave.teacher[0]}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-800 text-sm">{leave.teacher}</p>
                            <span className="text-[10px] text-slate-400">{leave.subject}</span>
                            <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold", leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200')}>{leave.status === 'Approved' ? '⚠⬦ Approved' : 'â Rejected'}</span>
                            <span className="text-[10px] text-slate-300">at {leave.actionTime}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{leave.type} · {leave.from} – {leave.to}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {leave.status === 'Rejected' && (
                          <button onClick={() => handleHistoryAction(leave.id, 'Approved')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-1.5"><CheckCircle size={13} /> Approve & Notify</button>
                        )}
                        {leave.status === 'Approved' && (
                          <>
                            <button onClick={() => handleHistoryAction(leave.id, 'Rejected')} className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"><XCircle size={13} /> Reject & Notify</button>
                            <button onClick={() => { const msg = `Hello ${leave.teacher}, your leave for ${leave.from} has been APPROVED.`; window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank') }} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-200" title="Resend WhatsApp notification"><MessageCircle size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <SectionHeader title="Staff Leave Requests" subtitle="Approval & Salary Rule Tracking" />
              <FilterChips options={['All', 'Pending', 'Approved', 'Rejected']} value={filter} onChange={setFilter} />
            </div>
            <div className="space-y-3">
              {filtered.map(leave => {
                const needsDeduction = checkDeduction(leave.applied, leave.from)
                return (
                  <div key={leave.id} className="border border-slate-100 rounded-2xl p-4 transition-all hover:bg-slate-50/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-800 text-sm">{leave.teacher}</p>
                          <span className="badge-gray badge text-[10px]">{leave.type} Leave</span>
                          {leave.isForced && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold">
                              <Zap size={10} /> Forced by Admin
                            </span>
                          )}
                          {needsDeduction && leave.status === 'Pending' && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold"><AlertTriangle size={10} /> 2-Day Penalty</span>
                          )}
                          {leave.isForced && leave.deductionDays > 0 && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold"><IndianRupee size={10} /> {leave.deductionDays} day(s) salary cut</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{leave.from} – {leave.to} · Applied: {leave.applied}</p>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md italic">"{leave.reason}"</p>
                        {leave.isForced && (
                          <p className="text-[10px] text-purple-600 font-medium mt-1">This leave was recorded by administration.</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={leave.status} />
                        {leave.status === 'Approved' && (
                          <button onClick={() => { const msg = `Hello ${leave.teacher}, your leave for ${leave.from} has been APPROVED.`; window.open(`https://wa.me/919100000000?text=${encodeURIComponent(msg)}`, '_blank') }} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Notify via WhatsApp"><MessageCircle size={16} /></button>
                        )}
                      </div>
                    </div>
                    {(leave.status === 'Pending' || leave.status === 'Rejected') && !leave.isForced && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                        <div className="flex-1">
                          {needsDeduction && leave.status === 'Pending' && <p className="text-[10px] text-slate-400 mb-2">Note: Applied late. 2 days salary will be deducted upon approval.</p>}
                          <div className="flex gap-2">
                            <button onClick={() => updateStatus(leave.id, 'Approved')} className="btn-success flex-1 justify-center py-2.5 text-xs font-bold flex items-center gap-1.5"><CheckCircle size={14} /> Approve & Notify</button>
                            {leave.status === 'Pending' && <button onClick={() => updateStatus(leave.id, 'Rejected')} className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-1.5"><XCircle size={14} /> Reject</button>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {filtered.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">No {filter.toLowerCase()} leave requests.</div>}
            </div>
          </div>
        </>
      )}

      {/* Force Leave Modal */}
      <Modal open={showForceModal} onClose={() => setShowForceModal(false)} title="Record Forced Leave" size="md">
        <div className="space-y-5">
          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex gap-3">
            <AlertTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 leading-relaxed">This will create an approved leave record for a teacher who did not apply. Salary deduction will be applied automatically.</p>
          </div>
          <SelectDropdown
            label="Select Teacher *"
            options={teacherOptions}
            value={forceForm.teacherId}
            onChange={e => {
              const selected = INIT_TEACHERS.find(t => t.id === e.target.value)
              setForceForm({ ...forceForm, teacherId: e.target.value, teacherName: selected?.name || '' })
            }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="From Date *" type="date" value={forceForm.from} onChange={e => setForceForm({ ...forceForm, from: e.target.value })} />
            <FormInput label="To Date *" type="date" value={forceForm.to} onChange={e => setForceForm({ ...forceForm, to: e.target.value })} />
          </div>
          <FormInput label="Reason *" placeholder="e.g., Unauthorized absence" value={forceForm.reason} onChange={e => setForceForm({ ...forceForm, reason: e.target.value })} />
          <FormInput label="Salary Deduction (Days) *" type="number" min="0" value={forceForm.deductionDays} onChange={e => setForceForm({ ...forceForm, deductionDays: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <button onClick={handleForceLeaveSubmit} className="btn-primary flex-1 justify-center py-3 bg-rose-600 hover:bg-rose-700"><Save size={16} /> Record Forced Leave</button>
            <button onClick={() => setShowForceModal(false)} className="btn-secondary px-8">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
