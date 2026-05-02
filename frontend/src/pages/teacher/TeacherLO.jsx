import { useState, useEffect, useCallback } from 'react'
import { Brain, TrendingUp, Download, Plus, Loader2, AlertTriangle } from 'lucide-react'
import { StatCard, SectionHeader, FilterChips, StatusBadge, Modal } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { LODonut, MultiBarChart } from '../../components/charts/index.jsx'
import { loApi, classesApi } from '../../api'

function downloadCSV(rows) {
  const safeRows = Array.isArray(rows) ? rows : []
  const cols = ['teacher','class','subject','topic','teacherScore','principalScore','status','month']
  const header = cols.join(',')
  const body   = safeRows.map(r => cols.map(c => `"${r[c] ?? ''}"`).join(',')).join('\n')
  const blob   = new Blob([header + '\n' + body], { type:'text/csv' })
  const a      = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download:'lo-entries.csv' })
  a.click()
}

export default function TeacherLO() {
  const [entries,    setEntries]    = useState([])
  const [summary,    setSummary]    = useState({ approaching:0, meeting:0, exceeding:0 })
  const [classes,    setClasses]    = useState([]) // Original filter classes
  const [assignedClasses, setAssignedClasses] = useState([]) // For Add Modal
  const [topics,     setTopics]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [filter,     setFilter]     = useState('All')
  const [filterCls,  setFilterCls]  = useState('')
  const [filterMon,  setFilterMon]  = useState('')
  const [modalOpen,  setModalOpen]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ class_id:'', subject_id:'', topic:'', teacher_score:'', month:'', week:'', status:'Meeting', section:'' })
  const [intelData, setIntelData] = useState([])
  const [intelLoading, setIntelLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { intelligenceApi } = await import('../../api')
      const [loRes, clsRes, intelRes, assignRes] = await Promise.all([
        loApi.getAll({
          class_id:   filterCls || undefined,
          month:      filterMon || undefined,
        }),
        classesApi.getAll(),
        intelligenceApi.getTeacherDashboard().catch(() => ({ data: null })),
        loApi.getAssignments()
      ])

      // ── New Intelligence Source of Truth ──────────────────────────────────
      const loIntel = intelRes?.data?.lo || { approaching: 0, meeting: 0, exceeding: 0 }
      setSummary(loIntel)

      setIntelLoading(true)
      try {
        const intel = await intelligenceApi.getLOIntelligence()
        setIntelData(intel.data || [])
      } catch (e) { console.error(e) }
      setIntelLoading(false)

      // SAFE API RESPONSE HANDLING
      const safeData = Array.isArray(loRes?.data) ? loRes.data : (Array.isArray(loRes?.data?.data) ? loRes.data.data : [])
      console.log("[LO FRONTEND] API response:", safeData)
      setEntries(safeData)

      const rawCls = clsRes?.data?.data || clsRes?.data || clsRes?.classes || []
      setClasses(Array.isArray(rawCls) ? rawCls : [])
      setAssignedClasses(assignRes?.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [filterCls, filterMon])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await loApi.create(form)
      setModalOpen(false)
      setForm({ class_id:'', subject_id:'', topic:'', teacher_score:'', month:'', week:'', status:'Meeting' })
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add entry.')
    } finally {
      setSubmitting(false)
    }
  }

  // SAFE ARRAY WRAPPERS
  const safeEntries = Array.isArray(entries) ? entries : []
  const safeClasses = Array.isArray(classes) ? classes : []

  // Simplify filtering - mostly handled by backend
  const filtered = safeEntries.filter(e => {
    if (filter !== 'All' && e.status !== filter) return false
    return true
  })

  // Build T vs P chart from top 8 entries
  const chartData = filtered.slice(0, 8).map(e => ({
    name:             `${e.class || 'Class'}-${e.section || ''}`,
    'Teacher Score':  Number(e.teacherScore   ?? 0),
    'Principal Score':Number(e.principalScore ?? 0),
  }))

  const columns = [
    { key:'class',           label:'Class',      sortable:true,
      render: (_,r) => `${r.class || ''}${r.section ? '-'+r.section : ''}` },
    { key:'subject',         label:'Subject',    sortable:true,
      render: (_,r) => r.subject || '—' },
    { key:'topic',           label:'Topic',      sortable:true },
    { key:'week',            label:'Week',       sortable:true },
    { key:'teacherScore',   label:'T Score',    sortable:true,
      render: v => <span className="font-semibold text-brand-600">{v !== null && v !== undefined ? v : 'Not Submitted'}</span> },
    { key:'principalScore', label:'P Score',    sortable:true,
      render: v => <span className="font-semibold text-emerald-600">{v !== null && v !== undefined ? v : 'Not Awarded'}</span> },
    { key:'month',           label:'Month',      sortable:true },
  ]

  const SELECT = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>
  if (error)   return (
    <div className="card p-8 text-center">
      <AlertTriangle size={28} className="text-rose-500 mx-auto mb-3"/>
      <p className="text-slate-600">{error}</p>
      <button onClick={fetchData} className="btn-primary btn mt-4">Retry</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Approaching" value={summary.approaching || 0} icon={AlertTriangle} color="amber"/>
        <StatCard title="Meeting"     value={summary.meeting     || 0} icon={Brain}         color="blue"/>
        <StatCard title="Exceeding"   value={summary.exceeding   || 0} icon={TrendingUp}    color="green"/>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <SectionHeader title="LO Distribution" subtitle="My overall student distribution"/>
          <LODonut approaching={summary.approaching} meeting={summary.meeting} exceeding={summary.exceeding} height={220}/>
        </div>

        <div className="card p-6">
          <SectionHeader title="Teacher vs Principal Scores" subtitle="Comparison by class"/>
          <div className="flex gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-500 inline-block"/>
              <span className="text-xs text-slate-500">Teacher</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"/>
              <span className="text-xs text-slate-500">Principal</span>
            </div>
          </div>
          {chartData.length > 0
            ? <MultiBarChart
                data={chartData}
                bars={[{key:'Teacher Score',label:'Teacher'},{key:'Principal Score',label:'Principal'}]}
                xKey="name"
                height={200}
              />
            : <p className="text-center text-sm text-slate-400 py-12">No comparison data yet.</p>
          }
        </div>
      </div>

      {/* Intelligence Engine: Student Grouping */}
      <div className="card p-6 border-brand-100 bg-brand-50/10">
        <SectionHeader 
          title="Academic Intelligence: Student Grouping" 
          subtitle="Real-time analysis of student performance levels per topic" 
        />
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {intelLoading ? (
            <div className="col-span-full py-10 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-brand-500" size={24} />
              <span className="text-xs font-bold text-slate-400">Computing Intelligence...</span>
            </div>
          ) : intelData.length === 0 ? (
             <p className="col-span-full text-center py-10 text-sm text-slate-400 italic">No LO intelligence data found.</p>
          ) : intelData.map((item, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs font-black text-brand-600 uppercase tracking-widest mb-1">{item.subject}</p>
              <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-3">{item.topic}</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-rose-500">Approaching</span>
                  <span>{item.approaching} students</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: `${(item.approaching / (item.approaching + item.meeting + item.exceeding)) * 100}%` }} />
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-brand-500">Meeting</span>
                  <span>{item.meeting} students</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-brand-500 h-full" style={{ width: `${(item.meeting / (item.approaching + item.meeting + item.exceeding)) * 100}%` }} />
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-emerald-500">Exceeding</span>
                  <span>{item.exceeding} students</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(item.exceeding / (item.approaching + item.meeting + item.exceeding)) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <SectionHeader
            title="LO Records"
            subtitle={
              safeEntries.length > 0
                ? `${filtered.length} of ${safeEntries.length} entries${filtered.length < safeEntries.length ? ' (filtered)' : ''}`
                : '0 entries'
            }
          />
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filters */}
            <select value={filterCls} onChange={e => setFilterCls(e.target.value)} className={SELECT}>
              <option value="">All Classes</option>
              {safeClasses.map(c => <option key={c.id} value={c.id}>{c.class_name}-{c.section}</option>)}
            </select>
            <select value={filterMon} onChange={e => setFilterMon(e.target.value)} className={SELECT}>
              <option value="">All Months</option>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
            <FilterChips
              options={['All','Approaching','Meeting','Exceeding']}
              value={filter}
              onChange={setFilter}
            />
            <button onClick={() => downloadCSV(filtered)} className="btn-secondary btn btn-sm gap-1.5">
              <Download size={13}/> Export
            </button>
            <button onClick={() => setModalOpen(true)} className="btn-primary btn btn-sm gap-1.5">
              <Plus size={13}/> Add
            </button>
          </div>
        </div>

        {/* RULE: Only show true empty state if backend returned 0 rows */}
        {safeEntries.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">No LO entries found. Ask admin to award LO scores.</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400 mb-3">No entries match the current filters.</p>
            <button
              onClick={() => { setFilter('All'); setFilterCls(''); setFilterMon('') }}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Clear all filters ({safeEntries.length} total records)
            </button>
          </div>
        ) : (
          <DataTable columns={columns} rows={filtered} emptyMessage="No LO entries match your filters."/>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add LO Entry">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Assigned Class *</label>
              <select className="select" value={form.class_id}
                onChange={async e => {
                  const cId = e.target.value
                  const assign = assignedClasses.find(a => String(a.class_id) === String(cId))
                  console.log("Selected Class:", cId)
                  setForm(f=>({...f, class_id:cId, subject_id:assign?.subject_id||'', section:assign?.section||''}))
                  if (cId && assign) {
                    const topicsRes = await loApi.getTopics(cId, assign.subject_id)
                    console.log("Topics Loaded:", topicsRes.data)
                    setTopics(topicsRes.data || [])
                  } else {
                    setTopics([])
                  }
                }} required>
                <option value="">Select assigned class…</option>
                {assignedClasses.map((c,i) => (
                   <option key={i} value={c.class_id}>{c.class_name}-{c.section} ({c.subject_name})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Month *</label>
              <select className="select" value={form.month}
                onChange={e => setForm(f=>({...f,month:e.target.value}))} required>
                <option value="">Select month…</option>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Topic *</label>
              <select className="select" value={form.topic}
                onChange={e => setForm(f=>({...f,topic:e.target.value}))} 
                disabled={!form.class_id} required>
                <option value="">{form.class_id ? 'Select topic from syllabus…' : 'Select class first'}</option>
                {topics.map((t,i) => <option key={i} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Week *</label>
              <select className="select" value={form.week}
                onChange={e => setForm(f=>({...f,week:e.target.value}))} required>
                <option value="">Select week…</option>
                {[1,2,3,4,5].map(w => <option key={w} value={`Week ${w}`}>Week {w}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Teacher Score (0–100) *</label>
              <input className="input" type="number" min={0} max={100} placeholder="e.g. 78"
                value={form.teacher_score} onChange={e => setForm(f=>({...f,teacher_score:e.target.value}))} required/>
            </div>
            <div>
              <label className="label">Subject (Auto)</label>
              <input className="input bg-slate-50" value={assignedClasses.find(a => String(a.class_id) === String(form.class_id))?.subject_name || ''} readOnly disabled />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary btn flex-1 justify-center disabled:opacity-60">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2"/> : null} Save LO Assessment
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
