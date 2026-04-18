import { useState } from 'react'
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

  return (
    <div className="space-y-6 animate-fade-in">

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
                </div>
              </div>
            )
          })}
        </div>

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
      </div>
    </div>
  )
}
