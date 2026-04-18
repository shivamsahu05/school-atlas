import { useEffect, useState, useMemo } from 'react'
import { CheckCircle, Award, RotateCcw, FileText } from 'lucide-react'
import { SectionHeader, DataTable } from '../../components/ui/index.jsx'
import { LODonut } from '../../components/charts/index.jsx'
import { teacherLoApi, teacherApi, classesApi } from '../../services/schoolApi'
import * as XLSX from 'xlsx'
import clsx from 'clsx'

const BASE_CLASSES = ['6', '7', '8', '9', '10']
const SECTIONS_MAP = { '6': ['A','B'], '7': ['A','B'], '8': ['A','B','C'], '9': ['A','B'], '10': ['A'] }
const SUBJECTS     = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies']
const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEK_OPTIONS = ['Week 1 (1–7)', 'Week 2 (8–14)', 'Week 3 (15–21)', 'Week 4 (22–28)', 'Week 5 (29–31)']
const TOPICS       = ['Linear Equations', 'Quadratic Equations', 'Triangles & Properties', 'Mensuration', 'Data Handling']

const SELECT = 'border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300 w-full'
const LABEL  = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5'

export default function AdminAwardLO() {
  const [entries, setEntries] = useState([])
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [lastEntry, setLastEntry] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    class_id: '', subject_id: '', teacher_id: '',
    month: 'April', week: 'Week 1 (1–7)', topic: '', lo: 'Meeting', score: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [entriesRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
        teacherLoApi.get(),
        teacherApi.getAll(),
        classesApi.getAll(),
        classesApi.getSubjects()
      ])
      setEntries(entriesRes.data.items || [])
      setTeachers(teachersRes.data.items || [])
      setClasses(classesRes.data.items || [])
      setSubjects(subjectsRes.data.items || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async () => {
    setError('')
    const { class_id, subject_id, teacher_id, month, week, topic, lo, score } = form
    if (!class_id || !subject_id || !teacher_id || !month || !week || !topic || !lo || score === '') {
      setError('Please fill in all fields before submitting.')
      return
    }

    try {
      const res = await teacherLoApi.awardAdmin({
        ...form,
        status: lo,
        score: Number(score)
      })
      setLastEntry(res.data)
      setSubmitted(true)
      fetchData()
    } catch (err) {
      setError('Failed to award score. Please try again.')
    }
  }

  const reset = () => {
    setSubmitted(false)
    setLastEntry(null)
    setError('')
    setForm({ class_id: '', subject_id: '', teacher_id: '', month: 'April', week: 'Week 1 (1–7)', topic: '', lo: 'Meeting', score: '' })
  }

  const handleExportExcel = () => {
    const data = entries.map(e => ({
      'ID': e.id,
      'Teacher': e.teacher?.name,
      'Class': `${e.class?.class_name}-${e.class?.section}`,
      'Subject': e.subject?.name,
      'Month': e.month,
      'Week': e.week,
      'Topic': e.topic,
      'Learning Outcome': e.status,
      'Principal Score': e.principal_score,
      'Teacher Score': e.teacher_score
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Learning Outcomes')
    XLSX.writeFile(wb, `Learning_Outcomes_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Monitoring table aggregation
  const monitoringRows = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      const key = e.teacher?.name || 'Unknown'
      if (!map[key]) map[key] = { teacher: key, pScores: [], tScores: [], approaching: 0, meeting: 0, exceeding: 0 }
      if (e.principal_score != null) map[key].pScores.push(Number(e.principal_score))
      if (e.teacher_score   != null) map[key].tScores.push(Number(e.teacher_score))
      const st = (e.status || '').toLowerCase()
      if      (st === 'approaching') map[key].approaching++
      else if (st === 'meeting')     map[key].meeting++
      else if (st === 'exceeding')   map[key].exceeding++
    })
    return Object.values(map).map(r => ({
      teacher:      r.teacher,
      avgPrincipal: r.pScores.length ? Math.round(r.pScores.reduce((a,b)=>a+b,0)/r.pScores.length) : 0,
      avgTeacher:   r.tScores.length ? Math.round(r.tScores.reduce((a,b)=>a+b,0)/r.tScores.length) : 0,
      approaching:  r.approaching,
      meeting:      r.meeting,
      exceeding:    r.exceeding,
    }))
  }, [entries])

  const monitoringColumns = [
    { key: 'teacher',      label: 'Teacher',              sortable: true },
    { key: 'avgPrincipal', label: 'Avg LO by Principal',  sortable: true,
      render: v => <span className="font-bold text-brand-600">{v}</span> },
    { key: 'avgTeacher',   label: 'Avg LO by Teacher',    sortable: true,
      render: v => <span className="font-bold text-slate-600">{v}</span> },
    { key: 'approaching',  label: 'Approaching',          sortable: true,
      render: v => <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{v}</span> },
    { key: 'meeting',      label: 'Meeting',              sortable: true,
      render: v => <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">{v}</span> },
    { key: 'exceeding',    label: 'Exceeding',            sortable: true,
      render: v => <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{v}</span> },
  ]

  // ── Success Screen ───────────────────────────────────────────
  if (submitted && lastEntry) {
    const counts = {
      approaching: entries.filter(e => (e.status||'').toLowerCase() === 'approaching').length,
      meeting:     entries.filter(e => (e.status||'').toLowerCase() === 'meeting').length,
      exceeding:   entries.filter(e => (e.status||'').toLowerCase() === 'exceeding').length,
    }

    return (
      <div className="animate-fade-in space-y-6">
        <div className="card p-8 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h2 className="font-display text-2xl text-slate-800 mb-1">LO Score Awarded!</h2>
          <p className="text-slate-400 text-sm mb-1">
            <span className="font-semibold text-slate-600">{lastEntry.teacher}</span>
          </p>
          <p className="text-slate-400 text-sm mb-6">
            {lastEntry.class} · {lastEntry.subject} · {lastEntry.topic}
          </p>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {[
              [lastEntry.score, 'Score',    'brand'],
              [lastEntry.lo,    'Outcome',  lastEntry.lo === 'Exceeding' ? 'green' : lastEntry.lo === 'Meeting' ? 'blue' : 'amber'],
              [lastEntry.month, 'Month',    'slate'],
            ].map(([v, l, c]) => (
              <div key={l} className={clsx(
                'rounded-xl p-3 text-center',
                c === 'green' ? 'bg-emerald-50' : c === 'blue' ? 'bg-blue-50' : c === 'amber' ? 'bg-amber-50' : c === 'brand' ? 'bg-brand-50' : 'bg-slate-50'
              )}>
                <p className={clsx(
                  'text-lg font-bold truncate',
                  c === 'green' ? 'text-emerald-600' : c === 'blue' ? 'text-blue-600' : c === 'amber' ? 'text-amber-600' : c === 'brand' ? 'text-brand-600' : 'text-slate-600'
                )}>{v}</p>
                <p className="text-xs text-slate-400 mt-0.5">{l}</p>
              </div>
            ))}
          </div>

          <div className="w-full mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Overall Distribution</p>
            <LODonut {...counts} height={180} />
          </div>

          <button onClick={reset} className="btn-primary btn w-full justify-center gap-2">
            <RotateCcw size={15} /> Award Another
          </button>
        </div>

        {/* Monitoring table after submit */}
        <div className="card p-6">
          <SectionHeader
            title="Teacher Learning Outcome Monitoring"
            subtitle="Aggregated LO scores across all entries"
            action="Download Excel"
            onAction={handleExportExcel}
          />
          <div className="mt-4">
            <DataTable columns={monitoringColumns} rows={monitoringRows} />
          </div>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Entry Form */}
      <div className="card p-6 max-w-2xl">
        <SectionHeader
          title="Learning Outcome Entry"
          subtitle="Award LO scores to teachers based on class performance"
        />

        <div className="mt-6 space-y-5">

          {/* Row 1: Class · Section · Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Class</label>
              <select value={form.class_id} onChange={e => set('class_id', e.target.value)} className={SELECT}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}-{c.section}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Subject</label>
              <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)} className={SELECT}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Teacher */}
          <div>
            <label className={LABEL}>Teacher</label>
            <select value={form.teacher_id} onChange={e => set('teacher_id', e.target.value)} className={SELECT}>
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Row 3: Month · Week */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Month</label>
              <select value={form.month} onChange={e => { set('month', e.target.value); set('week', '') }} className={SELECT}>
                <option value="">Select Month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Week</label>
              <select value={form.week} onChange={e => set('week', e.target.value)} className={SELECT} disabled={!form.month}>
                <option value="">Select Week</option>
                {WEEK_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          {/* Row 4: Topic */}
          <div>
            <label className={LABEL}>Topic</label>
            <input
              placeholder="e.g. Linear Equations"
              value={form.topic}
              onChange={e => set('topic', e.target.value)}
              className={SELECT}
            />
          </div>

          {/* Row 5: Learning Outcome */}
          <div>
            <label className={LABEL}>Learning Outcome</label>
            <div className="flex gap-3">
              {['Approaching', 'Meeting', 'Exceeding'].map(opt => (
                <button
                  key={opt}
                  onClick={() => set('lo', opt)}
                  className={clsx(
                    'flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all',
                    form.lo === opt
                      ? opt === 'Approaching' ? 'bg-amber-50 border-amber-400 text-amber-700'
                        : opt === 'Meeting'   ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Row 6: Score */}
          <div>
            <label className={LABEL}>Score <span className="normal-case text-slate-300">(0–100)</span></label>
            <input
              type="number" min="0" max="100" step="1"
              placeholder="e.g. 85"
              value={form.score}
              onChange={e => {
                const v = e.target.value
                if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) set('score', v)
              }}
              className="border border-slate-200 rounded-lg px-4 py-2 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300 w-40"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="btn-primary btn w-full justify-center gap-2 py-3 mt-2"
          >
            <Award size={16} /> Submit LO Score
          </button>

        </div>
      </div>

      {/* Monitoring Table */}
      <div className="card p-6">
        <SectionHeader
          title="Teacher Learning Outcome Monitoring"
          subtitle="Aggregated LO scores across all entries"
          action="Download Excel"
          onAction={handleExportExcel}
        />
        <div className="mt-4">
          <DataTable columns={monitoringColumns} rows={monitoringRows} />
        </div>
      </div>

    </div>
  )
}