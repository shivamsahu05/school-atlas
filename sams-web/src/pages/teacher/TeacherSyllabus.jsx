<<<<<<< HEAD
import { useState, useMemo } from 'react'
import { BookOpen, CheckCircle, Clock, Upload, Inbox, AlertCircle, Save } from 'lucide-react'
import { StatCard, SectionHeader, FilterChips, StatusBadge, ProgressBar, EmptyState, Modal, DataTable } from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { SYLLABUS_ITEMS, SYLLABUS_STATS, PERMISSIONS } from '../../data/dummyData'
import clsx from 'clsx'

const getWeekLabel = (dateStr) => {
  if (!dateStr) return '-'
  const day = new Date(dateStr).getDate()
  if (day <= 7)  return 'Week 1 (1–7)'
  if (day <= 14) return 'Week 2 (8–14)'
  if (day <= 21) return 'Week 3 (15–21)'
  if (day <= 28) return 'Week 4 (22–28)'
  return 'Week 5 (29–31)'
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const getMonthFromDate = (dateStr) => {
  if (!dateStr) return ''
  const [, month] = dateStr.split('-')
  return MONTHS[parseInt(month, 10) - 1] || ''
}

export default function TeacherSyllabus() {
  const [filter, setFilter] = useState('All')
  const [filterMonth, setFilterMonth] = useState('All')
  const [filterWeek, setFilterWeek] = useState('All')
  const [items, setItems] = useState(() =>
    (SYLLABUS_ITEMS || []).map(s => ({
      ...s,
      status: s.status || (s.completed ? 'completed' : 'pending'),
      unit: s.unit || s.chapter || '-'
    }))
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    class: 'Grade 8-A',
    subject: 'Mathematics',
    unit: '',
    topic: '',
    plannedDate: ''
  })
  const [error, setError] = useState('')

  const uploadPerm = (PERMISSIONS || []).find(p =>
    p.action === 'Upload Syllabus' &&
    p.class === formData.class &&
    p.subject === formData.subject
  )
  const isExpired = (uploadPerm?.daysLeft ?? 0) <= 0

  const { filtered, chartData, stats } = useMemo(() => {
    const list = items ?? []

    const filteredItems = filter === 'Completed'
      ? list.filter(s => s?.status === 'completed')
      : filter === 'Pending'
      ? list.filter(s => s?.status === 'pending')
      : list

    const weeksMap = list.reduce((acc, row) => {
      const dateStr = row?.plannedDate || row?.completedDate
      const rowMonth = getMonthFromDate(dateStr)
      if (filterMonth !== 'All' && rowMonth !== filterMonth) return acc
      const wk = getWeekLabel(dateStr)
      if (filterWeek !== 'All' && wk !== filterWeek) return acc
      if (!acc[wk]) acc[wk] = { wk, total: 0, done: 0 }
      acc[wk].total += 1
      if (row?.status === 'completed') acc[wk].done += 1
      return acc
    }, {})

    const cData = Object.values(weeksMap).map(w => ({
      wk: (w?.wk ?? '-').replace('Week ', 'W').split(' (')[0],
      pct: Math.round(((w?.done ?? 0) / (w?.total || 1)) * 100)
    }))

    const total = list.length
    const completed = list.filter(l => l?.status === 'completed').length
    const pending = total - completed

    return { filtered: filteredItems, chartData: cData, stats: { total, completed, pending } }
  }, [items, filter, filterMonth, filterWeek])

  const handleUpload = () => {
    setError('')
    if (isExpired) return

    if (!formData.unit || !formData.topic || !formData.plannedDate) {
      setError('All fields are required.')
      return
    }
    if (formData.topic.length < 3) {
      setError('Topic must be at least 3 characters.')
      return
    }
    const today = new Date().toISOString().split('T')[0]
    if (formData.plannedDate < today) {
      setError('Planned date cannot be in the past.')
      return
    }

    const newItem = {
      id: `SYL${Date.now()}`,
      ...formData,
      status: 'pending',
      completedDate: null
    }

    setItems(prev => [newItem, ...prev])
    setIsModalOpen(false)
    setFormData({ ...formData, unit: '', topic: '', plannedDate: '' })
  }

  const columns = [
    { key:'week', label:'Week', render:(v, row) => <span className="text-slate-400 font-medium">{getWeekLabel(row.plannedDate)}</span> },
    { key:'unit', label:'Unit', sortable:true },
    { key:'topic', label:'Topic', sortable:true },
    { key:'plannedDate', label:'Planned Date' },
    { key:'status', label:'Status', render:(v) => <StatusBadge status={v === 'completed' ? 'Completed' : 'Pending'} /> },
  ]

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  const WEEK_OPTIONS = ['Week 1 (1–7)', 'Week 2 (8–14)', 'Week 3 (15–21)', 'Week 4 (22–28)', 'Week 5 (29–31)']

=======
import { useState } from 'react'
import { BookOpen, CheckCircle, Clock, Upload } from 'lucide-react'
import { StatCard, SectionHeader, FilterChips, StatusBadge, ProgressBar } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { SYLLABUS_ITEMS, SYLLABUS_STATS } from '../../data/dummyData'

const CHART_DATA = [
  { ch:'Ch.1', pct:100 },{ ch:'Ch.2', pct:100 },{ ch:'Ch.3', pct:100 },
  { ch:'Ch.4', pct:100 },{ ch:'Ch.5', pct:100 },{ ch:'Ch.6', pct:0 },
  { ch:'Ch.7', pct:0 },{ ch:'Ch.8', pct:0 },{ ch:'Ch.9', pct:0 },{ ch:'Ch.10', pct:0 },
]

export default function TeacherSyllabus() {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'Completed'
    ? SYLLABUS_ITEMS.filter(s => s.completed)
    : filter === 'Pending'
    ? SYLLABUS_ITEMS.filter(s => !s.completed)
    : SYLLABUS_ITEMS

  const columns = [
    { key:'topic',    label:'Topic',    sortable:true  },
    { key:'chapter',  label:'Chapter',  sortable:true  },
    { key:'plannedDate', label:'Planned Date' },
    { key:'completedDate', label:'Completed' },
    { key:'completed', label:'Status', render:(v) => <StatusBadge status={v ? 'Completed' : 'Pending'} /> },
  ]

>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats */}
<<<<<<< HEAD
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Topics"    value={stats.total}     icon={BookOpen}    color="blue" />
        <StatCard title="Completed"       value={stats.completed} icon={CheckCircle} color="green" />
        <StatCard title="Pending"         value={stats.pending}   icon={Clock}       color="amber" />
        <StatCard title="Completion %"
          value={`${completionPct}%`}
          icon={BookOpen} color="teal"
          trend={completionPct}
=======
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Topics"    value={SYLLABUS_STATS.total}     icon={BookOpen}      color="blue" />
        <StatCard title="Completed"       value={SYLLABUS_STATS.completed} icon={CheckCircle}   color="green" />
        <StatCard title="Pending"         value={SYLLABUS_STATS.pending}   icon={Clock}         color="amber" />
        <StatCard title="Completion %"
          value={`${Math.round(SYLLABUS_STATS.completed/SYLLABUS_STATS.total*100)}%`}
          icon={BookOpen} color="teal"
          trend={Math.round(SYLLABUS_STATS.completed/SYLLABUS_STATS.total*100)}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
        />
      </div>

      {/* Progress bar */}
      <div className="card p-6">
<<<<<<< HEAD
        <SectionHeader title="Overall Completion" subtitle={`${formData.subject} · ${formData.class}`} />
        <ProgressBar value={stats.completed} max={stats.total} color="blue" height="h-3" />
=======
        <SectionHeader title="Overall Completion" subtitle="Mathematics · Grade 8-A" />
        <ProgressBar value={SYLLABUS_STATS.completed} max={SYLLABUS_STATS.total} color="blue" height="h-3" />
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
      </div>

      {/* Chart */}
      <div className="card p-6">
<<<<<<< HEAD
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <SectionHeader title="Week-wise Completion" subtitle="Progress overview" />
          <div className="flex items-center gap-2">
            <select
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setFilterWeek('All') }}
              className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300 w-36"
            >
              <option value="All">All Months</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={filterWeek}
              onChange={e => setFilterWeek(e.target.value)}
              disabled={filterMonth === 'All'}
              className="border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300 w-44 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="All">All Weeks</option>
              {WEEK_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
            <BookOpen size={28} className="text-slate-300" />
            <p className="text-sm">No data for the selected month/week.</p>
          </div>
        ) : (
          <>
            <BarChartWidget
              data={chartData} dataKey="pct" xKey="wk"
              color="#1a56db" height={200} name="Completion %"
            />
            {filterWeek !== 'All' && chartData[0] && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">{filterWeek} Completion</p>
                  <span className="text-sm font-bold text-brand-600">{chartData[0].pct}%</span>
                </div>
                <ProgressBar value={chartData[0].pct} max={100} color="teal" height="h-2" />
              </div>
            )}
          </>
        )}
=======
        <SectionHeader title="Chapter-wise Completion" subtitle="100% = Completed, 0% = Pending" />
        <BarChartWidget
          data={CHART_DATA} dataKey="pct" xKey="ch"
          color="#1a56db" height={200} name="Completion %"
        />
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <SectionHeader title="Topic List" subtitle={`Showing ${filtered.length} topics`} />
          <div className="flex items-center gap-3">
            <FilterChips
              options={['All','Completed','Pending']}
              value={filter}
              onChange={setFilter}
            />
<<<<<<< HEAD
            <button
              onClick={() => setIsModalOpen(true)}
              className={clsx(
                "btn gap-1.5 btn-sm",
                isExpired ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "btn-secondary"
              )}
            >
=======
            <button className="btn-secondary btn btn-sm gap-1.5">
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
              <Upload size={13}/> Upload
            </button>
          </div>
        </div>
        <DataTable columns={columns} rows={filtered} />
      </div>
<<<<<<< HEAD

      {/* Upload Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Syllabus Topic"
      >
        <div className="space-y-4">
          {isExpired && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 mb-2 animate-shake">
              <AlertCircle size={16} />
              <p className="text-xs font-bold">Permission expired for this class/subject.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Class</label>
              <select
                value={formData.class}
                onChange={e => setFormData({...formData, class: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm text-slate-700"
              >
                <option>Grade 8-A</option>
                <option>Grade 9-B</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Subject</label>
              <select
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm text-slate-700"
              >
                <option>Mathematics</option>
                <option>Science</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Unit / Chapter</label>
            <input
              type="text"
              placeholder="e.g. Chapter 4"
              value={formData.unit}
              onChange={e => setFormData({...formData, unit: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Topic Name</label>
            <input
              type="text"
              placeholder="e.g. Quadratic Equations"
              value={formData.topic}
              onChange={e => setFormData({...formData, topic: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Planned Date</label>
            <input
              type="date"
              value={formData.plannedDate}
              onChange={e => setFormData({...formData, plannedDate: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm text-slate-700"
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-medium text-center">{error}</p>}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isExpired}
              className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              <Save size={16} /> Save Topic
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
=======
    </div>
  )
}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
