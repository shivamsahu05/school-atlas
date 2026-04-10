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

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Topics"    value={SYLLABUS_STATS.total}     icon={BookOpen}      color="blue" />
        <StatCard title="Completed"       value={SYLLABUS_STATS.completed} icon={CheckCircle}   color="green" />
        <StatCard title="Pending"         value={SYLLABUS_STATS.pending}   icon={Clock}         color="amber" />
        <StatCard title="Completion %"
          value={`${Math.round(SYLLABUS_STATS.completed/SYLLABUS_STATS.total*100)}%`}
          icon={BookOpen} color="teal"
          trend={Math.round(SYLLABUS_STATS.completed/SYLLABUS_STATS.total*100)}
        />
      </div>

      {/* Progress bar */}
      <div className="card p-6">
        <SectionHeader title="Overall Completion" subtitle="Mathematics · Grade 8-A" />
        <ProgressBar value={SYLLABUS_STATS.completed} max={SYLLABUS_STATS.total} color="blue" height="h-3" />
      </div>

      {/* Chart */}
      <div className="card p-6">
        <SectionHeader title="Chapter-wise Completion" subtitle="100% = Completed, 0% = Pending" />
        <BarChartWidget
          data={CHART_DATA} dataKey="pct" xKey="ch"
          color="#1a56db" height={200} name="Completion %"
        />
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
            <button className="btn-secondary btn btn-sm gap-1.5">
              <Upload size={13}/> Upload
            </button>
          </div>
        </div>
        <DataTable columns={columns} rows={filtered} />
      </div>
    </div>
  )
}
