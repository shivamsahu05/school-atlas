import { useState } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { StatCard, SectionHeader, FilterChips, StatusBadge } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { LODonut, MultiBarChart } from '../../components/charts/index.jsx'
import { LO_ENTRIES, LO_SUMMARY } from '../../data/dummyData'

export default function TeacherLO() {
  const [filter, setFilter] = useState('All')

  const filtered = filter === 'All'
    ? LO_ENTRIES
    : LO_ENTRIES.filter(e => e.status === filter)

  const chartData = LO_ENTRIES.slice(0, 8).map(e => ({
    name: e.student.split(' ')[0],
    'Teacher Score': e.teacherScore,
    'Principal Score': e.principalScore,
  }))

  const columns = [
    { key:'student',        label:'Student',         sortable:true  },
    { key:'roll',           label:'Roll No.',                        },
    { key:'topic',          label:'Topic',                           },
    { key:'teacherScore',   label:'T. Score',  sortable:true,
      render:(v) => <span className="font-semibold text-brand-600">{v}</span> },
    { key:'principalScore', label:'P. Score',  sortable:true,
      render:(v) => <span className="font-semibold text-slate-700">{v}</span> },
    { key:'status',         label:'Status',
      render:(v) => <StatusBadge status={v} /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Approaching"
          value={LO_SUMMARY.approaching}
          icon={TrendingDown} color="amber"
          trend={Math.round(LO_SUMMARY.approaching / LO_ENTRIES.length * 100)} />
        <StatCard title="Meeting"
          value={LO_SUMMARY.meeting}
          icon={Minus} color="blue"
          trend={Math.round(LO_SUMMARY.meeting / LO_ENTRIES.length * 100)} />
        <StatCard title="Exceeding"
          value={LO_SUMMARY.exceeding}
          icon={TrendingUp} color="green"
          trend={Math.round(LO_SUMMARY.exceeding / LO_ENTRIES.length * 100)} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <SectionHeader title="LO Distribution" subtitle="Current topic: Linear Equations" />
          <LODonut {...LO_SUMMARY} height={220} />
        </div>

        <div className="card p-6">
          <SectionHeader title="Teacher vs Principal Scores" subtitle="Top 8 students" />
          <MultiBarChart
            data={chartData}
            bars={[{key:'Teacher Score',label:'Teacher'},{key:'Principal Score',label:'Principal'}]}
            xKey="name"
            height={220}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <SectionHeader title="Student LO Records" subtitle={`${filtered.length} students`} />
          <FilterChips
            options={['All','Approaching','Meeting','Exceeding']}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <DataTable columns={columns} rows={filtered} />
      </div>
    </div>
  )
}
