import { useState, useMemo, useEffect } from 'react'
import { Download } from 'lucide-react'
import {
  StatCard, SectionHeader, Tabs, StatusBadge, ProgressBar,
  Modal, FilterChips, DataTable, FormInput, SelectDropdown
} from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { academicApi } from '../../services/schoolApi'
import { PERFORMANCE_WEIGHTS } from '../../data/constants'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminTeacherPerformance() {
  const [performanceData, setPerformanceData] = useState([])
  const [loading, setLoading] = useState(false)
  const WEIGHTS = PERFORMANCE_WEIGHTS

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await academicApi.getPerformance()
      setPerformanceData(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Failed to fetch performance data:', err)
      toast.error('Failed to load performance scores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const sorted = useMemo(() => {
    return [...performanceData].sort((a, b) => b.overall - a.overall)
  }, [performanceData])

  // ── Export Logic ──────────────────────────────────────────────────────────
  const handleExport = () => {
    if (sorted.length === 0) return
    const headers = ['Teacher', 'Subject', 'Syllabus %', 'LO %', 'Observation %', 'Other %', 'Overall %']
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(',') + "\n"
      + sorted.map(p => [
          p.name, 
          p.subject, 
          p.syllabus, 
          p.lo, 
          p.observation, 
          p.other, 
          p.overall.toFixed(1)
        ].join(',')).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `SAMS_Teacher_Performance_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading && performanceData.length === 0) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div />
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download size={14} /> Export performance report
        </button>
      </div>

      {/* Weights legend */}
      <div className="card p-6">
        <SectionHeader title="Scoring Weights" subtitle="How the overall score is calculated" />
        <div className="grid sm:grid-cols-5 gap-3">
          {WEIGHTS.map(w => (
            <div key={w.key} className="text-center p-3 rounded-xl bg-slate-50">
              <div className={`w-2 h-2 rounded-full ${w.color} mx-auto mb-2`} />
              <p className="text-lg font-bold text-slate-800">{w.w}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{w.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      {sorted.length > 0 && (
        <div className="card p-6">
          <SectionHeader title="Overall Performance Scores" />
          <BarChartWidget data={sorted.map(p => ({ name: p.name.split(' ')[0], pct: Math.round(p.overall) }))}
            dataKey="pct" xKey="name" color="#1a56db" height={200} name="Overall %" />
        </div>
      )}

      {/* Individual cards */}
      <div className="space-y-4">
        {sorted.length > 0 ? sorted.map((p, i) => (
          <div key={p.teacherId} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold
                  ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-500'}`}>
                  #{i + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.subject}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${p.overall >= 85 ? 'text-emerald-600' : p.overall >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {p.overall.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">Overall</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {WEIGHTS.map(w => (
                <div key={w.key} className="text-center">
                  <div className="h-16 bg-slate-100 rounded-lg overflow-hidden flex items-end mb-1">
                    <div className={`w-full ${w.color} rounded-lg`}
                      style={{ height: `${p[w.key]}%` }} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">{p[w.key]}%</p>
                  <p className="text-[10px] text-slate-400">{w.w}</p>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="card p-8 text-center text-slate-400">No performance records found. Observations and Syllabus completion contribute to these scores.</div>
        )}
      </div>
    </div>
  )
}