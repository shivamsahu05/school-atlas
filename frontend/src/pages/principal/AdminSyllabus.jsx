import { useState, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import { BookOpen, CheckCircle, Clock, AlertCircle, Plus, Download, Filter, Loader2 } from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge, ProgressBar, Modal } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { syllabusApi, classesApi, academicApi } from '../../api'

function downloadCSV(rows) {
  const cols = ['class','subject','chapter','topic','planned_start','planned_end','completed_date','is_completed']
  const header = cols.join(',')
  const body = rows.map(r => [
    r.class?.class_name+'-'+(r.class?.section||''),
    r.subject?.name||'',
    r.chapter||'',
    r.topic||'',
    r.planned_start_date?.slice(0,10)||'',
    r.planned_end_date?.slice(0,10)||'',
    r.completed_date?.slice(0,10)||'',
    r.is_completed?'Yes':'No',
  ].map(v=>`"${v}"`).join(',')).join('\n')
  const blob = new Blob([header+'\n'+body],{type:'text/csv'})
  Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:'syllabus-admin.csv'}).click()
}

export default function AdminSyllabus() {
  const [items,      setItems]      = useState([])
  const [classes,    setClasses]    = useState([])
  const [subjects,   setSubjects]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [filterCls,  setFilterCls]  = useState('')
  const [filterSub,  setFilterSub]  = useState('')
  const [filterSec,  setFilterSec]  = useState('')
  const [filterDone, setFilterDone] = useState('')
  const [filterSections, setFilterSections] = useState([])
  const [filterSubjects, setFilterSubjects] = useState([])
  const [form, setForm] = useState({ 
    class_id:'', subject_id:'', section_id:'', chapter:'', topic:'', 
    planned_start_date:'', planned_end_date:'', is_completed:false 
  })
  const [selectedClassId, setSelectedClassId] = useState('')
  const [acadSections, setAcadSections] = useState([])
  const [acadSubjects, setAcadSubjects] = useState([])

  // Fetch static data once on mount
  useEffect(() => {
    Promise.all([
      academicApi.getClasses(),
      classesApi.getSubjects()
    ]).then(([clsRes, subRes]) => {
      const clsList = Array.isArray(clsRes.data) ? clsRes.data : (clsRes.classes || clsRes.data?.items || [])
      setClasses(clsList)
      const subList = Array.isArray(subRes.data) ? subRes.data : (subRes.subjects || subRes.data?.subjects || [])
      setSubjects(subList)
    }).catch(console.error)
  }, [])

  const fetchSyllabus = useCallback(async (showFullLoader = false) => {
    try {
      if (showFullLoader) setLoading(true)
      setDataLoading(true)
      setError(null)
      const sylRes = await syllabusApi.getAll({
        class_id:     filterCls  || undefined,
        subject_id:   filterSub  || undefined,
        section:      filterSec  || undefined,
        is_completed: filterDone || undefined,
      })
      const rows = Array.isArray(sylRes.data) ? sylRes.data : (sylRes.data?.items || sylRes.items || [])
      setItems(rows)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load syllabus.')
    } finally {
      setLoading(false)
      setDataLoading(false)
    }
  }, [filterCls, filterSub, filterSec, filterDone])

  useEffect(() => { 
    fetchSyllabus(items.length === 0) 
  }, [fetchSyllabus])

  useEffect(() => {
    const fetchFilterData = async () => {
      if (!filterCls) {
        setFilterSections([])
        setFilterSubjects([])
        setFilterSec('')
        setFilterSub('')
        return
      }
      try {
        const [secRes, subRes] = await Promise.all([
          academicApi.getClassSections(filterCls),
          academicApi.getClassSubjects(filterCls)
        ])
        setFilterSections(secRes.data || secRes.sections || [])
        setFilterSubjects(subRes.data || subRes.subjects || [])
      } catch (e) { console.error(e) }
    }
    fetchFilterData()
  }, [filterCls])

  const handleClassChange = async (classId) => {
    setSelectedClassId(classId)
    setAcadSections([])
    setAcadSubjects([])
    setForm(f => ({ ...f, class_id: classId, subject_id: '' }))
    
    if (!classId) return
    
    try {
      const [secRes, subRes] = await Promise.all([
        academicApi.getClassSections(classId),
        academicApi.getClassSubjects(classId)
      ])
      setAcadSections(secRes.data || secRes.sections || [])
      setAcadSubjects(subRes.data || subRes.subjects || [])
    } catch (err) {
      console.error('Failed to load class data:', err)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!selectedClassId || !form.subject_id || !form.topic) { 
      alert('Class, subject and topic are required.'); 
      return 
    }
    
    try {
      setSubmitting(true)
      const selectedClass = classes.find(c => c.id === Number(selectedClassId))
      const sectionObj = acadSections.find(s => s.section_id === Number(form.section_id))
      
      const payload = {
        ...form,
        className: selectedClass?.name,
        sectionName: sectionObj?.section_name || sectionObj?.name || sectionObj?.code
      }
      
      await syllabusApi.create(payload)
      setModalOpen(false)
      setForm({ subject_id:'', chapter:'', topic:'', planned_start_date:'', planned_end_date:'', is_completed:false })
      setSelectedClassId('')
      setAcadSections([])
      setAcadSubjects([])
      fetchSyllabus()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add topic.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleModalOpen = () => {
    setModalOpen(true)
    setSelectedClassId('')
    setAcadSections([])
    setAcadSubjects([])
    setForm({ subject_id:'', chapter:'', topic:'', planned_start_date:'', planned_end_date:'', is_completed:false })
  }

  const total     = items.length
  const completed = items.filter(i => i.is_completed).length
  const pending   = total - completed
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  // Chart: completion by class
  const byClass = {}
  items.forEach(i => {
    const k = `${i.class?.class_name||'?'}-${i.class?.section||''}`
    if (!byClass[k]) byClass[k] = { total:0, done:0 }
    byClass[k].total++
    if (i.is_completed) byClass[k].done++
  })
  const chartData = Object.entries(byClass).map(([cls, v]) => ({
    class: cls, pct: v.total > 0 ? Math.round((v.done/v.total)*100) : 0
  }))

  const columns = [
    { key:'class',          label:'Class',    sortable:true, render:(_,r)=>`${r.class?.class_name||''}-${r.class?.section||''}` },
    { key:'subject',        label:'Subject',  sortable:true, render:(_,r)=>r.subject?.name||'—' },
    { key:'chapter',        label:'Chapter',  sortable:true },
    { key:'topic',          label:'Topic',    sortable:true },
    { 
      key:'planned_dates',    label:'Planned Range', sortable:false, 
      render:(_,r)=> (
        <div className="flex flex-col gap-0.5">
          <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-300"/> From: {r.planned_start_date?.slice(0,10)||'—'}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-slate-300"/> To: {r.planned_end_date?.slice(0,10)||'—'}</div>
        </div>
      )
    },
    { 
      key:'status_info', label:'Status & Date', sortable:true,
      render:(_,r) => {
        const isDone = r.is_completed === 1 || r.is_completed === true;
        const date = isDone ? r.completed_date : r.updated_at;
        return (
          <div className="flex flex-col gap-1 min-w-[120px]">
            <span className={clsx(
              "text-[10px] font-black px-2 py-0.5 rounded border shadow-sm w-fit uppercase",
              isDone ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
            )}>
              {isDone ? 'Completed' : 'Pending'}
            </span>
            {date && (
              <span className="text-[10px] font-bold text-slate-400">
                {isDone ? 'on ' : 'Last: '}
                <span className="text-slate-600">{new Date(date).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}</span>
              </span>
            )}
          </div>
        )
      }
    }
  ]

  const S = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  if (loading && items.length === 0) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>
  if (error) return (
    <div className="card p-8 text-center">
      <AlertCircle size={28} className="text-rose-500 mx-auto mb-3"/>
      <p className="text-slate-600">{error}</p>
      <button onClick={() => fetchSyllabus(true)} className="btn-primary btn mt-4">Retry</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Topics"  value={total}     icon={BookOpen}    color="blue"  />
        <StatCard title="Completed"     value={completed} icon={CheckCircle} color="green" trend={pct} />
        <StatCard title="Pending"       value={pending}   icon={Clock}       color="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <SectionHeader title="Overall Completion" subtitle={`${pct}% across all classes`}/>
          <div className="mt-4">
            <ProgressBar value={completed} max={total} color={pct>=80?'green':pct>=50?'amber':'red'} height="h-3" showLabel/>
          </div>
        </div>
        <div className="card p-6">
          <SectionHeader title="Completion by Class" subtitle="Percentage per class"/>
          {chartData.length > 0
            ? <BarChartWidget data={chartData} dataKey="pct" xKey="class" color="#1a56db" height={180} name="Completion %"/>
            : <p className="text-center text-sm text-slate-400 py-10">No data.</p>
          }
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <SectionHeader title="All Topics" subtitle={`${items.length} topics`}/>
          <div className="flex gap-2">
            <button onClick={() => downloadCSV(items)} className="btn-secondary btn btn-sm gap-1.5">
              <Download size={13}/> Export
            </button>
            <button onClick={handleModalOpen} className="btn-primary btn btn-sm">
              <Plus size={14}/> Add Topic
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Filter size={14} className="text-slate-400 self-center"/>
          <select value={filterCls} onChange={e=>setFilterCls(e.target.value)} className={S}>
            <option value="">All Classes</option>
            {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={filterSec} onChange={e=>setFilterSec(e.target.value)} className={S} disabled={!filterCls}>
            <option value="">All Sections</option>
            {filterSections.map(s => <option key={s.mapping_id} value={s.section_name || s.name || s.code}>{s.section_name || s.name || s.code}</option>)}
          </select>
          <select value={filterSub} onChange={e=>setFilterSub(e.target.value)} className={S} disabled={!filterCls}>
            <option value="">All Subjects</option>
            {(filterCls ? filterSubjects : subjects).map(s=><option key={s.mapping_id || s.id} value={s.subject_id || s.id}>{s.subject_name || s.name}</option>)}
          </select>
          <select value={filterDone} onChange={e=>setFilterDone(e.target.value)} className={S}>
            <option value="">All Status</option>
            <option value="true">Completed</option>
            <option value="false">Pending</option>
          </select>
        </div>

        <div className="relative">
          {dataLoading && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
              <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
          )}
          <DataTable columns={columns} rows={items} emptyMessage="No syllabus topics found."/>
        </div>
      </div>

      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title="Add Syllabus Topic">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Class *</label>
              <select className="select" value={selectedClassId} onChange={e => handleClassChange(e.target.value)} required>
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Section *</label>
              <select className="select" value={form.section_id || ''} onChange={e => setForm(f => ({ ...f, section_id: e.target.value }))} required disabled={!selectedClassId}>
                <option value="">Select section…</option>
                {acadSections.map(s => <option key={s.mapping_id} value={s.section_id}>{s.section_name || s.name || s.code}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Subject *</label>
              <select className="select" value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))} required disabled={!selectedClassId}>
                <option value="">Select subject…</option>
                {acadSubjects.map(s => <option key={s.mapping_id} value={s.subject_id}>{s.subject_name || s.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Chapter</label><input className="input" value={form.chapter} onChange={e=>setForm(f=>({...f,chapter:e.target.value}))} placeholder="Chapter name"/></div>
          <div><label className="label">Topic *</label><input className="input" value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))} placeholder="Topic name" required/></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-xs">Planned Start Date</label>
              <input className="input" type="date" value={form.planned_start_date} onChange={e=>setForm(f=>({...f,planned_start_date:e.target.value}))}/>
            </div>
            <div>
              <label className="label text-xs">Planned End Date</label>
              <input className="input" type="date" value={form.planned_end_date} onChange={e=>setForm(f=>({...f,planned_end_date:e.target.value}))}/>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary btn flex-1 justify-center disabled:opacity-60">
              {submitting?<Loader2 size={14} className="animate-spin mr-2"/>:null} Add Topic
            </button>
            <button type="button" onClick={()=>setModalOpen(false)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
