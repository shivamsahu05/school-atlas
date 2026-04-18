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

export default function AdminObservation() {
  const [obsList, setObsList] = useState(INIT_OBS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ classPrefix: '', section: '', subject: '', teacherId: '', teacherName: '', criteria: {} })
  const [saved, setSaved] = useState(false)

  const [listFilters, setListFilters] = useState({ classPrefix: 'All', section: 'All', subject: 'All' })

  const CRITERIA = OBSERVATION_CRITERIA

  const classOptions = useMemo(() => {
    const grades = new Set()
    ALL_CLASSES.forEach(c => {
      if (c === 'All') return
      grades.add(c.split('-')[0].trim())
    })
    return Array.from(grades).sort()
  }, [])

  const sectionOptions = useMemo(() => {
    const sections = new Set()
    ALL_CLASSES.forEach(c => {
      if (c === 'All') return
      if (c.includes('-')) sections.add(c.split('-')[1].trim())
    })
    return Array.from(sections).sort()
  }, [])

  const filteredObsList = useMemo(() => {
    return obsList.filter(obs => {
      const teacherInfo = INIT_TEACHERS.find(t => t.name === obs.teacher)
      if (!teacherInfo) return true;
      if (listFilters.classPrefix !== 'All' && !teacherInfo.classAssigned.startsWith(listFilters.classPrefix)) return false;
      if (listFilters.section !== 'All' && !teacherInfo.classAssigned.endsWith(`-${listFilters.section}`)) return false;
      if (listFilters.subject !== 'All' && teacherInfo.subject !== listFilters.subject) return false;
      return true;
    })
  }, [obsList, listFilters])

  useEffect(() => {
    if (form.classPrefix && form.section && form.subject) {
      const classStr = `${form.classPrefix}-${form.section}`;
      const found = INIT_TEACHERS.find(t => t.classAssigned === classStr && t.subject === form.subject);
      if (found) {
        setForm(f => ({ ...f, teacherId: found.id, teacherName: found.name }));
      } else {
        setForm(f => ({ ...f, teacherId: '', teacherName: '' }));
      }
    } else {
      setForm(f => ({ ...f, teacherId: '', teacherName: '' }));
    }
  }, [form.classPrefix, form.section, form.subject]);

  const handleSave = () => {
    if (!form.teacherId || !form.teacherName) {
      alert('Please select a valid class, section, and subject that has an assigned teacher.');
      return;
    }
    const scores = Object.values(form.criteria).map(v => parseFloat(v) || 0)
    const total = scores.reduce((a, b) => a + b, 0)
    const newObs = {
      id: Date.now(),
      teacher: form.teacherName,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      observedBy: 'Principal',
      score: total,
      max: CRITERIA.length * 10,
      criteria: CRITERIA.map(c => ({ name: c, score: parseFloat(form.criteria[c]) || 0 }))
    }
    setObsList(prev => [newObs, ...prev])
    setSaved(true)
    setShowForm(false)
    setForm({ classPrefix: '', section: '', subject: '', teacherId: '', teacherName: '', criteria: {} })
  }

  const chartData = [...obsList].slice(0, 5).map(o => ({
    name: o.teacher.split(' ')[0],
    pct: Math.round((o.score / o.max) * 100)
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => { setShowForm(v => !v); setSaved(false) }} className="btn-primary btn">
          {showForm ? <><Eye size={14} /> View Records</> : <><Plus size={14} /> New Observation</>}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm animate-slide-up">
          <CheckCircle size={18} /> Observation saved successfully!
        </div>
      )}

      {!showForm ? (
        <>
          <div className="card p-6">
            <SectionHeader title="Observation Scores" subtitle="Recent comparisons" />
            <BarChartWidget data={chartData} dataKey="pct" xKey="name" color="#0d9488" height={200} name="Score %" />
          </div>

          <div className="card p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <SectionHeader title="Observation Records" subtitle="Detailed breakdown of feedback" />
              <div className="flex flex-wrap items-center gap-2">
                <select className="input py-2 px-3 text-xs bg-slate-50 font-semibold text-slate-600 rounded-lg border-slate-200 w-auto min-w-[120px]" value={listFilters.classPrefix} onChange={e => setListFilters(f => ({ ...f, classPrefix: e.target.value }))}>
                  <option value="All">All Classes</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="input py-2 px-3 text-xs bg-slate-50 font-semibold text-slate-600 rounded-lg border-slate-200 w-auto min-w-[120px]" value={listFilters.section} onChange={e => setListFilters(f => ({ ...f, section: e.target.value }))}>
                  <option value="All">All Sections</option>
                  {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="input py-2 px-3 text-xs bg-slate-50 font-semibold text-slate-600 rounded-lg border-slate-200 w-auto min-w-[120px]" value={listFilters.subject} onChange={e => setListFilters(f => ({ ...f, subject: e.target.value }))}>
                  <option value="All">All Subjects</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            
            <div className="space-y-6">
              {filteredObsList.length > 0 ? filteredObsList.map(obs => {
                const p = Math.round((obs.score / obs.max) * 100)
                const colorClass = p >= 80 ? 'text-brand-600' : p >= 60 ? 'text-amber-600' : 'text-rose-600';
                const barColor = p >= 80 ? 'bg-emerald-400' : p >= 60 ? 'bg-amber-400' : 'bg-rose-400';
                
                return (
                  <div key={obs.id} className="border border-slate-100 rounded-xl p-5 bg-white mb-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50/80">
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{obs.teacher}</h4>
                        <div className="flex gap-2 items-center mt-1 text-slate-400 text-xs font-semibold">
                          <span>{obs.date}</span>
                          <span>•</span>
                          <span>Observed by: {obs.observedBy}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${colorClass}`}>{p}%</p>
                        <p className="text-xs text-slate-400 font-semibold">{obs.score}/{obs.max}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3.5">
                      {obs.criteria && obs.criteria.map((c, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <span className="text-[13px] font-medium text-slate-500 w-40 truncate">{c.name}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full`} style={{ width: `${(c.score / 10) * 100}%` }} />
                          </div>
                          <span className="text-[13px] font-bold text-slate-700 w-8 text-right shrink-0">{c.score}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }) : (
                <div className="py-8 text-center text-slate-400 text-sm bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">No observation records found for the selected filters.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="card p-6 max-w-xl animate-fade-in">
          <SectionHeader title="New Observation Form" subtitle="Score each criterion out of 10" />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="label">Class</label>
                <select className="input bg-slate-50 border-slate-200" value={form.classPrefix} onChange={e => setForm(f => ({ ...f, classPrefix: e.target.value }))}>
                  <option value="">Select</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Section</label>
                <select className="input bg-slate-50 border-slate-200" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}>
                  <option value="">Select</option>
                  {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject</label>
                <select className="input bg-slate-50 border-slate-200" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                  <option value="">Select</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assigned Teacher</label>
                <input className={clsx("input cursor-not-allowed font-semibold w-full", form.teacherName ? "bg-brand-50 text-brand-700 border-brand-200" : "bg-slate-50 text-slate-400")} readOnly placeholder="No mapping found" value={form.teacherName ? `${form.teacherName} (${form.teacherId})` : ''} />
              </div>
            </div>
            {CRITERIA.map(c => (
              <div key={c} className="flex items-center gap-4">
                <label className="text-sm text-slate-700 flex-1 font-medium">{c}</label>
                <input type="number" min="0" max="10" step="0.5"
                  placeholder="–"
                  value={form.criteria[c] ?? ''}
                  onChange={e => setForm(f => ({ ...f, criteria: { ...f.criteria, [c]: e.target.value } }))}
                  className="w-20 text-center input py-2" />
                <span className="text-xs text-slate-400 w-5">/10</span>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="btn-primary btn flex-1 justify-center">
                <Save size={14} /> Save Observation
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary btn px-4">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}