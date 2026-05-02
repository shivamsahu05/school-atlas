import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Users, Star, Eye, TrendingUp, Loader2, AlertTriangle } from 'lucide-react'
import { StatCard, SectionHeader, ProgressBar } from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { observationsApi, performanceApi } from '../../api'

const CHART_TABS = [
  { value: 'observations', label: 'Observations' },
  { value: 'syllabus',     label: 'Syllabus'     },
  { value: 'lo',          label: 'LO Score'      },
]

export default function TeacherAnalytics() {
  const [performance,   setPerformance]   = useState(null)
  const [observations,  setObservations]  = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [chartTab,      setChartTab]      = useState('observations')
  const [intelPerf,     setIntelPerf]     = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { intelligenceApi } = await import('../../api')
      const [obsRes, intelRes] = await Promise.all([
        observationsApi.getOwn(),
        intelligenceApi.getTeacherDashboard().catch(() => ({ data: null }))
      ])

      // Handle response from the observations API
      const obsArray = obsRes?.data || []
      setObservations(obsArray)


      // intelRes shape may be: { data: { data: {...} } } or { data: {...} }
      const intel = intelRes?.data?.data || intelRes?.data || null
      setIntelPerf(intel)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Source of Truth mapping
  const metrics = intelPerf?.performance || { syllabus: 0, lo: 0, observation: 0 }
  const overallScore = intelPerf?.overall_score || 0

  const getObservationScore = (obs) => {
    if (obs.pct) return Number(obs.pct);
    const total =
      Number(obs.content_mastery || 0) +
      Number(obs.pedagogy || 0) +
      Number(obs.student_engagement || 0) +
      Number(obs.communication || 0) +
      Number(obs.assessment || 0);
    return Math.round((total / 50) * 100);
  };

  const safeObs = Array.isArray(observations) ? observations : []
  const obsChartData = safeObs.map(o => ({
    date:  o.created_at?.slice(0, 10) || '—',
    score: getObservationScore(o),
  }))


  // Syllabus chart: completed vs pending from intelligence data
  const sylTotal     = intelPerf?.syllabus?.total     || 0
  const sylCompleted = intelPerf?.syllabus?.completed || 0
  const sylChartData = sylTotal > 0
    ? [{ name: 'Completed', value: sylCompleted }, { name: 'Pending', value: sylTotal - sylCompleted }]
    : []

  const avgObsPct = metrics.observation || 0

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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Obs. Avg"      value={`${Math.round(avgObsPct)}%`}   icon={Eye}       color="teal"   trend={avgObsPct} />
        <StatCard title="Syllabus"      value={`${metrics.syllabus}%`}        icon={BarChart2} color="blue"   />
        <StatCard title="LO Score"      value={`${metrics.lo}%`}              icon={Star}      color="amber"  />
        <StatCard title="Overall IQ"    value={`${overallScore}%`}            icon={TrendingUp}color="green"  />
      </div>

      {/* Chart tabs */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <SectionHeader title="Performance Trends" subtitle="My metrics over time"/>
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {CHART_TABS.map(t => (
              <button key={t.value} onClick={() => setChartTab(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  chartTab === t.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>{t.label}</button>
            ))}
          </div>
        </div>

        {chartTab === 'observations' && (
          obsChartData.length > 0
            ? <BarChartWidget data={obsChartData} dataKey="score" xKey="date" color="#0d9488" height={220} name="Score %"/>
            : <p className="text-center text-sm text-slate-400 py-16">No observation data yet.</p>
        )}
        {chartTab === 'syllabus' && (
          sylChartData.length > 0
            ? <BarChartWidget data={sylChartData} dataKey="value" xKey="name" color="#3b82f6" height={220} name="Topics"/>
            : <p className="text-center text-sm text-slate-400 py-16">No syllabus data yet. Topics will appear once added.</p>
        )}
        {chartTab === 'lo' && (() => {
          const loData = [
            { name: 'Approaching', value: intelPerf?.lo?.approaching || 0 },
            { name: 'Meeting',     value: intelPerf?.lo?.meeting     || 0 },
            { name: 'Exceeding',   value: intelPerf?.lo?.exceeding   || 0 },
          ]
          const hasLO = loData.some(d => d.value > 0)
          return hasLO
            ? <BarChartWidget data={loData} dataKey="value" xKey="name" color="#10b981" height={220} name="Students"/>
            : <p className="text-center text-sm text-slate-400 py-16">No LO data yet. Will appear once admin awards LO scores.</p>
        })()}
      </div>

      {/* Performance scorecard */}
      {intelPerf && (
        <div className="card p-6">
          <SectionHeader title="Academic Intelligence Scorecard" subtitle="Live weighted scores (50% Syllabus, 30% LO, 20% Obs)"/>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {[
              { label:'Syllabus Execution', value: intelPerf.performance?.syllabus ?? intelPerf.syllabus_score ?? 0, color:'blue'    },
              { label:'LO Performance',     value: intelPerf.performance?.lo       ?? intelPerf.lo_score       ?? 0, color:'emerald' },
              { label:'Observation Score',  value: intelPerf.performance?.observation ?? intelPerf.observation_score ?? avgObsPct, color:'teal' },
              { label:'Overall IQ',         value: intelPerf.overall_score ?? overallScore ?? 0,                                   color:'amber'  },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-4 bg-${color}-50 border border-${color}-100 text-center`}>
                <p className={`text-2xl font-bold text-${color}-600`}>{Number(value||0).toFixed(1)}%</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div className={`h-full rounded-full bg-${color}-500`} style={{ width:`${Math.min(value||0,100)}%` }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observation history */}
      <div className="card p-6">
        <SectionHeader title="Classroom Observations" subtitle="Recorded by principal / admin"/>
        {safeObs.length === 0
          ? <p className="text-center text-sm text-slate-400 py-10">No observations recorded yet.</p>
          : (
            <div className="space-y-4">
              {safeObs.map(obs => {
                const pct = getObservationScore(obs)
                const total = Number(obs.total_score || (Number(obs.content_mastery || 0) + Number(obs.pedagogy || 0) + Number(obs.student_engagement || 0) + Number(obs.communication || 0) + Number(obs.assessment || 0)))
                const criteria = [
                  { name: 'Content Mastery', score: obs.content_mastery },
                  { name: 'Pedagogy', score: obs.pedagogy },
                  { name: 'Student Engagement', score: obs.student_engagement },
                  { name: 'Communication', score: obs.communication },
                  { name: 'Assessment', score: obs.assessment }
                ]
                return (
                  <div key={obs.id} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {obs.created_at?.slice(0, 10) || '—'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Observed by: {obs.observer_name || '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-brand-600">{pct}%</p>
                        <p className="text-xs text-slate-400">{total}/50</p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-3">
                      {criteria.map((c, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-40 flex-shrink-0">{c.name}</span>
                          <div className="flex-1">
                            <ProgressBar value={c.score} max={10} color="teal" showLabel={false} height="h-1.5"/>
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-10 text-right">{c.score}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )

              })}
            </div>
          )
        }
      </div>
    </div>
  )
}
