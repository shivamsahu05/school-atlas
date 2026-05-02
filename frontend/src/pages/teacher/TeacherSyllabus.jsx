import { useState, useEffect, useCallback } from 'react'
import { BookOpen, CheckCircle, Clock, Plus, Download, Upload, Table, Loader2, AlertTriangle, Filter, Edit2, Trash2, RotateCcw } from 'lucide-react'
import { StatCard, SectionHeader, FilterChips, StatusBadge, Modal, ProgressBar } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { syllabusApi, scheduleApi } from '../../api'

function downloadCSV(rows) {
  const safeRows = Array.isArray(rows) ? rows : []
  const cols = ['class','subject','chapter','topic','planned_date','completed_date','is_completed']
  const header = cols.join(',')
  const body = safeRows.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(',')).join('\n')
  const blob = new Blob([header+'\n'+body], { type:'text/csv' })
  Object.assign(document.createElement('a'), { href:URL.createObjectURL(blob), download:'syllabus.csv' }).click()
}

export default function TeacherSyllabus() {
  const [items, setItems] = useState([])
  const [assignments, setAssignments] = useState({ classes: [], subjects: [] })
  const [modalSubjects, setModalSubjects] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [stats,      setStats]      = useState({ total:0, completed:0, pending:0, completionPct:0 })
  const [error,      setError]      = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [filterCls,  setFilterCls]  = useState('')
  const [filterDone, setFilterDone] = useState('All')
  const [editingId, setEditingId] = useState(null)
  const [doneModalOpen, setDoneModalOpen] = useState(false)
  const [markingDoneId, setMarkingDoneId] = useState(null)
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().slice(0,10))
  const [form, setForm] = useState({
    class_id:'', section_id:'', subject_id:'', chapter:'', topic:'', week: '',
    planned_start_date:'', planned_end_date:'', 
    completed_date:'', is_completed:false
  })
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadResults, setUploadResults] = useState(null)

  // Fetch assignments once on mount
  useEffect(() => {
    scheduleApi.getMyAssignments().then(res => {
      setAssignments(res?.data || { classes: [], subjects: [] })
    }).catch(console.error)
  }, [])

  // Fetch subjects for modal when class changes
  useEffect(() => {
    if (!form.class_id) {
      setModalSubjects([]);
      return;
    }
    
    let cId = form.class_id;
    if (cId.includes(':')) {
      [cId] = cId.split(':');
    }
    
    scheduleApi.getTeacherSubjects({ class_id: cId }).then(res => {
      setModalSubjects(res.data || []);
    }).catch(() => setModalSubjects([]));
  }, [form.class_id]);

  const fetchSyllabus = useCallback(async (showFullLoader = false) => {
    try {
      if (showFullLoader) setLoading(true)
      setDataLoading(true)
      setError(null)
      
      let reqClassId = undefined;
      let reqSectionId = undefined;
      if (filterCls && filterCls.includes(':')) {
        const [cId, sId] = filterCls.split(':');
        reqClassId = cId;
        reqSectionId = sId;
      }

      const sylRes = await syllabusApi.getAll({
        class_id:     reqClassId,
        section_id:   reqSectionId,
        is_completed: filterDone === 'All' ? undefined : filterDone === 'Completed' ? 'true' : 'false',
      })

      const safeDataSyl = Array.isArray(sylRes?.data?.items) ? sylRes.data.items : []
      const safeStats = sylRes?.data?.stats || { total:0, completed:0, pending:0, completionPct:0 }
      
      setItems(safeDataSyl)
      setStats(safeStats)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
      setDataLoading(false)
    }
  }, [filterCls, filterDone])

  useEffect(() => { 
    fetchSyllabus(items.length === 0) 
  }, [fetchSyllabus])

  const handleToggleDone = async (id, currentStatus) => {
    if (currentStatus) {
      // Undoing: just confirm and update
      if (!window.confirm('Mark this topic as PENDING again?')) return
      try {
        await syllabusApi.update(id, { is_completed: false, completed_date: null })
        fetchSyllabus()
      } catch (err) { alert(err.response?.data?.message || 'Update failed') }
    } else {
      // Marking Done: Open date modal
      setMarkingDoneId(id)
      setCompletionDate(new Date().toISOString().slice(0,10))
      setDoneModalOpen(true)
    }
  }

  const submitMarkDone = async (e) => {
    e.preventDefault()
    if (!markingDoneId) return
    try {
      setSubmitting(true)
      await syllabusApi.update(markingDoneId, { 
        is_completed: true, 
        completed_date: completionDate 
      })
      setDoneModalOpen(false)
      setMarkingDoneId(null)
      fetchSyllabus()
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this topic?')) return
    try {
      await syllabusApi.delete(id)
      fetchSyllabus()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    const toInputDate = (d) => {
      if (!d) return ''
      const date = new Date(d)
      if (isNaN(date)) return ''
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    setForm({
      class_id:           String(row.class_id || ''),
      section_id:         String(row.section_id || ''),
      subject_id:         String(row.subject_id || ''),
      chapter:            row.chapter || '',
      topic:              row.topic || '',
      week:               row.week || '',
      planned_start_date: toInputDate(row.planned_start_date),
      planned_end_date:   toInputDate(row.planned_end_date),
      completed_date:     toInputDate(row.completed_date),
      is_completed:       !!row.is_completed
    })
    setModalOpen(true)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.class_id || !form.subject_id || !form.topic) {
      alert('Class, subject and topic are required.')
      return
    }
    try {
      setSubmitting(true)
      const payload = { ...form }
      
      if (payload.class_id && payload.class_id.includes(':')) {
        const [cId, sId] = payload.class_id.split(':');
        payload.class_id = Number(cId);
        payload.section_id = Number(sId);
      } else {
        payload.class_id = Number(payload.class_id);
        payload.section_id = Number(payload.section_id);
      }
      payload.subject_id = Number(payload.subject_id);

      if (editingId) {
        await syllabusApi.update(editingId, payload)
      } else {
        await syllabusApi.create(payload)
      }

      setModalOpen(false)
      setEditingId(null)
      setForm({ 
        class_id:'', section_id:'', subject_id:'', chapter:'', topic:'', week:'',
        planned_start_date:'', planned_end_date:'', 
        completed_date:'', is_completed:false 
      })
      fetchSyllabus()
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) return
    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('file', uploadFile)
      const res = await syllabusApi.bulkUpload(formData)
      setUploadResults(res.data)
      if (res.data.inserted > 0 || res.data.updated > 0) {
        fetchSyllabus()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await syllabusApi.downloadTemplate()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'syllabus_template.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) { alert('Download failed') }
  }

  // SAFE ARRAY WRAPPER FOR RENDERING
  const safeItems = Array.isArray(items) ? items : []

  // Stats from backend
  const { total, completed, pending, completionPct: pct } = stats

  // Chart data — completion by subject
  const bySubject = {}
  safeItems.forEach(i => {
    const k = i.subject?.name || 'Unknown'
    if (!bySubject[k]) bySubject[k] = { total:0, completed:0 }
    bySubject[k].total++
    if (i.is_completed) bySubject[k].completed++
  })
  const chartData = Object.entries(bySubject).map(([name, v]) => ({
    subject: name,
    pct: v.total > 0 ? Math.round((v.completed/v.total)*100) : 0,
  }))

  // Subjects for the selected class in the modal are now stored in state: modalSubjects
  // No longer derived here via assignments.subjects filter to ensure fresh/correct data from backend


  const getWeekString = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    const day = date.getDate()
    if (day <= 7) return 'Week 1 (1–7)'
    if (day <= 14) return 'Week 2 (8–14)'
    if (day <= 21) return 'Week 3 (15–21)'
    if (day <= 28) return 'Week 4 (22–28)'
    return 'Week 5 (29+)'
  }

  const columns = [
    { key:'week',           label:'WEEK',     sortable:true,
      render: (v, r) => v || getWeekString(r.planned_start_date) },
    { key:'planned_date',   label:'PLANNED DATE', sortable:true,
      render: (_, r) => {
        const start = r.planned_start_date ? new Date(r.planned_start_date).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
        const end = r.planned_end_date ? new Date(r.planned_end_date).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
        return (
          <div className="flex flex-col text-[9px] font-bold text-slate-500 bg-slate-50/50 px-2 py-1 rounded-md border border-slate-100 w-fit min-w-[110px] leading-[1.3]">
            <span className="flex justify-between items-center">From: <span className="text-brand-600 font-black">{start}</span></span>
            <span className="flex justify-between items-center border-t border-slate-100 mt-0.5 pt-0.5">To: <span className="text-brand-600 font-black">{end}</span></span>
          </div>
        )
      }
    },
    { key:'chapter',        label:'Chapter',  sortable:true },
    { key:'topic',          label:'Topic',    sortable:true },
    { key:'class',          label:'Class',    sortable:true,
      render: (_,r) => `${r.class?.class_name||''}${r.class?.section ? '-'+r.class.section : ''}` },
    { key:'subject',        label:'Subject',  sortable:true,
      render: (_,r) => r.subject?.name || '—' },
    { key:'completed_date', label:'Status/Date',sortable:true,
      render: (v, r) => {
        const displayDate = r.is_completed ? r.completed_date : r.updated_at;
        return (
          <div className="flex flex-col gap-1">
            {displayDate ? (
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg border shadow-sm w-fit ${r.is_completed ? "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-50" : "text-amber-600 bg-amber-50 border-amber-100 shadow-amber-50"}`}>
                {r.is_completed ? "✅ Completed on: " : "⏳ Last Updated: "}
                {new Date(displayDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            ) : <span className="text-slate-300">—</span>}
          </div>
        );
      }
    },

    { key:'actions', label:'Actions', sortable:false,
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-brand-600 transition-colors">
            <Edit2 size={14}/>
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors">
            <Trash2 size={14}/>
          </button>
        </div>
      )
    }
  ]

  const SELECT = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  if (loading && items.length === 0) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>
  if (error)   return (
    <div className="card p-8 text-center">
      <AlertTriangle size={28} className="text-rose-500 mx-auto mb-3"/>
      <p className="text-slate-600">{error}</p>
      <button onClick={fetchSyllabus} className="btn-primary btn mt-4">Retry</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Topics"  value={total}     icon={BookOpen}    color="blue" />
        <StatCard title="Completed"     value={completed} icon={CheckCircle} color="green" trend={pct} />
        <StatCard title="Pending"       value={pending}   icon={Clock}       color="amber" />
      </div>

      {/* Progress + Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <SectionHeader title="Overall Progress" subtitle={`${pct}% syllabus completed`}/>
          <div className="mt-5 space-y-2">
            <ProgressBar value={completed} max={total} color={pct>=80?'green':pct>=50?'amber':'red'} height="h-3" showLabel/>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{completed} completed</span>
              <span>{pending} remaining</span>
            </div>
          </div>
          {/* per-subject breakdown */}
          {chartData.length > 0 && (
            <div className="mt-5 space-y-2">
              {chartData.map(r => (
                <div key={r.subject}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{r.subject}</span>
                    <span>{r.pct}%</span>
                  </div>
                  <ProgressBar value={r.pct} max={100} color={r.pct>=80?'green':r.pct>=50?'amber':'red'} height="h-1.5" showLabel={false}/>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <SectionHeader title="Completion by Subject" subtitle="% of topics covered"/>
          {chartData.length > 0
            ? <BarChartWidget data={chartData} dataKey="pct" xKey="subject" color="#1a56db" height={220} name="Completion %"/>
            : <p className="text-center text-sm text-slate-400 py-16">No chart data yet.</p>
          }
        </div>
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <SectionHeader title="Syllabus Topics" subtitle={`${safeItems.length} topics`}/>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleDownloadTemplate} className="btn-secondary btn btn-sm gap-1.5">
              <Table size={13}/> Template
            </button>
            <button onClick={() => setBulkModalOpen(true)} className="btn-secondary btn btn-sm gap-1.5">
              <Upload size={13}/> Bulk Upload
            </button>
            <button onClick={() => downloadCSV(safeItems)} className="btn-secondary btn btn-sm gap-1.5">
              <Download size={13}/> Export
            </button>
            <button onClick={() => { setEditingId(null); setModalOpen(true); }} className="btn-primary btn btn-sm">
              <Plus size={14}/> Add Topic
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Filter size={14} className="text-slate-400 self-center"/>
          <select value={filterCls} onChange={e => setFilterCls(e.target.value)} className={SELECT}>
            <option value="">All Classes</option>
            {assignments.classes.map(c => (
              <option key={`${c.class_id}-${c.section_id}`} value={`${c.class_id}:${c.section_id}`}>
                Class {c.class_number}-{c.section}
              </option>
            ))}
          </select>
          <FilterChips options={['All','Completed','Pending']} value={filterDone} onChange={setFilterDone}/>
        </div>

        <div className="relative">
          {dataLoading && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
              <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
          )}
          <DataTable columns={columns} rows={safeItems} emptyMessage="No syllabus topics found."/>
        </div>
      </div>

      {/* Mark Done Modal */}
      <Modal open={doneModalOpen} onClose={() => setDoneModalOpen(false)} title="Completion Details">
        <form onSubmit={submitMarkDone} className="space-y-4">
          <p className="text-sm text-slate-600">Please select the date this topic was completed:</p>
          <div>
            <label className="label">Completion Date *</label>
            <input className="input" type="date" value={completionDate} 
              onChange={e => setCompletionDate(e.target.value)} required max={new Date().toISOString().slice(0,10)}/>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary btn flex-1 justify-center">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2"/> : null}
              Confirm Completion
            </button>
            <button type="button" onClick={() => setDoneModalOpen(false)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Add Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }} title={editingId ? 'Edit Syllabus Topic' : 'Add Syllabus Topic'}>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Class *</label>
              <select className="select" value={form.class_id.includes(':') ? form.class_id : `${form.class_id}:${form.section_id}`}
                onChange={e => {
                  const val = e.target.value;
                  const [cId, sId] = val.split(':');
                  setForm(f=>({...f, class_id: cId, section_id: sId, subject_id: ''})) // Reset subject when class changes
                }} required>
                <option value="">Select class…</option>
                {assignments.classes.map(c => (
                  <option key={`${c.class_id}-${c.section_id}`} value={`${c.class_id}:${c.section_id}`}>
                    Class {c.class_number}-{c.section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Subject *</label>
              <select className="select" value={form.subject_id}
                onChange={e => setForm(f=>({...f,subject_id:e.target.value}))} required disabled={!form.class_id}>
                <option value="">Select subject…</option>
                {modalSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Chapter</label>
              <input className="input" placeholder="e.g. Chapter 3"
                value={form.chapter} onChange={e => setForm(f=>({...f,chapter:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Week</label>
              <input className="input" placeholder="e.g. Week 1"
                value={form.week} onChange={e => setForm(f=>({...f,week:e.target.value}))}/>
            </div>
          </div>
          <div>
            <label className="label">Topic *</label>
            <input className="input" placeholder="e.g. Linear Equations"
              value={form.topic} onChange={e => setForm(f=>({...f,topic:e.target.value}))} required/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Planned Start Date</label>
              <input className="input" type="date" value={form.planned_start_date}
                onChange={e => setForm(f=>({...f,planned_start_date:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Planned End Date</label>
              <input className="input" type="date" value={form.planned_end_date}
                onChange={e => setForm(f=>({...f,planned_end_date:e.target.value}))}/>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary btn flex-1 justify-center disabled:opacity-60">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2"/> : null} 
              {editingId ? 'Save Changes' : 'Add Topic'}
            </button>
            <button type="button" onClick={() => { setModalOpen(false); setEditingId(null); }} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkModalOpen} onClose={() => { setBulkModalOpen(false); setUploadResults(null); setUploadFile(null); }} title="Bulk Syllabus Upload">
        <form onSubmit={handleBulkUpload} className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <label className="label">Select CSV or Excel file</label>
            <input type="file" accept=".csv, .xlsx" onChange={e => setUploadFile(e.target.files[0])} 
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
            <p className="mt-2 text-[10px] text-slate-400 leading-relaxed">
              • Headers required: Class, Section, Subject, Chapter, Week, Topic, StartDate, EndDate<br/>
              • Date format: YYYY-MM-DD<br/>
              • Maximum file size: 2MB
            </p>
          </div>

          {uploadResults && (
            <div className="p-3 bg-white border rounded-xl space-y-2">
              <div className="flex justify-around text-center">
                <div className="text-emerald-600">
                  <div className="text-xl font-bold">{uploadResults.inserted}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider">Inserted</div>
                </div>
                <div className="text-brand-600">
                  <div className="text-xl font-bold">{uploadResults.updated}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider">Updated</div>
                </div>
                <div className="text-rose-600">
                  <div className="text-xl font-bold">{uploadResults.failed}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider">Failed</div>
                </div>
              </div>
              {uploadResults.errors?.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto border-t pt-2">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">ERRORS ({uploadResults.errors.length}):</p>
                  {uploadResults.errors.map((err, i) => (
                    <div key={i} className="text-[10px] text-rose-500 py-1 border-b border-slate-50 last:border-0">
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting || !uploadFile} className="btn-primary btn flex-1 justify-center disabled:opacity-60">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2"/> : null} 
              Start Upload
            </button>
            <button type="button" onClick={() => { setBulkModalOpen(false); setUploadResults(null); setUploadFile(null); }} className="btn-secondary btn px-4">Close</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
