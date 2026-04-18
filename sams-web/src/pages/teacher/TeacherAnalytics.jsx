import { useState } from 'react'
<<<<<<< HEAD
import { BarChart2, Users, Star, Eye, Award, BookOpen, Brain, MessageSquare, Globe, TrendingUp, HandMetal } from 'lucide-react'
import { StatCard, SectionHeader } from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { ProgressBar } from '../../components/ui/index.jsx'
import { TEACHER_PERFORMANCE, OBSERVATIONS, TEACHER } from '../../data/dummyData'

// Find current teacher's performance
const myPerf = TEACHER_PERFORMANCE.find(p => p.teacher.id === TEACHER.id) || TEACHER_PERFORMANCE[0]
const myObs  = (OBSERVATIONS ?? []).filter(o => o?.teacher === 'Priya Sharma')

// Monthly trend data (teacher's own metrics over months)
const MONTHLY_TREND = [
  { month: 'Apr', score: 78 },
  { month: 'May', score: 80 },
  { month: 'Jun', score: 76 },
  { month: 'Jul', score: 82 },
  { month: 'Aug', score: 85 },
  { month: 'Sep', score: 83 },
  { month: 'Oct', score: 87 },
  { month: 'Nov', score: 84 },
  { month: 'Dec', score: 86 },
  { month: 'Jan', score: 88 },
]

// Parameter breakdown for the teacher
const PARAM_DATA = [
  { param: 'Syllabus Completion', score: myPerf.syllabus, weight: '15%', icon: BookOpen, color: 'blue' },
  { param: 'LO Achievement',     score: myPerf.lo,        weight: '15%', icon: Brain,    color: 'amber' },
  { param: 'Observation Score',   score: myPerf.observation, weight: '25%', icon: Eye,   color: 'green' },
  { param: 'Participate Score',   score: myPerf.participate || 86, weight: '10%', icon: HandMetal, color: 'rose' },
  { param: 'Other Parameters',    score: myPerf.other,     weight: '20%', icon: Award,   color: 'teal' },
  { param: 'Language Proficiency', score: myPerf.language, weight: '15%', icon: Globe,   color: 'purple' },
]

// Chart data for radar-like bar comparison
const PARAM_CHART = PARAM_DATA.map(p => ({ name: p.param.split(' ')[0], score: p.score }))

export default function TeacherAnalytics() {
  const overall = Math.round(myPerf.overall)
  const overallColor = overall >= 85 ? 'green' : overall >= 70 ? 'amber' : 'red'
  const grade = overall >= 90 ? 'A+' : overall >= 85 ? 'A' : overall >= 80 ? 'B+' : overall >= 75 ? 'B' : overall >= 70 ? 'C+' : 'C'
=======
import { BarChart2, Users, Star, Eye } from 'lucide-react'
import { StatCard, SectionHeader, Tabs } from '../../components/ui/index.jsx'
import { BarChartWidget, LineChartWidget } from '../../components/charts/index.jsx'
import { ProgressBar } from '../../components/ui/index.jsx'
import { ATTENDANCE_CHART, MARKS_CHART, LO_CHART, OBSERVATIONS } from '../../data/dummyData'

const TABS = [
  { value:'attendance', label:'Attendance' },
  { value:'marks',      label:'Marks'      },
  { value:'lo',         label:'LO Score'   },
]

const DETAIL_ROWS = [
  { metric:'Attendance',     score:'91%', classAvg:'88%', status:'Above Avg', pct:91 },
  { metric:'Unit Test 1',    score:'78%', classAvg:'72%', status:'Above Avg', pct:78 },
  { metric:'Mid-Term',       score:'80%', classAvg:'75%', status:'Above Avg', pct:80 },
  { metric:'Unit Test 2',    score:'82%', classAvg:'77%', status:'Above Avg', pct:82 },
  { metric:'LO Achievement', score:'84%', classAvg:'79%', status:'Above Avg', pct:84 },
  { metric:'Homework Sub.',  score:'88%', classAvg:'84%', status:'Above Avg', pct:88 },
]

export default function TeacherAnalytics() {
  const [tab, setTab] = useState('attendance')
  const myObs = OBSERVATIONS.filter(o => o.teacher === 'Priya Sharma')

  const chartProps = {
    attendance: { data:ATTENDANCE_CHART, dataKey:'pct', xKey:'month', color:'#1a56db', name:'Attendance %' },
    marks:      { data:MARKS_CHART,      dataKey:'pct', xKey:'exam',  color:'#10b981', name:'Marks %'      },
    lo:         { data:LO_CHART,         dataKey:'pct', xKey:'chapter',color:'#f59e0b',name:'LO Score %'    },
  }
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

  return (
    <div className="space-y-6 animate-fade-in">

<<<<<<< HEAD
      {/* Overall Performance KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Score" value={`${overall}%`} icon={Award} color={overallColor} trend={overall} />
        <StatCard title="Grade" value={grade} icon={Star} color="blue" />
        <StatCard title="Observations" value={myObs.length} icon={Eye} color="teal" />
        <StatCard title="Trend" value="+4.2%" icon={TrendingUp} color="green" />
      </div>

      {/* Performance Breakdown */}
      <div className="card p-6">
        <SectionHeader title="Performance Breakdown" subtitle="Weighted parameter scores contributing to overall rating" />
        <div className="space-y-4 mt-4">
          {PARAM_DATA.map(p => {
            const barColor = p.score >= 85 ? 'green' : p.score >= 70 ? 'amber' : 'red'
            return (
              <div key={p.param} className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-${p.color}-100 text-${p.color}-600`}>
                  <p.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-700">{p.param}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-medium">Weight: {p.weight}</span>
                      <span className="text-sm font-bold text-slate-800">{p.score}%</span>
                    </div>
                  </div>
                  <ProgressBar value={p.score} max={100} color={barColor} showLabel={false} height="h-2" />
=======
      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Avg Attendance" value="91%" icon={Users}    color="blue"   trend={91} />
        <StatCard title="Avg Marks"      value="81%" icon={BarChart2} color="green"  trend={81} />
        <StatCard title="LO Score"       value="84%" icon={Star}      color="amber"  trend={84} />
      </div>

      {/* Tabbed chart */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <SectionHeader title="Performance Trend" subtitle="Grade 8-A" />
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <BarChartWidget
          {...chartProps[tab]}
          height={220}
        />
      </div>

      {/* Detail table */}
      <div className="card p-6">
        <SectionHeader title="Detailed Statistics" subtitle="Subject-wise breakdown" />
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="tbl-head">
                {['Metric','Score','Class Avg','Trend','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {DETAIL_ROWS.map(row => (
                <tr key={row.metric} className="tbl-row">
                  <td className="tbl-cell font-medium">{row.metric}</td>
                  <td className="tbl-cell font-bold text-brand-600">{row.score}</td>
                  <td className="tbl-cell text-slate-500">{row.classAvg}</td>
                  <td className="tbl-cell w-32">
                    <ProgressBar value={row.pct} max={100} color="auto" showLabel={false} height="h-1.5" />
                  </td>
                  <td className="tbl-cell">
                    <span className="badge-green badge">{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observation history */}
      <div className="card p-6">
        <SectionHeader title="Classroom Observations" subtitle="By Principal" />
        <div className="space-y-4">
          {myObs.map(obs => {
            const p = Math.round((obs.score / obs.max) * 100)
            return (
              <div key={obs.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{obs.date}</p>
                    <p className="text-xs text-slate-400">Observed by: {obs.observedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand-600">{p}%</p>
                    <p className="text-xs text-slate-400">{obs.score}/{obs.max}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {obs.criteria.map(c => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-36 flex-shrink-0">{c.name}</span>
                      <div className="flex-1">
                        <ProgressBar value={c.score} max={10} color="teal" showLabel={false} height="h-1.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-10 text-right">{c.score}/10</span>
                    </div>
                  ))}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
                </div>
              </div>
            )
          })}
        </div>
<<<<<<< HEAD

        {/* Overall summary bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-800">Overall Weighted Score</span>
            <span className="text-lg font-bold text-brand-600">{overall}%</span>
          </div>
          <ProgressBar value={overall} max={100} color={overallColor} height="h-3" />
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="card p-6">
        <SectionHeader title="Monthly Performance Trend" subtitle="Your overall score over the academic year" />
        <BarChartWidget
          data={MONTHLY_TREND}
          dataKey="score"
          xKey="month"
          color="#1a56db"
          height={220}
          name="Performance Score"
        />
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
      </div>
    </div>
  )
}
