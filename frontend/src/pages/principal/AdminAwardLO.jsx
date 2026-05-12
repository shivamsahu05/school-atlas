import { useState, useEffect, useMemo } from 'react'
import { 
  Trophy, BookOpen, GraduationCap, Users, 
  Calendar, Clock, CheckCircle, AlertCircle,
  ChevronDown, Search, Filter, Info, Star,
  Trash2, Edit, Save, X
} from 'lucide-react'
import { 
  StatCard, SectionHeader, 
  Modal, DataTable, StatusBadge
} from '../../components/ui/index.jsx'
import api from '../../services/api'
import { academicApi } from '../../api'
import clsx from 'clsx'

export default function AwardLOScores() {
  const [meta, setMeta] = useState({
    classes: [],
    subjects: [],
    teachers: [],
    learning_outcomes: []
  })
  
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState([])
  const [editItem, setEditItem] = useState(null)

  // Selections
  const [form, setForm] = useState({
    teacher_id: '',
    class_id: '',
    section_id: '',
    subject_id: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    week: 'Week 1',
    topic: '',
    learning_outcome_id: '',
    score: '',
    lo_status: 'Meeting'
  })

  // Dynamic lists
  const [filteredSections, setFilteredSections] = useState([])
  const [filteredSubjects, setFilteredSubjects] = useState([])
  const [filteredTeachers, setFilteredTeachers] = useState([])
  const [resolvingTopic, setResolvingTopic] = useState(false)

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchMeta = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/lo/meta')
      if (res.data.success) {
        setMeta(res.data.data || { 
          classes: [], 
          subjects: [], 
          teachers: [], 
          learning_outcomes: [] 
        })
      }
    } catch (error) {
      console.error('Failed to fetch LO meta:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await api.get('/admin/lo/history')
      if (res.data.success) setHistory(res.data.data)
    } catch (e) { console.error(e) }
    finally { setHistoryLoading(false) }
  }

  useEffect(() => {
    fetchMeta()
    fetchHistory()
  }, [])

  // ── Dynamic Filtering ──────────────────────────────────────────────────────

  // When class changes -> Fetch sections and subjects
  useEffect(() => {
    if (!form.class_id) {
      setFilteredSections([])
      setFilteredSubjects([])
      return
    }
    
    const fetchClassData = async () => {
      try {
        const [secRes, subRes] = await Promise.all([
          academicApi.getClassSections(form.class_id),
          academicApi.getClassSubjects(form.class_id)
        ])
        setFilteredSections(secRes.data || secRes.sections || [])
        setFilteredSubjects(subRes.data || subRes.subjects || [])
      } catch (err) {
        console.error('Failed to fetch class data:', err)
      }
    }
    fetchClassData()
    
    setForm(prev => ({ ...prev, section_id: '', subject_id: '', teacher_id: '' }))
  }, [form.class_id])

  // When subject changes -> Fetch/Filter teachers
  useEffect(() => {
    if (!form.class_id || !form.subject_id) {
      setFilteredTeachers([])
      return
    }

    const fetchTeachers = async () => {
      try {
        // We use subject_id (from academic mapping) and class_id (academic class)
        // Backend handles fallback to all teachers if no mapping exists
        const res = await api.get(`/admin/lo/teachers/${form.class_id}/${form.subject_id}`)
        if (res.data.success) {
          setFilteredTeachers(res.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch assigned teachers:', err)
      }
    }
    fetchTeachers()
    
    setForm(prev => ({ ...prev, teacher_id: '' }))
  }, [form.class_id, form.subject_id])

  // 3. AUTO-RESOLVE TOPIC FROM MICRO-SCHEDULE
  useEffect(() => {
    if (!form.teacher_id || !form.class_id || !form.section_id || !form.subject_id || !form.month || !form.week) return

    const resolveTopic = async () => {
      setResolvingTopic(true)
      try {
        const res = await api.get('/admin/lo/resolve-topic', {
          params: {
            teacher_id: form.teacher_id,
            class_id: form.class_id,
            section_id: form.section_id,
            subject_id: form.subject_id,
            month: form.month,
            week: form.week
          }
        })
        if (res.data.success && res.data.topic) {
          setForm(prev => ({ ...prev, topic: res.data.topic }))
        } else {
          setForm(prev => ({ ...prev, topic: '' }))
        }
      } catch (err) {
        console.error('Topic resolution failed:', err)
      } finally {
        setResolvingTopic(false)
      }
    }
    resolveTopic()
  }, [form.teacher_id, form.class_id, form.section_id, form.subject_id, form.month, form.week])

  // ── Logic ──────────────────────────────────────────────────────────────────
  
  const handleAward = async () => {
    if (!form.teacher_id || !form.class_id || !form.section_id || !form.subject_id || !form.score || !form.topic) {
      alert('Please fill in all required fields.')
      return
    }

    const selectedClass = meta.classes.find(c => String(c.id) === String(form.class_id))
    const selectedSec = filteredSections.find(s => String(s.section_id) === String(form.section_id))
    const payload = {
      ...form,
      className: selectedClass?.class_name,
      sectionName: selectedSec?.section_name || selectedSec?.name || selectedSec?.code
    }

    setSubmitting(true)
    try {
      const res = await api.post('/admin/lo/award', payload)
      if (res.data.success) {
        alert('Score awarded successfully!')
        setForm(prev => ({ ...prev, score: '', topic: '', learning_outcome_id: '', lo_status: 'Meeting' }))
        fetchHistory()
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this score?')) return
    try {
      const res = await api.delete(`/admin/lo/delete/${id}`)
      if (res.data.success) {
        setHistory(prev => prev.filter(h => h.id !== id))
      }
    } catch (e) { alert('Delete failed') }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      const res = await api.put(`/admin/lo/update/${editItem.id}`, {
        score: editItem.score,
        topic: editItem.topic,
        month: editItem.month,
        week: editItem.week,
        lo_status: editItem.lo_status
      })
      if (res.data.success) {
        setEditItem(null)
        fetchHistory()
      }
    } catch (e) { alert('Update failed') }
  }

  const columns = [
    { key: 'teacher_name', label: 'Teacher', render: (v, r) => (
      <div>
        <div className="font-bold text-slate-700">{v}</div>
        <div className="text-[10px] text-slate-400">{r.class_name}-{r.section} | {r.subject_name}</div>
      </div>
    )},
    { key: 'month', label: 'Period', render: (v, r) => <div className="text-xs">{v}, {r.week}</div> },
    { key: 'topic', label: 'Topic', className: 'max-w-[200px] truncate text-xs' },
    { key: 'score', label: 'Score', render: (v, r) => (
      <div className="flex flex-col gap-1">
        <span className={clsx('badge', Number(v) >= 75 ? 'badge-green' : Number(v) >= 50 ? 'badge-amber' : 'badge-red')}>
          {v || 0}%
        </span>
        <span className={clsx('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded text-center', 
          r.lo_status === 'Exceeding' ? 'bg-emerald-100 text-emerald-700' : 
          r.lo_status === 'Meeting' ? 'bg-blue-100 text-blue-700' : 
          'bg-amber-100 text-amber-700'
        )}>
          {r.lo_status || 'Meeting'}
        </span>
      </div>
    )},
    { key: 'actions', label: 'Actions', className: 'text-right', render: (_, r) => (
      <div className="flex justify-end gap-2">
        <button onClick={() => setEditItem(r)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-500 transition-colors">
          <Edit size={14} />
        </button>
        <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    )}
  ]

  const isFormValid = useMemo(() => {
    return form.teacher_id && form.class_id && form.section_id && form.subject_id && form.topic && form.score !== ''
  }, [form])

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Learning Outcome Assessment</h1>
          <p className="text-sm text-slate-500">Award performance scores to teachers based on academic outcomes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <SectionHeader 
              title="Award New Score" 
              subtitle="Fill in the assessment details below" 
              icon={Star}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              
              {/* Class Scope */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Class</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <GraduationCap size={16} />
                  </div>
                  <select 
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none hover:bg-white transition-all"
                    value={form.class_id}
                    onChange={e => setForm({...form, class_id: e.target.value})}
                  >
                    <option value="">Select class...</option>
                    {Array.isArray(meta.classes) && meta.classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Section */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Section</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Users size={16} />
                  </div>
                  <select 
                    disabled={!form.class_id}
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none hover:bg-white transition-all disabled:opacity-50"
                    value={form.section_id}
                    onChange={e => setForm({...form, section_id: e.target.value})}
                  >
                    <option value="">{form.class_id ? 'Select section...' : 'Choose class first'}</option>
                    {filteredSections.map(s => <option key={s.mapping_id} value={s.section_id}>{s.section_name || s.name || s.code}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Subject</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <BookOpen size={16} />
                  </div>
                  <select 
                    disabled={!form.class_id}
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none hover:bg-white transition-all disabled:opacity-50"
                    value={form.subject_id}
                    onChange={e => setForm({...form, subject_id: e.target.value})}
                  >
                    <option value="">{form.class_id ? 'Select subject...' : 'Choose class first'}</option>
                    {Array.isArray(filteredSubjects) && filteredSubjects.map(s => <option key={s.mapping_id || s.id} value={s.subject_id || s.id}>{s.subject_name || s.name}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Assigned Teacher */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Assigned Teacher</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Users size={16} />
                  </div>
                  <select 
                    disabled={!form.subject_id}
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none hover:bg-white transition-all disabled:opacity-50"
                    value={form.teacher_id}
                    onChange={e => setForm({...form, teacher_id: e.target.value})}
                  >
                    <option value="">{form.subject_id ? (filteredTeachers.length > 0 ? 'Select teacher...' : 'No teachers available') : 'Choose subject first'}</option>
                    {Array.isArray(filteredTeachers) && filteredTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              {/* Month & Week */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Month</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                      value={form.month}
                      onChange={e => setForm({...form, month: e.target.value})}
                    >
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Week</label>
                    <select 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                      value={form.week}
                      onChange={e => setForm({...form, week: e.target.value})}
                    >
                      {['Week 1','Week 2','Week 3','Week 4','Week 5'].map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                 </div>
              </div>

              {/* Topic / Learning Outcome */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Learning Topic / Outcome</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Trophy size={16} />
                  </div>
                  <input 
                    type="text"
                    placeholder={resolvingTopic ? "Finding topic from schedule..." : "Enter the specific topic or select from below..."}
                    className={clsx(
                      "w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all",
                      resolvingTopic && "animate-pulse border-brand-200 bg-brand-50/30"
                    )}
                    value={form.topic}
                    onChange={e => setForm({...form, topic: e.target.value})}
                    list="lo-suggestions"
                  />
                  <datalist id="lo-suggestions">
                    {Array.isArray(meta.learning_outcomes) && meta.learning_outcomes.map(lo => <option key={lo.id} value={lo.title} />)}
                  </datalist>
                </div>
              </div>

              {/* Qualitative Status */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Learning Outcome Status</label>
                <div className="flex flex-wrap gap-3">
                  {['Approaching', 'Meeting', 'Exceeding'].map(status => (
                    <button
                      key={status}
                      onClick={() => setForm({ ...form, lo_status: status })}
                      className={clsx(
                        "flex-1 py-3 px-4 rounded-2xl text-sm font-bold transition-all border",
                        form.lo_status === status 
                          ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20" 
                          : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Performance Score (0-100)</label>
                <div className="relative">
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter score..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
                    value={form.score}
                    onChange={e => setForm({...form, score: e.target.value})}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300 pointer-events-none">
                    PERCENT
                  </div>
                </div>
                <div className="flex justify-between px-1 mt-2">
                   {[0, 25, 50, 75, 100].map(val => (
                     <button 
                       key={val}
                       onClick={() => setForm({...form, score: val})}
                       className="text-[10px] font-bold text-slate-400 hover:text-brand-500 transition-colors"
                     >
                       {val}%
                     </button>
                   ))}
                </div>
              </div>

            </div>

            <div className="mt-8 pt-6 border-t border-slate-50">
              <button 
                onClick={handleAward}
                disabled={!isFormValid || submitting}
                className={clsx(
                  "w-full py-4.5 rounded-2xl flex items-center justify-center gap-3 font-black text-base transition-all duration-300 uppercase tracking-[0.2em] relative overflow-hidden group",
                  isFormValid 
                    ? "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_15px_40px_-12px_rgba(37,99,235,0.6)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]" 
                    : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                )}
              >
                {isFormValid && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                )}
                {submitting ? (
                  <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <div className="flex items-center gap-3 relative z-10">
                    <Trophy 
                      size={20} 
                      className={clsx(
                        "transition-transform duration-500",
                        isFormValid && "group-hover:scale-125 group-hover:rotate-[15deg] animate-pulse"
                      )} 
                    /> 
                    <span>Award Score Now</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Info / Summary */}
        <div className="space-y-6">
           <div className="card p-6 bg-brand-500 text-white border-none relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Info size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">Assessment Guidelines</h3>
                <p className="text-xs text-white/80 leading-relaxed space-y-2">
                  Scores should be awarded based on the student's mastery of the learning outcome.
                  <br /><br />
                  • <strong>90-100:</strong> Exceptional mastery<br />
                  • <strong>75-89:</strong> Strong understanding<br />
                  • <strong>50-74:</strong> Developing competency<br />
                  • <strong>Below 50:</strong> Needs intervention
                </p>
              </div>
           </div>

           <div className="card p-5 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Summary</h4>
              <div className="space-y-3">
                 <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs text-slate-500">Selected Class</span>
                    <span className="text-xs font-bold text-slate-700">{meta.classes.find(c => String(c.id) === String(form.class_id))?.class_name || 'None'}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs text-slate-500">Subjects Mapped</span>
                    <span className="text-xs font-bold text-slate-700">{filteredSubjects.length}</span>
                 </div>
                 <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-slate-500">Faculty Eligible</span>
                    <span className="text-xs font-bold text-brand-600">{filteredTeachers.length}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card p-6">
        <SectionHeader 
          title="Assessment History" 
          subtitle="View and manage previously awarded scores" 
          icon={Clock}
        />
        <div className="mt-6">
          <DataTable 
            columns={columns} 
            rows={history} 
            loading={historyLoading}
            emptyMessage="No assessment history found."
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Assessment Score">
        {editItem && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Month</label>
                <select className="select" value={editItem.month || ""} onChange={e => setEditItem({...editItem, month: e.target.value})}>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Week</label>
                <select className="select" value={editItem.week || ""} onChange={e => setEditItem({...editItem, week: e.target.value})}>
                  {['Week 1','Week 2','Week 3','Week 4','Week 5'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Topic</label>
              <input className="input" value={editItem.topic || ""} onChange={e => setEditItem({...editItem, topic: e.target.value})} />
            </div>
            <div>
              <label className="label">Score (%)</label>
              <input type="number" className="input" value={editItem.score || ""} onChange={e => setEditItem({...editItem, score: e.target.value})} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={editItem.lo_status || ""} onChange={e => setEditItem({...editItem, lo_status: e.target.value})}>
                <option value="Approaching">Approaching</option>
                <option value="Meeting">Meeting</option>
                <option value="Exceeding">Exceeding</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn-primary flex-1">Save Changes</button>
              <button type="button" onClick={() => setEditItem(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  )
}
