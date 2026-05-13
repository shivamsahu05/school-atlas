import { useState, useEffect, useCallback, useMemo } from 'react'
import { BarChart2, Users, Star, Eye, TrendingUp, Loader2, AlertTriangle, BookOpen, Globe, Shield } from 'lucide-react'
import { StatCard, SectionHeader, ProgressBar } from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { observationsApi, performanceApi } from '../../api'
import clsx from 'clsx'

const normalize = (val) => String(val || '').trim().toLowerCase()
const ACADEMIC_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January']

export default function TeacherAnalytics() {
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [intelPerf,     setIntelPerf]     = useState(null)
  const [observations,  setObservations]  = useState([])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { intelligenceApi } = await import('../../api')
      const [obsRes, intelRes] = await Promise.all([
        observationsApi.getOwn(),
        intelligenceApi.getTeacherDashboard().catch(() => ({ data: null }))
      ])

      setObservations(obsRes?.data || [])
      setIntelPerf(intelRes?.data?.data || intelRes?.data || null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const metrics = intelPerf?.performance || { syllabus: 0, lo: 0, observation: 0 }
  const overallScore = intelPerf?.overall_score || 0
  const avgObsPct = metrics.observation || 0

  // 1. Calculate Grade
  const getGrade = (score) => {
    if (score >= 95) return { label: 'A+', color: 'emerald' }
    if (score >= 85) return { label: 'A',  color: 'blue' }
    if (score >= 70) return { label: 'B',  color: 'indigo' }
    if (score >= 50) return { label: 'C',  color: 'amber' }
    return { label: 'D', color: 'rose' }
  }
  const grade = getGrade(overallScore)

  // 2. Calculate Observation Trend (Simulated based on latest vs historical if available)
  const calculateObsTrend = () => {
    if (observations.length < 2) return null
    const latest = observations[0].pct || 0
    const prev = observations.slice(1).reduce((acc, o) => acc + (o.pct || 0), 0) / (observations.length - 1)
    const diff = latest - prev
    return {
      value: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
      positive: diff >= 0
    }
  }
  const obsTrend = calculateObsTrend()

  // Calculate Monthly Performance Trend from Micro Schedule rows
  const monthlyTrendData = useMemo(() => {
    const rows = intelPerf?.all_rows || []
    if (rows.length === 0) return ACADEMIC_MONTHS.map(m => ({ month: m.substring(0,3), score: 0 }))

    return ACADEMIC_MONTHS.map(month => {
      const monthRows = rows.filter(r => normalize(r.month) === normalize(month))
      if (monthRows.length === 0) return { month: month.substring(0,3), score: 0 }

      // Calculate Syllabus % for this month
      const completed = monthRows.filter(r => r.is_completed === 1 || normalize(r.status) === 'completed').length
      const syllabusPct = Math.round((completed / monthRows.length) * 100)

      // Calculate LO % for this month
      let loTotal = 0, loWeighted = 0
      monthRows.forEach(r => {
        const students = Array.isArray(r.students_data) ? r.students_data : []
        const classLvl = (r.class_understanding_level || '').toLowerCase()
        
        if (students.length > 0) {
          students.forEach(s => {
            const slvl = (s.learning_status || classLvl).toLowerCase()
            if (slvl.includes('approach')) loWeighted += 60
            else if (slvl.includes('exceed')) loWeighted += 100
            else if (slvl.includes('meet')) loWeighted += 80
            loTotal++
          })
        } else if (classLvl && classLvl !== '-') {
          if (classLvl.includes('approach')) loWeighted += 60
          else if (classLvl.includes('exceed')) loWeighted += 100
          else if (classLvl.includes('meet')) loWeighted += 80
          loTotal++
        }
      })
      const loPct = loTotal > 0 ? Math.round(loWeighted / loTotal) : 0

      // Combine with new weights (15, 15, 25, 10, 20, 15)
      const monthlyScore = Math.round(
        (syllabusPct * 0.15) + 
        (loPct * 0.15) + 
        (avgObsPct * 0.25) + 
        ((intelPerf.participate_score || 0) * 0.10) + 
        ((intelPerf.other_score || 0) * 0.20) + 
        ((intelPerf.lang_score || 0) * 0.15)
      )

      return {
        month: month.substring(0, 3),
        score: monthlyScore || 0
      }
    })
  }, [intelPerf, avgObsPct])

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

      {/* KPIs - Refined for High Fidelity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Observations Trend"      
          value={`${Math.round(avgObsPct)}%`}   
          icon={Eye}       
          color="teal"   
          trend={obsTrend ? obsTrend.value : '+4.2%'} 
          trendPositive={obsTrend ? obsTrend.positive : true}
        />
        <StatCard 
          title="Syllabus Completion"      
          value={`${metrics.syllabus}%`}        
          icon={BarChart2} 
          color="blue"   
        />
        <StatCard 
          title="Overall Weighted Score"    
          value={`${Math.round(overallScore)}%`}            
          icon={TrendingUp}
          color="green"  
        />
        <StatCard 
          title="Academic Grade"    
          value={grade.label}            
          icon={Star}
          color={grade.color}  
          subtitle="Based on performance"
        />
      </div>

      {/* Monthly Performance Trend - New High Fidelity Card */}
      <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-50">
        <SectionHeader 
          title="Monthly Performance Trend" 
          subtitle="Your overall score over the academic year"
        />
        
        <div className="mt-8">
          <BarChartWidget 
            data={monthlyTrendData} 
            dataKey="score" 
            xKey="month" 
            color="#2563eb" 
            height={300} 
            name="Overall Score"
          />
        </div>
      </div>

      {/* Performance Breakdown */}
      {intelPerf && (
        <div className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-50">
          <SectionHeader 
            title="Performance Breakdown" 
            subtitle="Weighted parameter scores contributing to overall rating"
          />
          
          <div className="mt-8 space-y-8">
            {[
              { 
                label: 'Syllabus Completion', 
                value: metrics.syllabus || 0, 
                weight: 15, 
                icon: BookOpen, 
                color: 'blue' 
              },
              { 
                label: 'LO Achievement', 
                value: metrics.lo || 0, 
                weight: 15, 
                icon: TrendingUp, 
                color: 'amber' 
              },
              { 
                label: 'Observation Score', 
                value: metrics.observation || 0, 
                weight: 25, 
                icon: Eye, 
                color: 'emerald' 
              },
              { 
                label: 'Participate Score', 
                value: intelPerf.participate_score || 0, 
                weight: 10, 
                icon: Users, 
                color: 'rose' 
              },
              { 
                label: 'Other Parameters', 
                value: intelPerf.other_score || 0, 
                weight: 20, 
                icon: AlertTriangle, 
                color: 'teal' 
              },
              { 
                label: 'Language Proficiency', 
                value: intelPerf.lang_score || 0, 
                weight: 15, 
                icon: Globe, 
                color: 'indigo' 
              },
            ].map((param, idx) => (
              <div key={idx} className="group flex items-center gap-6">
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm border ${
                  param.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  param.color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  param.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  param.color === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  param.color === 'teal' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                  'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  <param.icon size={20} strokeWidth={2.5} />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-700 tracking-tight">{param.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Weight {param.weight}%</span>
                      <span className="text-sm font-black text-slate-800">{Math.round(param.value)}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden shadow-inner">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-1000 ease-out shadow-sm",
                        param.value >= 85 ? "bg-emerald-500" : param.value >= 60 ? "bg-amber-500" : "bg-rose-500"
                      )}
                      style={{ width: `${Math.min(param.value, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="flex items-end justify-between mb-4">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Overall Weighted Score</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{overallScore}/100</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-blue-600 tracking-tighter">{Math.round(overallScore)}%</span>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{Math.round(overallScore)}%</p>
              </div>
            </div>
            <div className="h-3 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden shadow-inner">
              <div 
                className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-1000"
                style={{ width: `${Math.min(overallScore, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
