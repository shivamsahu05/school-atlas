import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Send } from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge, Tabs, Modal } from '../../components/ui/index.jsx'
import { LEAVES } from '../../data/dummyData'

const MY_LEAVES = LEAVES.filter(l => l.teacher === 'Priya Sharma')

const TABS = [
  { value:'history', label:'My Leaves' },
  { value:'apply',   label:'Apply Leave' },
]

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Half Day']

export default function TeacherLeave() {
  const [tab, setTab] = useState('history')
  const [form, setForm] = useState({ type:'', from:'', to:'', reason:'' })
  const [submitted, setSubmitted] = useState(false)

  const approved = MY_LEAVES.filter(l => l.status === 'Approved').length
  const pending  = MY_LEAVES.filter(l => l.status === 'Pending').length
  const rejected = MY_LEAVES.filter(l => l.status === 'Rejected').length

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Approved" value={approved} icon={CheckCircle} color="green" />
        <StatCard title="Pending"  value={pending}  icon={Clock}       color="amber" />
        <StatCard title="Rejected" value={rejected} icon={XCircle}     color="red"   />
      </div>

      {/* Tabs */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <SectionHeader title="Leave Management" subtitle="Apply & track your requests" />
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div className="space-y-3">
            {MY_LEAVES.map(leave => (
              <div key={leave.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{leave.type} Leave</p>
                    <p className="text-xs text-slate-400 mt-0.5">{leave.from} – {leave.to}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm">{leave.reason}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Applied on: {leave.applied}</p>
                  </div>
                  <StatusBadge status={leave.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* APPLY TAB */}
        {tab === 'apply' && (
          <>
            {submitted ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">Leave Applied Successfully!</h3>
                <p className="text-slate-400 text-sm mb-6">Your application is pending approval.</p>
                <button onClick={() => { setSubmitted(false); setForm({ type:'', from:'', to:'', reason:'' }) }}
                  className="btn-primary btn">
                  Apply Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
                <div>
                  <label className="label">Leave Type</label>
                  <select className="select" value={form.type}
                    onChange={e => setForm(f=>({...f,type:e.target.value}))} required>
                    <option value="">Select type…</option>
                    {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">From Date</label>
                    <input className="input" type="date" value={form.from}
                      onChange={e => setForm(f=>({...f,from:e.target.value}))} required />
                  </div>
                  <div>
                    <label className="label">To Date</label>
                    <input className="input" type="date" value={form.to}
                      onChange={e => setForm(f=>({...f,to:e.target.value}))} required />
                  </div>
                </div>

                <div>
                  <label className="label">Reason</label>
                  <textarea className="input resize-none" rows={4}
                    placeholder="Briefly explain the reason for leave…"
                    value={form.reason}
                    onChange={e => setForm(f=>({...f,reason:e.target.value}))} required />
                </div>

                <button type="submit" className="btn-primary btn">
                  <Send size={15}/> Submit Application
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
