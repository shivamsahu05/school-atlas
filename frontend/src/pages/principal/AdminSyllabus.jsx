import { useState, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import { BookOpen, CheckCircle, Clock, AlertCircle, Plus, Download, Filter, Loader2, RotateCcw, Trash2, Edit } from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge, ProgressBar, Modal } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { syllabusApi, classesApi, academicApi, teachersApi } from '../../api'
import { MONTHS } from '../../data/constants'

function downloadCSV(rows) {
  const cols = ['teacher', 'class', 'subject', 'chapter_topic', 'timeline', 'status_date']
  const header = cols.join(',')
  const body = rows.map(r => [
    r.teacher?.name || '',
    r.class?.class_name + '-' + (r.class?.section || ''),
    r.subject?.name || '',
    (r.chapter || '') + ' | ' + (r.topic || ''),
    (r.week || '') + ' ' + (r.month || ''),
    (r.is_completed ? 'Completed' : 'Pending') + ' (' + (r.completed_date || r.updated_at || '').slice(0, 10) + ')',
  ].map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
  Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'syllabus-admin.csv' }).click()
}

export default function AdminSyllabus() {
  const [items, setItems] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterCls, setFilterCls] = useState('')
  const [filterSub, setFilterSub] = useState('')
  const [filterSec, setFilterSec] = useState('')
  const [filterDone, setFilterDone] = useState('')
  const [filterSections, setFilterSections] = useState([])
  const [filterSubjects, setFilterSubjects] = useState([])
  const [allTeachers, setAllTeachers] = useState([])
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [acadSections, setAcadSections] = useState([])
  const [acadSubjects, setAcadSubjects] = useState([])

  const INITIAL_FORM = {
    teacher_id: '', class_id: '', subject_id: '', section_id: '', chapter: '', topic: '',
    month: 'May', week: 'Week 1', periods: 1, learning_outcome: '',
    planned_start_date: '', planned_end_date: '', is_completed: false
  }
  const [form, setForm] = useState(INITIAL_FORM)
  const [editId, setEditId] = useState(null)

  // Fetch static data once on mount
  useEffect(() => {
    Promise.all([
      academicApi.getClasses(),
      classesApi.getSubjects(),
      teachersApi.getAll()
    ]).then(([clsRes, subRes, teaRes]) => {
      const clsList = Array.isArray(clsRes.data) ? clsRes.data : (clsRes.classes || clsRes.data?.items || [])
      setClasses(clsList)
      const subList = Array.isArray(subRes.data) ? subRes.data : (subRes.subjects || subRes.data?.subjects || [])
      setSubjects(subList)
      const teaList = teaRes.data?.items || teaRes.items || []
      setAllTeachers(teaList)
    }).catch(console.error)
  }, [])

  const fetchSyllabus = useCallback(async (showFullLoader = false) => {
    try {
      if (showFullLoader) setLoading(true)
      setDataLoading(true)
      setError(null)
      const sylRes = await syllabusApi.getAll({
        class_id: filterCls || undefined,
        subject_id: filterSub || undefined,
        section: filterSec || undefined,
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

  const loadClassData = async (classId) => {
    if (!classId) {
      setAcadSections([])
      setAcadSubjects([])
      return
    }
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

  const handleClassChange = async (classId) => {
    setForm(f => ({ ...f, class_id: classId, section_id: '', subject_id: '' }))
    await loadClassData(classId)
  }

  // Auto-date calculation logic
  useEffect(() => {
    if (!form.week || !form.month) return;

    const calculateDates = (monthStr, weekStr) => {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const mIdx = months.indexOf(monthStr);
      if (mIdx === -1) return { start: '', end: '' };

      const year = new Date().getFullYear();
      const weekNum = parseInt(weekStr.replace(/\D/g, '')) || 1;
      // Standard 7-day week chunks
      const startDay = (weekNum - 1) * 7 + 1;
      let endDay = weekNum * 7;
      const lastDayOfMonth = new Date(year, mIdx + 1, 0).getDate();
      if (startDay > lastDayOfMonth) return { start: '', end: '' };
      if (endDay > lastDayOfMonth) endDay = lastDayOfMonth;

      const fmt = (d) => `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { start: fmt(startDay), end: fmt(endDay) };
    };

    const { start, end } = calculateDates(form.month, form.week);
    if (start && end) {
      setForm(f => ({ ...f, planned_start_date: start, planned_end_date: end }));
    }
  }, [form.week, form.month]);


  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.class_id || !form.subject_id || !form.topic || !form.teacher_id) {
      alert('Teacher, Class, subject and topic are required.');
      return
    }

    try {
      setSubmitting(true)
      const selectedClass = classes.find(c => c.id === Number(form.class_id))
      const sectionObj = acadSections.find(s => s.section_id === Number(form.section_id))

      const payload = {
        ...form,
        className: selectedClass?.name,
        sectionName: sectionObj?.section_name || sectionObj?.name || sectionObj?.code
      }

      if (editId) {
        await syllabusApi.update(editId, payload)
        alert('✅ Updated Successfully')
      } else {
        await syllabusApi.create(payload)
        alert('✅ Created Successfully')
      }
      setModalOpen(false)
      setForm(INITIAL_FORM)
      setEditId(null)
      setAcadSections([])
      setAcadSubjects([])
      fetchSyllabus()
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${editId ? 'update' : 'add'} topic.`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleModalOpen = () => {
    setForm(INITIAL_FORM)
    setEditId(null)
    setAcadSections([])
    setAcadSubjects([])
    setModalOpen(true)
  }

  const handleEditOpen = async (row) => {
    setEditId(row.id)
    setForm({
      teacher_id: row.teacher_id || '',
      class_id: row.class_id || '',
      section_id: row.section_id || '',
      subject_id: row.subject_id || '',
      chapter: row.chapter || '',
      topic: row.topic || '',
      month: row.month || 'May',
      week: row.week || 'Week 1',
      periods: row.periods || 1,
      learning_outcome: row.learning_outcome || '',
      planned_start_date: row.planned_start_date ? row.planned_start_date.slice(0, 10) : '',
      planned_end_date: row.planned_end_date ? row.planned_end_date.slice(0, 10) : '',
      is_completed: row.is_completed === 1 || row.is_completed === true,
      status: row.status || (row.is_completed ? 'completed' : 'pending')
    })
    await loadClassData(row.class_id)
    setModalOpen(true)
  }

  const handleExport = async () => {
    try {
      setDataLoading(true)
      const res = await syllabusApi.exportPlan({
        class_id: filterCls || undefined,
        section_id: filterSections.find(s => (s.section_name || s.name || s.code) === filterSec)?.section_id || undefined,
        subject_id: filterSub || undefined,
        is_completed: filterDone || undefined,
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `syllabus_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Failed to export syllabus.')
    } finally {
      setDataLoading(false)
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
    } catch (err) {
      alert('Failed to download template.')
    }
  }

  const handleBulkUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) return
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', uploadFile)
      const res = await syllabusApi.bulkUpload(formData)
      alert(res.message || 'Bulk upload successful!')
      setBulkModalOpen(false)
      setUploadFile(null)
      fetchSyllabus()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload syllabus.')
    } finally {
      setUploading(false)
    }
  }

  const total = items.length
  const completed = items.filter(i => i.is_completed).length
  const pending = total - completed
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  // Chart: completion by class
  const byClass = {}
  items.forEach(i => {
    const k = `${i.class?.class_name || '?'}-${i.class?.section || ''}`
    if (!byClass[k]) byClass[k] = { total: 0, done: 0 }
    byClass[k].total++
    if (i.is_completed) byClass[k].done++
  })
  const chartData = Object.entries(byClass).map(([cls, v]) => ({
    class: cls, pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0
  }))

  const handleResetFilters = () => {
    setFilterCls('')
    setFilterSec('')
    setFilterSub('')
    setFilterDone('')
  }

  const handleDelete = async (row) => {
    const confirmMsg = `Are you sure you want to delete this topic?\n\nClass: ${row.class?.class_name}-${row.class?.section}\nTimeline: ${row.week} ${row.month}\nTopic: ${row.topic}`;
    if (window.confirm(confirmMsg)) {
      try {
        setDataLoading(true);
        await syllabusApi.delete(row.id);
        alert("✅ Deleted Successfully");
        fetchSyllabus();
      } catch (err) {
        alert("❌ Delete Failed: " + (err.response?.data?.message || err.message));
      } finally {
        setDataLoading(false);
      }
    }
  };

  const columns = [
    {
      key: 'teacher',
      label: 'Teacher',
      sortable: true,
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{r.teacher?.name || '—'}</span>
          {r.teacher?.id && <span className="text-[10px] text-slate-400 font-medium">ID: {r.teacher.id}</span>}
        </div>
      )
    },
    { key: 'class', label: 'Class', sortable: true, render: (_, r) => `${r.class?.class_name || ''}-${r.class?.section || ''}` },
    { key: 'subject', label: 'Subject', sortable: true, render: (_, r) => r.subject?.name || '—' },
    {
      key: 'chapter_topic', label: 'Chapter & Topic', sortable: true,
      render: (_, r) => (
        <div className="flex flex-col gap-0.5 max-w-[200px]">
          {r.chapter && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{r.chapter}</div>}
          <div className="text-sm font-semibold text-slate-700 leading-tight">{r.topic}</div>
        </div>
      )
    },
    {
      key: 'week_info', label: 'Timeline', sortable: true,
      render: (_, r) => (
        <div className="flex flex-col gap-0.5">
          <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
            {r.week || 'No Week Set'}
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase">
            {r.month || ''}
          </div>
        </div>
      )
    },
    {
      key: 'status_info', label: 'Status & Date', sortable: true,
      render: (_, r) => {
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
                <span className="text-slate-600">{new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
              </span>
            )}
          </div>
        )
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      textRight: true,
      render: (_, r) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => handleEditOpen(r)}
            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all active:scale-90"
            title="Edit Topic"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => handleDelete(r)}
            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all active:scale-90"
            title="Delete Topic"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  const S = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  if (loading && items.length === 0) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500" /></div>
  if (error) return (
    <div className="card p-8 text-center">
      <AlertCircle size={28} className="text-rose-500 mx-auto mb-3" />
      <p className="text-slate-600">{error}</p>
      <button onClick={() => fetchSyllabus(true)} className="btn-primary btn mt-4">Retry</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard title="Total Topics" value={total} icon={BookOpen} color="blue" />
        <StatCard title="Completed" value={completed} icon={CheckCircle} color="green" trend={pct} />
        <StatCard title="Pending" value={pending} icon={Clock} color="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <SectionHeader title="Overall Completion" subtitle={`${pct}% across all classes`} />
          <div className="mt-4">
            <ProgressBar value={completed} max={total} color={pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red'} height="h-3" showLabel />
          </div>
        </div>
        <div className="card p-6">
          <SectionHeader title="Completion by Class" subtitle="Percentage per class" />
          {chartData.length > 0
            ? <BarChartWidget data={chartData} dataKey="pct" xKey="class" color="#1a56db" height={180} name="Completion %" />
            : <p className="text-center text-sm text-slate-400 py-10">No data.</p>
          }
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <SectionHeader title="Micro Schedules" subtitle={`${items.length} records found`} />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Filter size={14} className="text-slate-400 self-center" />
          <select value={filterCls} onChange={e => setFilterCls(e.target.value)} className={S}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={filterSec} onChange={e => setFilterSec(e.target.value)} className={S} disabled={!filterCls}>
            <option value="">All Sections</option>
            {filterSections.map(s => <option key={s.mapping_id} value={s.section_name || s.name || s.code}>{s.section_name || s.name || s.code}</option>)}
          </select>
          <select value={filterSub} onChange={e => setFilterSub(e.target.value)} className={S} disabled={!filterCls}>
            <option value="">All Subjects</option>
            {(filterCls ? filterSubjects : subjects).map(s => <option key={s.mapping_id || s.id} value={s.subject_id || s.id}>{s.subject_name || s.name}</option>)}
          </select>
          <select value={filterDone} onChange={e => setFilterDone(e.target.value)} className={S}>
            <option value="">All Status</option>
            <option value="true">Completed</option>
            <option value="false">Pending</option>
          </select>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
            title="Reset All Filters"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        <div className="relative">
          {dataLoading && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
              <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
          )}
          <DataTable
            columns={columns}
            rows={items}
            emptyMessage="No syllabus topics found."
            getRowClassName={(r) => r.is_completed ? "bg-emerald-50/50 hover:bg-emerald-100/50" : "bg-white hover:bg-slate-50"}
          />
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Micro Schedule" : "Add Micro Schedule"} size="lg">
        <div className="p-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assigned Teacher *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  value={form.teacher_id}
                  onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                  required
                >
                  <option value="">Select teacher…</option>
                  {allTeachers.map(t => <option key={t.id} value={t.id}>{t.name} (ID: {t.id})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Class *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  value={form.class_id}
                  onChange={e => handleClassChange(e.target.value)}
                  required
                >
                  <option value="">Select class…</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Section *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={form.section_id || ''}
                  onChange={e => setForm(f => ({ ...f, section_id: e.target.value }))}
                  required
                  disabled={!form.class_id}
                >
                  <option value="">Select section…</option>
                  {acadSections.map(s => <option key={s.mapping_id || s.id} value={s.section_id || s.id}>{s.section_name || s.name || s.code}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Subject *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={form.subject_id}
                  onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                  required
                  disabled={!form.class_id}
                >
                  <option value="">Select subject…</option>
                  {acadSubjects.map(s => <option key={s.mapping_id || s.id} value={s.subject_id || s.id}>{s.subject_name || s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Month *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                  required
                >
                  {MONTHS.filter(m => m !== 'All').map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Week *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  value={form.week}
                  onChange={e => setForm(f => ({ ...f, week: e.target.value }))}
                  required
                >
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className={editId ? "sm:col-span-2" : "sm:col-span-1"}>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Chapter & Topic *</label>
                <input
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. Linear Equations"
                  required
                />
              </div>
              {!editId && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Periods Required *</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    value={form.periods}
                    onChange={e => setForm(f => ({ ...f, periods: e.target.value }))}
                    min="1"
                    required
                  />
                </div>
              )}
            </div>

            {editId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Periods Required *</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    value={form.periods}
                    onChange={e => setForm(f => ({ ...f, periods: e.target.value }))}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Status *</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                    value={form.status || 'pending'}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value, is_completed: e.target.value === 'completed' }))}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Learning Outcome</label>
              <textarea
                className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-500/20 transition-all min-h-[100px] resize-none"
                value={form.learning_outcome}
                onChange={e => setForm(f => ({ ...f, learning_outcome: e.target.value }))}
                placeholder="What will students learn in this topic?"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : (editId ? 'Save Changes' : 'Add to Schedule')}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}

function Info({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  )
}
