import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Send, AlertTriangle, Info, Zap, IndianRupee } from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge, Tabs } from '../../components/ui/index.jsx'
import { LEAVES } from '../../data/dummyData'

const TABS = [
  { value: 'history', label: 'My Leaves' },
  { value: 'apply', label: 'Apply Leave' },
  { value: 'urgent', label: 'Urgent Leave' }
]

const LEAVE_TYPES = [
  { label: 'Casual Leave', deduction: false },
  { label: 'Sick Leave', deduction: false },
  { label: 'Earned Leave', deduction: false },
  { label: 'Half Day', deduction: false },
  { label: 'Unpaid Leave', deduction: true },
]

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date().setHours(0, 0, 0, 0)) / 86400000)
  return diff
}

export default function TeacherLeave() {
  const [tab, setTab] = useState('history')
  const [form, setForm] = useState({ type: '', from: '', to: '', reason: '' })
  const [submitted, setSubmitted] = useState(false)

  // Urgent leave state
  const [urgentForm, setUrgentForm] = useState({ description: '', from: '', to: '' })
  const [urgentSubmitted, setUrgentSubmitted] = useState(false)

  const myLeaves = (LEAVES ?? []).filter(l => l?.teacher === 'Priya Sharma')
  const approved = myLeaves.filter(l => l?.status === 'Approved').length
  const pending = myLeaves.filter(l => l?.status === 'Pending').length
  const rejected = myLeaves.filter(l => l?.status === 'Rejected').length

  // Filter forced leaves
  const forcedLeaves = myLeaves.filter(l => l.isForced === true)

  const daysNotice = daysUntil(form.from)
  const isLate = daysNotice !== null && daysNotice < 2
  const selectedType = LEAVE_TYPES.find(t => t.label === form.type)
  const hasDeduction = selectedType?.deduction === true

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleUrgentSubmit = (e) => {
    e.preventDefault()
    setUrgentSubmitted(true)
  }

  const now = new Date()
  const currentDate = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Approved" value={approved} icon={CheckCircle} color="green" />
        <StatCard title="Pending" value={pending} icon={Clock} color="amber" />
        <StatCard title="Rejected" value={rejected} icon={XCircle} color="red" />
      </div>

      {/* Salary deduction global notice for rejected leaves */}
      {rejected > 0 && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <Info size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700">Salary Deduction Notice</p>
            <p className="text-xs text-rose-600 mt-0.5">
              {rejected} rejected leave{rejected > 1 ? 's' : ''} on record. Rejected leaves may be processed as Loss of Pay by admin at month-end.
            </p>
          </div>
        </div>
      )}

      {/* Forced leave warning banner */}
      {forcedLeaves.length > 0 && (
        <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
          <Zap size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-800">Admin Recorded Leave</p>
            <p className="text-xs text-purple-700 mt-0.5">
              The administration has recorded {forcedLeaves.length} forced leave record(s) for you.
              {forcedLeaves.some(l => l.deductionDays > 0) && ' Salary deduction will apply as noted.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab panel */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <SectionHeader title="Leave Management" subtitle="Apply & track your requests" />
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {/* ── History ── */}
        {tab === 'history' && (
          <div className="space-y-3">
            {myLeaves.map(leave => (
              <div key={leave?.id || Math.random()} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 text-sm">{leave?.type ?? 'Leave'} Leave</p>
                      {leave?.isForced && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold">
                          <Zap size={10} /> Admin Forced
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{leave?.from ?? '-'} – {leave?.to ?? '-'}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm">{leave?.reason ?? '-'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Applied on: {leave?.applied ?? '-'}</p>
                    
                    {/* Show salary deduction info for forced leaves */}
                    {leave?.isForced && leave?.deductionDays > 0 && (
                      <p className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 w-fit">
                        <IndianRupee size={10} /> Salary deduction: {leave.deductionDays} day(s)
                      </p>
                    )}
                    
                    {leave?.status === 'Rejected' && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-rose-600 font-semibold">
                        <AlertTriangle size={10} /> May affect salary — contact admin
                      </span>
                    )}
                  </div>
                  <StatusBadge status={leave?.status ?? 'Pending'} />
                </div>
              </div>
            ))}
            {myLeaves.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 text-sm">No leave history found.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Apply Regular Leave ── */}
        {tab === 'apply' && (
          <>
            {submitted ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">Leave Applied Successfully!</h3>
                <p className="text-slate-400 text-sm mb-6">Your application is pending approval.</p>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setForm({ type: '', from: '', to: '', reason: '' })
                  }}
                  className="btn-primary btn"
                >
                  Apply Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
                <div>
                  <label className="label">Leave Type</label>
                  <select
                    className="select"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    required
                  >
                    <option value="">Select type…</option>
                    {LEAVE_TYPES.map(t => (
                      <option key={t.label}>{t.label}</option>
                    ))}
                  </select>
                  {hasDeduction && (
                    <div className="flex items-center gap-2 mt-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                      <AlertTriangle size={13} className="text-rose-500 flex-shrink-0" />
                      <span className="text-xs text-rose-700 font-medium">
                        Unpaid leave will result in salary deduction for each working day absent.
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">From Date</label>
                    <input
                      className="input"
                      type="date"
                      value={form.from}
                      onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">To Date</label>
                    <input
                      className="input"
                      type="date"
                      value={form.to}
                      onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Late submission warning */}
                {isLate && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Late Submission Warning</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Your leave starts {daysNotice <= 0 ? 'today or has already passed' : `in ${daysNotice} day${daysNotice === 1 ? '' : 's'}`}.
                        School policy requires at least 2 days' notice. Late applications may be rejected or marked as Loss of Pay.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Reason</label>
                  <textarea
                    className="input resize-none"
                    rows={4}
                    placeholder="Briefly explain the reason for leave…"
                    value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary btn">
                  <Send size={15} /> Submit Application
                </button>
              </form>
            )}
          </>
        )}

        {/* ── Urgent Leave ── */}
        {tab === 'urgent' && (
          <>
            {urgentSubmitted ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">Urgent Leave Submitted!</h3>
                <p className="text-slate-400 text-sm mb-2">Your urgent leave has been logged for immediate effect.</p>
                <p className="text-xs text-slate-500 mb-6">
                  Date: {currentDate} · Time: {currentTime}
                </p>
                <button
                  onClick={() => {
                    setUrgentSubmitted(false)
                    setUrgentForm({ description: '', from: '', to: '' })
                  }}
                  className="btn-primary btn"
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <div className="max-w-xl">
                {/* Urgent leave info banner */}
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
                  <Zap size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Urgent / Emergency Leave</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      This leave takes effect immediately from now. No advance notice required.
                      Please provide a clear description so the administration can process it quickly.
                    </p>
                  </div>
                </div>

                {/* Auto-filled date & time */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Leave Effective From</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-lg font-bold text-slate-800">{currentDate}</p>
                      <p className="text-sm text-slate-500">at {currentTime}</p>
                    </div>
                    <span className="ml-auto px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      Effective Now
                    </span>
                  </div>
                </div>

                <form onSubmit={handleUrgentSubmit} className="space-y-5">
                  {/* From / To Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">From Date</label>
                      <input
                        className="input"
                        type="date"
                        value={urgentForm.from}
                        onChange={e => setUrgentForm(f => ({ ...f, from: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">To Date</label>
                      <input
                        className="input"
                        type="date"
                        value={urgentForm.to}
                        onChange={e => setUrgentForm(f => ({ ...f, to: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="label">Description / Reason</label>
                    <textarea
                      className="input resize-none"
                      rows={5}
                      placeholder="Explain the reason for your urgent leave (e.g., medical emergency, family emergency, personal crisis)…"
                      value={urgentForm.description}
                      onChange={e => setUrgentForm(f => ({ ...f, description: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Minimum 10 characters. Be as descriptive as possible.
                    </p>
                  </div>

                  {/* Salary warning */}
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                    <span className="text-xs text-amber-700 font-medium">
                      Urgent leaves may be subject to salary deduction at the discretion of the administration.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={urgentForm.description.trim().length < 10}
                    className="btn-primary btn gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap size={15} /> Submit Urgent Leave
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}