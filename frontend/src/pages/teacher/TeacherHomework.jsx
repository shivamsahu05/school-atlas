import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronDown, ChevronUp, Users, CheckCircle, AlertTriangle, Filter, Loader2, Download } from 'lucide-react'
import { StatCard, SectionHeader, Modal, ProgressBar, StatusBadge } from '../../components/ui/index.jsx'
import { homeworkApi, classesApi, permissionsApi } from '../../api'
import { clsx } from 'clsx'

function pct(submitted, total) { return total > 0 ? Math.round((submitted / total) * 100) : 0 }

function downloadCSV(hw) {
  const rows = hw.map(h => `"${h.description}","${h.class_name}-${h.section}","${h.subject}","${h.assigned_date || ''}","${h.due_date || ''}","${pct(h._count?.submissions || 0, h.totalStudents || 0)}%"`)
  const blob = new Blob(['Description,Class,Subject,Assigned,Due,Submission%\n' + rows.join('\n')], { type: 'text/csv' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'homework.csv' })
  a.click()
}

export default function TeacherHomework() {
  const [homework,   setHomework]   = useState([])
  const [classes,    setClasses]    = useState([])
  const [subjects,   setSubjects]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [expanded,   setExpanded]   = useState(null)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [canUpload,  setCanUpload]  = useState(true)

  // Filters
  const [filterClass,   setFilterClass]   = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterStatus,  setFilterStatus]  = useState('')

  // Form
  const [form, setForm] = useState({ description:'', class_id:'', subject_id:'', assigned_date:'', due_date:'' })

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [hwRes, clsRes] = await Promise.all([
        homeworkApi.getAll({
          class_id:   filterClass   || undefined,
          subject_id: filterSubject || undefined,
        }),
        classesApi.getAll(),
      ])

      const hwArr = Array.isArray(hwRes.data) ? hwRes.data : (hwRes.data?.items || hwRes.items || [])
      setHomework(hwArr)
      const cls = Array.isArray(clsRes.data) ? clsRes.data : (clsRes.data?.items || clsRes.classes || [])
      setClasses(cls)

      // Extract subjects from homework data
      const subs = [...new Map(hwArr.map(h => [h.subject?.id, h.subject])).values()]
        .filter(Boolean)
      setSubjects(subs)

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load homework.')
    } finally {
      setLoading(false)
    }
  }, [filterClass, filterSubject])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.description || !form.class_id || !form.subject_id) {
      alert('Please fill in all required fields.')
      return
    }
    try {
      setSubmitting(true)
      await homeworkApi.create(form)
      setModalOpen(false)
      setForm({ description:'', class_id:'', subject_id:'', assigned_date:'', due_date:'' })
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create homework.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalAssigned  = homework.reduce((a, h) => a + (h._count?.submissions || 0), 0)
  const totalStudents  = homework.reduce((a, h) => a + (h.totalStudents || 42), 0)
  const avgPct         = totalStudents > 0 ? Math.round((totalAssigned / totalStudents) * 100) : 0
  const totalDefaulters = homework.reduce((a, h) => {
    const sub = h._count?.submissions || 0
    const tot = h.totalStudents || 42
    return a + Math.max(0, tot - sub)
  }, 0)

  const SELECT = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>

  if (error) return (
    <div className="card p-8 text-center">
      <AlertTriangle size={28} className="text-rose-500 mx-auto mb-3"/>
      <p className="text-slate-600">{error}</p>
      <button onClick={fetchAll} className="btn-primary btn mt-4">Retry</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assignments"     value={homework.length}   icon={CheckCircle}  color="blue"  />
        <StatCard title="Avg Submission"  value={`${avgPct}%`}      icon={Users}        color="green" trend={avgPct} />
        <StatCard title="Defaulters"      value={totalDefaulters}   icon={AlertTriangle} color="amber" />
        <StatCard title="Perfect Classes" value={homework.filter(h => (h._count?.submissions||0) >= (h.totalStudents||42)).length}
          icon={CheckCircle} color="teal" />
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <SectionHeader title="Homework Records" subtitle={`${homework.length} assignments`} />
          <div className="flex gap-2">
            <button onClick={() => downloadCSV(homework)} className="btn-secondary btn btn-sm gap-1.5">
              <Download size={13}/> Export
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary btn btn-sm"
            >
              <Plus size={14}/> Add
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Filter size={14} className="text-slate-400 self-center"/>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className={SELECT}>
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.class_name}-{c.section}</option>
            ))}
          </select>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className={SELECT}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <span className="text-xs text-slate-400 self-center">{homework.length} records</span>
        </div>

        {homework.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle size={40} className="mx-auto mb-3 opacity-30"/>
            <p>No homework found. Add your first assignment!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {homework.map(hw => {
              const submitted = hw._count?.submissions || 0
              const total     = hw.totalStudents || 42
              const p         = pct(submitted, total)
              const isOpen    = expanded === hw.id
              const barColor  = p >= 90 ? 'green' : p >= 70 ? 'amber' : 'red'
              const defaulters = Math.max(0, total - submitted)

              return (
                <div key={hw.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : hw.id)}
                    className="w-full flex items-start gap-4 p-4 hover:bg-slate-50/60 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{hw.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {hw.class?.class_name}-{hw.class?.section} · {hw.subject?.name}
                        {hw.due_date && ` · Due: ${hw.due_date?.slice(0,10)}`}
                      </p>
                      <div className="mt-3">
                        <ProgressBar value={submitted} max={total} color={barColor} height="h-1.5" showLabel={false}/>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={clsx('text-sm font-bold',
                        p>=90?'text-emerald-600':p>=70?'text-amber-600':'text-rose-600'
                      )}>{p}%</span>
                      {isOpen ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-600">
                          Submitted: {submitted}/{total}
                        </p>
                        {defaulters === 0
                          ? <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ All submitted</span>
                          : <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{defaulters} pending</span>
                        }
                      </div>
                      <p className="text-xs text-slate-400">Assigned: {hw.assigned_date?.slice(0,10) || '—'}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Homework Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Homework / Assignment">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label">Description <span className="text-rose-500">*</span></label>
            <input className="input" placeholder="e.g. Exercise 3.1 – Q1 to Q10"
              value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} required/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Class <span className="text-rose-500">*</span></label>
              <select className="select" value={form.class_id}
                onChange={e => setForm(f => ({...f, class_id:e.target.value}))} required>
                <option value="">Select class…</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.class_name}-{c.section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Subject <span className="text-rose-500">*</span></label>
              <select className="select" value={form.subject_id}
                onChange={e => setForm(f => ({...f, subject_id:e.target.value}))} required>
                <option value="">Select subject…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Assigned Date</label>
              <input className="input" type="date" value={form.assigned_date}
                onChange={e => setForm(f => ({...f, assigned_date:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date}
                onChange={e => setForm(f => ({...f, due_date:e.target.value}))}/>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary btn flex-1 justify-center disabled:opacity-60">
              {submitting ? <><Loader2 size={14} className="animate-spin mr-2"/>Saving…</> : 'Add Homework'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
