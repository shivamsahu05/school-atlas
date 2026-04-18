import { useState } from 'react'
<<<<<<< HEAD
import { Plus, ChevronDown, ChevronUp, Users, CheckCircle, AlertTriangle, Filter } from 'lucide-react'
import { StatCard, SectionHeader, Modal, ProgressBar, StatusBadge } from '../../components/ui/index.jsx'
import { HOMEWORK, PERMISSIONS } from '../../data/dummyData'
import clsx from 'clsx'

function pct(submitted, total) { return Math.round((submitted / total) * 100) }

// Week label helper: group by assigned date (simplified to week buckets)
const WEEK_OPTIONS = ['All', 'Jan W1 (Jan 1–7)', 'Jan W2 (Jan 8–14)', 'Jan W3 (Jan 15–21)', 'Jan W4 (Jan 22–28)', 'Feb W1 (Jan 29+)']
function getWeek(hw) {
  const d = hw.assigned || ''
  if (d.includes('Jan 8') || d.includes('Jan 11')) return 'Jan W2 (Jan 8–14)'
  if (d.includes('Jan 15') || d.includes('Jan 17')) return 'Jan W3 (Jan 15–21)'
  if (d.includes('Jan 22') || d.includes('Jan 24')) return 'Jan W4 (Jan 22–28)'
  if (d.includes('Jan 26') || d.includes('Jan 29')) return 'Feb W1 (Jan 29+)'
  return 'Jan W1 (Jan 1–7)'
}

function hasUploadPermission() {
  return PERMISSIONS.some(p => p.action === 'Homework Entry' && p.daysLeft > 0)
}

export default function TeacherHomework() {
  const [expanded,   setExpanded]   = useState(null)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [form,       setForm]       = useState({ desc:'', due:'', subject:'Mathematics', class:'Grade 8-A' })
  const [filterWeek, setFilterWeek] = useState('All')
  const [filterCls,  setFilterCls]  = useState('All')
  const [filterSub,  setFilterSub]  = useState('All')

  const canUpload = hasUploadPermission()

  const homeworkList = HOMEWORK ?? []
  const classes  = ['All', ...new Set(homeworkList.map(h => h?.class ?? '-'))]
  const subjects = ['All', ...new Set(homeworkList.map(h => h?.subject ?? '-'))]

  const filtered = homeworkList.filter(hw => {
    const matchWeek = filterWeek === 'All' || getWeek(hw) === filterWeek
    const matchCls  = filterCls  === 'All' || hw?.class   === filterCls
    const matchSub  = filterSub  === 'All' || hw?.subject === filterSub
    return matchWeek && matchCls && matchSub
  })

  const totalAssigned  = filtered.reduce((a,h) => a + (h?.total ?? 0), 0)
  const totalSubmitted = filtered.reduce((a,h) => a + (h?.submitted ?? 0), 0)
  const avgPct = totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0

  const toggle = (id) => setExpanded(e => e === id ? null : id)

  const SELECT = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Permission warning */}
      {!canUpload && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
          <span className="text-sm text-amber-700">Homework entry permission expired or not granted — contact admin.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assignments"   value={filtered.length} icon={CheckCircle} color="blue" />
        <StatCard title="Avg Submission" value={`${avgPct}%`}  icon={Users}       color="green" trend={avgPct} />
        <StatCard title="Total Defaulters"
          value={filtered.reduce((a,h) => a + h.defaulters.length, 0)}
          icon={AlertTriangle} color="amber" />
        <StatCard title="Perfect Submit" value={filtered.filter(h=>h.defaulters.length===0).length}
=======
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
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
          icon={CheckCircle} color="teal" />
      </div>

      {/* Homework cards */}
      <div className="card p-6">
<<<<<<< HEAD
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <SectionHeader title="Homework Records" subtitle={`${filtered.length} assignments`} />
          <button
            onClick={() => canUpload && setModalOpen(true)}
            disabled={!canUpload}
            className="btn-primary btn btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canUpload ? 'Upload permission required' : ''}
          >
=======
        <div className="flex items-center justify-between mb-5">
          <SectionHeader title="Homework Records" subtitle="Latest 5 assignments" />
          <button onClick={() => setModalOpen(true)} className="btn-primary btn btn-sm">
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            <Plus size={14}/> Add
          </button>
        </div>

<<<<<<< HEAD
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Filter size={14} className="text-slate-400 self-center" />
          <select value={filterWeek} onChange={e => setFilterWeek(e.target.value)} className={SELECT}>
            {WEEK_OPTIONS.map(w => <option key={w}>{w}</option>)}
          </select>
          <select value={filterCls}  onChange={e => setFilterCls(e.target.value)}  className={SELECT}>
            {classes.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterSub}  onChange={e => setFilterSub(e.target.value)}  className={SELECT}>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
          <span className="text-xs text-slate-400 self-center">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No homework matches the selected filters.</p>
          ) : filtered.map(hw => {
=======
        <div className="space-y-3">
          {HOMEWORK.map(hw => {
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            const p = pct(hw.submitted, hw.total)
            const isOpen = expanded === hw.id
            const barColor = p >= 90 ? 'green' : p >= 70 ? 'amber' : 'red'

            return (
              <div key={hw.id} className="border border-slate-100 rounded-xl overflow-hidden">
<<<<<<< HEAD
=======
                {/* Header row */}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
                <button
                  onClick={() => toggle(hw.id)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{hw.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Assigned: {hw.assigned} &nbsp;·&nbsp; Due: {hw.due} &nbsp;·&nbsp; {hw.class}
                    </p>
<<<<<<< HEAD
                    <p className="text-[10px] text-slate-300 mt-0.5">Week: {getWeek(hw)}</p>
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
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

<<<<<<< HEAD
=======
                {/* Expanded defaulters */}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
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
<<<<<<< HEAD
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Subject</label>
              <input className="input bg-slate-50 text-slate-500 cursor-not-allowed" value={form.subject} readOnly />
            </div>
            <div>
              <label className="label">Class</label>
              <input className="input bg-slate-50 text-slate-500 cursor-not-allowed" value={form.class} readOnly />
=======
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Subject</label>
              <input className="input" value={form.subject} readOnly className="input bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="label">Class</label>
              <input className="input" value={form.class} readOnly className="input bg-slate-50 text-slate-500 cursor-not-allowed" />
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
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
