import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, Clock, Send, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge, Tabs } from '../../components/ui/index.jsx'
import { leaveApi } from '../../api'

const TABS = [
  { value: 'history', label: 'My Leaves'   },
  { value: 'apply',   label: 'Apply Leave' },
]

const LEAVE_TYPES = [
  { label: 'Casual Leave',  deduction: false },
  { label: 'Sick Leave',    deduction: false },
  { label: 'Earned Leave',  deduction: false },
  { label: 'Half Day',      deduction: false },
  { label: 'Unpaid Leave',  deduction: true  },
]

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date().setHours(0,0,0,0)) / 86400000)
}

export default function TeacherLeave() {
  const [tab,        setTab]        = useState('history')
  const [leaves,     setLeaves]     = useState([])
  const [summary,    setSummary]    = useState({ approved:0, pending:0, rejected:0 })
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState(null)
  const [form,       setForm]       = useState({ type:'', from_date:'', to_date:'', reason:'' })

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await leaveApi.getAll()
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || res.items || res.leaves || [])
      setLeaves(items)
      const s = res.summary || {}
      setSummary({
        approved: items.filter(l => l.status === 'Approved').length,
        pending:  items.filter(l => l.status === 'Pending').length,
        rejected: items.filter(l => l.status === 'Rejected').length,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leaves.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeaves() }, [fetchLeaves])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.type || !form.from_date || !form.to_date || !form.reason) {
      alert('Please fill all required fields.')
      return
    }
    try {
      setSubmitting(true)
      await leaveApi.create(form)
      setSubmitted(true)
      fetchLeaves()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply leave.')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedType = LEAVE_TYPES.find(t => t.label === form.type)
  const hasDeduction = selectedType?.deduction === true
  const daysNotice   = daysUntil(form.from_date)
  const isLate       = daysNotice !== null && daysNotice < 2

  const rejectedLeaves = leaves.filter(l => l.status === 'Rejected')

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>

  return (
    <div className="space-y-6 animate-fade-in">

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Approved" value={summary.approved} icon={CheckCircle} color="green" />
        <StatCard title="Pending"  value={summary.pending}  icon={Clock}       color="amber" />
        <StatCard title="Rejected" value={summary.rejected} icon={XCircle}     color="red"   />
      </div>

      {/* Salary deduction notice for rejected */}
      {rejectedLeaves.length > 0 && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <Info size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-700">Salary Deduction Notice</p>
            <p className="text-xs text-rose-600 mt-0.5">
              {rejectedLeaves.length} rejected leave{rejectedLeaves.length > 1 ? 's' : ''} may be
              processed as Loss of Pay by admin at month-end.
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
          <>
            {error && <p className="text-sm text-rose-500 mb-3">{error}</p>}
            {leaves.length === 0
              ? <p className="text-center text-slate-400 py-10">No leave requests yet.</p>
              : (
                <div className="space-y-3">
                  {leaves.map(leave => (
                    <div key={leave.id}
                      className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{leave.type} Leave</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {leave.from_date?.slice(0,10)} – {leave.to_date?.slice(0,10)}
                          </p>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm">{leave.reason}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Applied: {leave.applied_date?.slice(0,10) || leave.created_at?.slice(0,10)}
                          </p>
                          {leave.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-rose-600 font-semibold">
                              <AlertTriangle size={10}/> May affect salary — contact admin
                            </span>
                          )}
                        </div>
                        <StatusBadge status={leave.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </>
        )}

        {/* ── Apply ── */}
        {tab === 'apply' && (
          <>
            {submitted ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">Leave Applied!</h3>
                <p className="text-slate-400 text-sm mb-6">Pending admin approval.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ type:'', from_date:'', to_date:'', reason:'' }) }}
                  className="btn-primary btn"
                >
                  Apply Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">

                <div>
                  <label className="label">Leave Type *</label>
                  <select className="select" value={form.type}
                    onChange={e => setForm(f=>({...f, type:e.target.value}))} required>
                    <option value="">Select type…</option>
                    {LEAVE_TYPES.map(t => <option key={t.label}>{t.label}</option>)}
                  </select>
                  {hasDeduction && (
                    <div className="flex items-center gap-2 mt-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                      <AlertTriangle size={13} className="text-rose-500 flex-shrink-0"/>
                      <span className="text-xs text-rose-700 font-medium">
                        Unpaid leave will result in salary deduction for each working day absent.
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">From Date *</label>
                    <input className="input" type="date" value={form.from_date}
                      onChange={e => setForm(f=>({...f, from_date:e.target.value}))} required/>
                  </div>
                  <div>
                    <label className="label">To Date *</label>
                    <input className="input" type="date" value={form.to_date}
                      onChange={e => setForm(f=>({...f, to_date:e.target.value}))} required/>
                  </div>
                </div>

                {isLate && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Late Submission Warning</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Leave starts {daysNotice <= 0 ? 'today or has already passed' : `in ${daysNotice} day${daysNotice===1?'':'s'}`}.
                        School policy requires ≥2 days notice. Late applications may be rejected or marked Loss of Pay.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Reason *</label>
                  <textarea className="input resize-none" rows={4}
                    placeholder="Briefly explain the reason…"
                    value={form.reason}
                    onChange={e => setForm(f=>({...f, reason:e.target.value}))} required/>
                </div>

                <button type="submit" disabled={submitting} className="btn-primary btn disabled:opacity-60">
                  {submitting
                    ? <><Loader2 size={14} className="animate-spin mr-2"/>Submitting…</>
                    : <><Send size={15} className="mr-2"/>Submit Application</>
                  }
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
