import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Bell, BookOpen, AlertTriangle, CheckCircle, AlertCircle, Eye, Plus, Send, Trash2,
  Edit2, Save, XCircle, Download, Calendar, IndianRupee, MessageCircle, Clock, BarChart2,
  ChevronDown, GraduationCap, LayoutGrid, Users, RotateCcw, Search, ChevronRight,
  ChevronLeft, List, Zap, UserPlus, Loader2
} from 'lucide-react'
import {
  StatCard, SectionHeader, Tabs, StatusBadge, ProgressBar,
  Modal, FilterChips, DataTable, FormInput, SelectDropdown
} from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { observationApi, teacherApi, classesApi, academicApi } from '../../services/schoolApi'
import { OBSERVATION_CRITERIA } from '../../data/constants'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminObservation() {
  const [obsList, setObsList] = useState([])
  const [loading, setLoading] = useState(false)
  const [dbClasses, setDbClasses] = useState([])
  const [dbSubjects, setDbSubjects] = useState([])
  const [dbTeachers, setDbTeachers] = useState([])
  const [dbSections, setDbSections] = useState([])
  const [dbClassSubjects, setDbClassSubjects] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [fetchingSections, setFetchingSections] = useState(false)
  const [fetchingSubjects, setFetchingSubjects] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ 
    classId: '', 
    sectionId: '', 
    subjectId: '', 
    teacherId: '', 
    teacherName: '', 
    criteria: {} 
  })
  const [saved, setSaved] = useState(false)

  const [listFilters, setListFilters] = useState({ classPrefix: 'All', section: 'All', subject: 'All' })

  const CRITERIA = OBSERVATION_CRITERIA

  const classOptions = useMemo(() => {
    return dbClasses.map(c => ({ value: c.id, label: c.name || c.class_name }))
  }, [dbClasses])

  const sectionOptions = useMemo(() => {
    return dbSections.map(s => ({ value: s.section_id, label: `Section ${s.section_name}` }))
  }, [dbSections])

  const subjectOptions = useMemo(() => {
    return dbClassSubjects.map(s => ({ value: s.subject_id, label: s.subject_name }))
  }, [dbClassSubjects])

  const teacherOptions = useMemo(() => {
    return dbTeachers.map(t => ({ value: t.id, label: t.name }))
  }, [dbTeachers])

  const [searchParams] = useSearchParams()
  const preSelectedId = searchParams.get('teacherId')

  const itemsCount = obsList.length

  const fetchData = async () => {
    setLoading(itemsCount === 0)
    setDataLoading(true)
    
    // Fetch data independently to prevent cascading failures
    try {
      const [obsRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        observationApi.getAll(),
        classesApi.getAll(),
        classesApi.getSubjects(),
        teacherApi.getAll({ limit: 1000 }) // Fetch all teachers for robust mapping
      ])

      const obs = obsRes.data?.data?.items || obsRes.data?.items || obsRes.data || []
      setObsList(obs)

      const cls = classesRes.data?.classes || classesRes.data?.data || classesRes.data || []
      setDbClasses(cls)

      const sub = subjectsRes.data?.subjects || subjectsRes.data?.data || subjectsRes.data || []
      setDbSubjects(sub)

      const tch = teachersRes.data?.teachers || teachersRes.data?.data?.items || teachersRes.data || []
      setDbTeachers(tch)
      
      // If pre-selected teacher, open form and set teacher
      if (preSelectedId) {
        const found = tch.find(t => String(t.id) === String(preSelectedId))
        if (found) {
          setShowForm(true)
          setForm(f => ({ ...f, teacherId: found.id, teacherName: found.name }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
      toast.error('Failed to load observation records')
    } finally {
      setLoading(false)
      setDataLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredObsList = useMemo(() => {
    return obsList.filter(obs => {
      const teacher = obs.teacher
      if (!teacher) return true
      
      if (listFilters.subject !== 'All' && teacher.subject !== listFilters.subject) return false
      
      if (listFilters.classPrefix !== 'All') {
        const hasClass = teacher.assignedClasses?.some(c => c.includes(`${listFilters.classPrefix}-`))
        if (!hasClass) return false
      }
      
      if (listFilters.section !== 'All') {
        const hasSection = teacher.assignedClasses?.some(c => c.includes(`-${listFilters.section}`))
        if (!hasSection) return false
      }
      
      return true
    })
  }, [obsList, listFilters])

  // 1. CLASS -> SECTIONS
  useEffect(() => {
    let isMounted = true;
    const fetchSections = async () => {
      if (form.classId) {
        try {
          setFetchingSections(true)
          setDbSections([])
          setForm(f => ({ ...f, sectionId: '', subjectId: '', teacherId: '', teacherName: '' }))
          
          const res = await academicApi.getClassSections(form.classId)
          if (isMounted) setDbSections(res.data?.data || [])
        } catch (err) {
          if (isMounted) console.error('Failed to fetch sections:', err)
        } finally {
          if (isMounted) setFetchingSections(false)
        }
      }
    }
    fetchSections()
    return () => { isMounted = false; };
  }, [form.classId])

  // 2. CLASS + SECTION -> SUBJECTS
  useEffect(() => {
    let isMounted = true;
    const fetchSubjects = async () => {
      if (form.classId) {
        try {
          setFetchingSubjects(true)
          setDbClassSubjects([])
          setForm(f => ({ ...f, subjectId: '', teacherId: '', teacherName: '' }))

          const res = await academicApi.getClassSubjects(form.classId, { section_id: form.sectionId })
          if (isMounted) setDbClassSubjects(res.data?.data || [])
        } catch (err) {
          if (isMounted) {
            console.error('Failed to fetch subjects:', err)
            setDbClassSubjects([])
            toast.error('Subjects not available')
          }
        } finally {
          if (isMounted) setFetchingSubjects(false)
        }
      }
    }
    fetchSubjects()
    return () => { isMounted = false; };
  }, [form.classId, form.sectionId])

  const handleSave = async () => {
    if (!form.teacherId || !form.teacherName) {
      toast.error('Please select a valid class, section, and subject that has an assigned teacher.')
      return
    }
    const scores = Object.values(form.criteria).map(v => parseFloat(v) || 0)
    const total = scores.reduce((a, b) => a + b, 0)
    const max = CRITERIA.length * 10
    
    const criteria_scores = CRITERIA.map(c => ({ 
      name: c, 
      score: parseFloat(form.criteria[c]) || 0 
    }))

    try {
      await observationApi.create({
        teacher_id: form.teacherId,
        total_score: total,
        max_score: max,
        criteria_scores
      })
      toast.success('Observation saved successfully!')
      setSaved(true)
      setShowForm(false)
      setForm({ classPrefix: '', section: '', subject: '', teacherId: '', teacherName: '', criteria: {} })
      fetchData()
    } catch (err) {
      toast.error('Failed to save observation')
    }
  }

  const chartData = useMemo(() => {
    return [...obsList].slice(0, 5).map(o => ({
      name: o.teacher?.name?.split(' ')[0] || 'Unknown',
      pct: Math.round((o.total_score / o.max_score) * 100)
    }))
  }, [obsList])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>

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
          {obsList.length > 0 && (
            <div className="card p-6">
              <SectionHeader title="Observation Scores" subtitle="Recent comparisons" />
              <BarChartWidget data={chartData} dataKey="pct" xKey="name" color="#0d9488" height={200} name="Score %" />
            </div>
          )}

          <div className="card p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <SectionHeader title="Observation Records" subtitle="Detailed breakdown of feedback" />
              <div className="flex flex-wrap items-center gap-2">
                <select className="input py-2 px-3 text-xs bg-slate-50 font-semibold text-slate-600 rounded-lg border-slate-200 w-auto min-w-[120px]" value={listFilters.classPrefix} onChange={e => setListFilters(f => ({ ...f, classPrefix: e.target.value }))}>
                  <option value="All">All Classes</option>
                  {classOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select className="input py-2 px-3 text-xs bg-slate-50 font-semibold text-slate-600 rounded-lg border-slate-200 w-auto min-w-[120px]" value={listFilters.section} onChange={e => setListFilters(f => ({ ...f, section: e.target.value }))}>
                  <option value="All">All Sections</option>
                  {sectionOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select className="input py-2 px-3 text-xs bg-slate-50 font-semibold text-slate-600 rounded-lg border-slate-200 w-auto min-w-[120px]" value={listFilters.subject} onChange={e => setListFilters(f => ({ ...f, subject: e.target.value }))}>
                  <option value="All">All Subjects</option>
                  {subjectOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            
            <div className="relative space-y-6">
              {dataLoading && (
                <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                  <div className="bg-white/90 p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                    <Loader2 size={20} className="animate-spin text-brand-500" />
                    <span className="text-sm font-bold text-slate-600">Updating Records...</span>
                  </div>
                </div>
              )}
              {filteredObsList.length > 0 ? filteredObsList.map(obs => {
                const p = Math.round((obs.total_score / obs.max_score) * 100)
                const colorClass = p >= 80 ? 'text-brand-600' : p >= 60 ? 'text-amber-600' : 'text-rose-600';
                const barColor = p >= 80 ? 'bg-emerald-400' : p >= 60 ? 'bg-amber-400' : 'bg-rose-400';
                
                return (
                  <div key={obs.id} className="border border-slate-100 rounded-xl p-5 bg-white mb-4">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50/80">
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{obs.teacher?.name}</h4>
                        <div className="flex gap-2 items-center mt-1 text-slate-400 text-xs font-semibold">
                          <span>{new Date(obs.observation_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span>•</span>
                          <span>Observed by: {obs.observer?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${colorClass}`}>{p}%</p>
                        <p className="text-xs text-slate-400 font-semibold">{obs.total_score}/{obs.max_score}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3.5">
                      {obs.criteria_scores && obs.criteria_scores.map((c, i) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="label">Class</label>
                <select 
                  className="select w-full" 
                  value={form.classId} 
                  onChange={e => setForm({ ...form, classId: e.target.value })}
                >
                  <option value="">Select Class</option>
                  {classOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Section</label>
                <select 
                  className="select w-full" 
                  value={form.sectionId} 
                  onChange={e => setForm({ ...form, sectionId: e.target.value })}
                  disabled={!form.classId || fetchingSections}
                >
                  <option value="">{fetchingSections ? "Loading..." : "Select Section (Optional)"}</option>
                  {sectionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject</label>
                <select 
                  className="select w-full" 
                  value={form.subjectId} 
                  onChange={e => setForm({ ...form, subjectId: e.target.value })}
                  disabled={!form.classId || fetchingSubjects}
                >
                  <option value="">{fetchingSubjects ? "Loading..." : "Select Subject"}</option>
                  {subjectOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Select Teacher</label>
                <select 
                  className="select w-full" 
                  value={form.teacherId} 
                  onChange={e => {
                    const t = dbTeachers.find(tch => String(tch.id) === e.target.value)
                    setForm({ ...form, teacherId: e.target.value, teacherName: t ? t.name : '' })
                  }}
                >
                  <option value="">Select Teacher</option>
                  {teacherOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
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