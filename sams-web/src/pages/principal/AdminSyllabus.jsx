import { useState } from 'react'
import { BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { StatCard, SectionHeader, FilterChips, StatusBadge, ProgressBar } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { SCHOOL_SYLLABUS } from '../../data/dummyData'

const ALL_CLASSES   = ['All','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10']
const ALL_SUBJECTS  = ['All','Mathematics','Science','English','Hindi','Social Studies']

const CHART_DATA = [
  { name:'Priya S.',  pct:58 },{ name:'Anjali M.', pct:63 },{ name:'Ramesh P.', pct:60 },
  { name:'Sunita J.', pct:80 },{ name:'Vikram S.',  pct:40 },
]

export default function AdminSyllabus() {
  const [cls, setCls]  = useState('All')
  const [sub, setSub]  = useState('All')

  const filtered = SCHOOL_SYLLABUS.filter(row =>
    (cls === 'All' || row.class.startsWith(cls)) &&
    (sub === 'All' || row.subject === sub)
  )

  const avgPct = Math.round(filtered.reduce((a,r) => a + r.pct, 0) / (filtered.length || 1))

  const columns = [
    { key:'teacher', label:'Teacher',  sortable:true },
    { key:'subject', label:'Subject',  sortable:true },
    { key:'class',   label:'Class',    sortable:true },
    { key:'done',    label:'Done'                    },
    { key:'pct',     label:'Completion %', sortable:true,
      render:(v, row) => (
        <div className="flex items-center gap-3 min-w-[100px]">
          <ProgressBar value={v} max={100} color="auto" showLabel={false} height="h-1.5" />
          <span className={`text-xs font-bold w-8 ${v>=75?'text-emerald-600':v>=50?'text-amber-600':'text-rose-600'}`}>{v}%</span>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="School Avg"  value={`${avgPct}%`}                             icon={BookOpen}     color="blue"   trend={avgPct} />
        <StatCard title="On Track"    value={SCHOOL_SYLLABUS.filter(r=>r.pct>=75).length} icon={CheckCircle} color="green" />
        <StatCard title="At Risk"     value={SCHOOL_SYLLABUS.filter(r=>r.pct<50).length}  icon={AlertCircle} color="red"   />
        <StatCard title="In Progress" value={SCHOOL_SYLLABUS.filter(r=>r.pct>=50&&r.pct<75).length} icon={Clock} color="amber" />
      </div>

      {/* Chart */}
      <div className="card p-6">
        <SectionHeader title="Teacher-wise Completion" subtitle="Average across all classes" />
        <BarChartWidget data={CHART_DATA} dataKey="pct" xKey="name" color="#1a56db" height={200} name="Completion %" />
      </div>

      {/* Filters + Table */}
      <div className="card p-6">
        <SectionHeader title="Syllabus Records" subtitle={`${filtered.length} records`} />

        <div className="space-y-3 mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filter by Class</p>
            <FilterChips options={ALL_CLASSES} value={cls} onChange={setCls} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filter by Subject</p>
            <FilterChips options={ALL_SUBJECTS} value={sub} onChange={setSub} />
          </div>
        </div>

        <DataTable columns={columns} rows={filtered} emptyMessage="No records match the selected filters." />
      </div>
    </div>
  )
}
