import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Users, CheckCircle, AlertTriangle } from 'lucide-react'
import { StatCard, SectionHeader, Modal, ProgressBar, StatusBadge } from '../../components/ui/index.jsx'
import { HOMEWORK } from '../../data/dummyData'
import { clsx } from 'clsx'

function pct(submitted, total) { return Math.round((submitted / total) * 100) }

export default function TeacherHomework() {
  const [expanded, setExpanded] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ desc:'', due:'', subject:'Mathematics', class:'Grade 8-A' })

  const totalAssigned  = HOMEWORK.reduce((a,h) => a + h.total, 0)
  const totalSubmitted = HOMEWORK.reduce((a,h) => a + h.submitted, 0)
  const avgPct = Math.round((totalSubmitted / totalAssigned) * 100)

  const toggle = (id) => setExpanded(e => e === id ? null : id)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assignments"   value={HOMEWORK.length} icon={CheckCircle} color="blue" />
        <StatCard title="Avg Submission" value={`${avgPct}%`}  icon={Users}       color="green" trend={avgPct} />
        <StatCard title="Total Defaulters"
          value={HOMEWORK.reduce((a,h) => a + h.defaulters.length, 0)}
          icon={AlertTriangle} color="amber" />
        <StatCard title="Perfect Submit" value={HOMEWORK.filter(h=>h.defaulters.length===0).length}
          icon={CheckCircle} color="teal" />
      </div>

      {/* Homework cards */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader title="Homework Records" subtitle="Latest 5 assignments" />
          <button onClick={() => setModalOpen(true)} className="btn-primary btn btn-sm">
            <Plus size={14}/> Add
          </button>
        </div>

        <div className="space-y-3">
          {HOMEWORK.map(hw => {
            const p = pct(hw.submitted, hw.total)
            const isOpen = expanded === hw.id
            const barColor = p >= 90 ? 'green' : p >= 70 ? 'amber' : 'red'

            return (
              <div key={hw.id} className="border border-slate-100 rounded-xl overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => toggle(hw.id)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{hw.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Assigned: {hw.assigned} &nbsp;·&nbsp; Due: {hw.due} &nbsp;·&nbsp; {hw.class}
                    </p>
                    <div className="mt-3">
                      <ProgressBar value={hw.submitted} max={hw.total} color={barColor} height="h-1.5" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={clsx(
                      'text-sm font-bold',
                      p>=90?'text-emerald-600':p>=70?'text-amber-600':'text-rose-600'
                    )}>{p}%</span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                  </div>
                </button>

                {/* Expanded defaulters */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Submission: {hw.submitted}/{hw.total}
                        </p>
                        {hw.defaulters.length === 0
                          ? <span className="badge-green badge">All Submitted ✓</span>
                          : <span className="badge-red badge">{hw.defaulters.length} Defaulter{hw.defaulters.length>1?'s':''}</span>
                        }
                      </div>
                      {hw.defaulters.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {hw.defaulters.map(d => (
                            <span key={d} className="inline-block px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Homework Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Homework / Classwork">
        <div className="space-y-4">
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="e.g. Exercise 3.1 – Q1 to Q10"
              value={form.desc} onChange={e => setForm(f=>({...f,desc:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subject</label>
              <input className="input" value={form.subject} readOnly className="input bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="label">Class</label>
              <input className="input" value={form.class} readOnly className="input bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="text" placeholder="e.g. Mon, Feb 5"
              value={form.due} onChange={e => setForm(f=>({...f,due:e.target.value}))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-primary btn flex-1 justify-center">
              Add Homework
            </button>
            <button onClick={() => setModalOpen(false)} className="btn-secondary btn px-4">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
