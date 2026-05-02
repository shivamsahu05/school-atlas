import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, ClipboardList, Brain, TrendingUp, Calendar, Clock,
  Cake, Shield, AlertTriangle, ChevronRight, User, Loader2,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { StatCard, SectionHeader, ProgressBar } from '../../components/ui/index.jsx'
import { BarChartWidget, LODonut } from '../../components/charts/index.jsx'
import { dashboardApi, intelligenceApi } from '../../api'

// ── Color map ─────────────────────────────────────────────────────────────────
const COLOR_MAP = {
  blue:   'bg-brand-50 text-brand-600',
  green:  'bg-emerald-50 text-emerald-600',
  amber:  'bg-amber-50 text-amber-600',
  red:    'bg-rose-50 text-rose-600',
  teal:   'bg-teal-50 text-teal-600',
  purple: 'bg-purple-50 text-purple-600',
}

const MENU_ITEMS = [
  { label:'Micro Schedule',        desc:'Weekly timetable & period status',   to:'/teacher/schedule',  icon:Calendar,      color:'blue'   },
  { label:'Syllabus Tracking',     desc:'Chapter completion with charts',      to:'/teacher/syllabus',  icon:BookOpen,      color:'green'  },
  { label:'Homework',              desc:'Assign & track homework submissions', to:'/teacher/homework',  icon:ClipboardList, color:'amber'  },
  { label:'Learning Outcomes',     desc:'Student LO scores & distribution',   to:'/teacher/lo',        icon:Brain,         color:'purple' },
  { label:'Performance Analytics', desc:'Attendance, marks & LO trends',      to:'/teacher/analytics', icon:TrendingUp,    color:'red'    },
  { label:'Leave Management',      desc:'Apply & track leave requests',        to:'/teacher/leave',     icon:Clock,         color:'teal'   },
  { label:'My Profile',            desc:'View your profile & permissions',     to:'/teacher/profile',   icon:User,          color:'blue'   },
]

const MONTHS_S = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getBdayMonth(dateStr) {
  if (!dateStr) return 0
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? 0 : d.getMonth() + 1
  } catch { return 0 }
}
function getBdayDay(dateStr) {
  if (!dateStr) return 0
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? 0 : d.getDate()
  } catch { return 0 }
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const { user } = useAuth()
  const [data,    setData]    = useState(null)
  const [intel,   setIntel]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [dashRes, intelRes] = await Promise.all([
        dashboardApi.getTeacherDashboard(),
        intelligenceApi.getTeacherDashboard()
      ])
      setData(dashRes.data)
      setIntel(intelRes.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  if (error) return (
    <div className="card p-8 text-center">
      <AlertTriangle size={32} className="text-rose-500 mx-auto mb-3" />
      <p className="text-slate-600">{error}</p>
      <button onClick={fetchDashboard} className="btn-primary btn mt-4">Retry</button>
    </div>
  )

  const d = data || {}
  const intelData = intel || {}
  
  // UNIFIED SOURCE: Standardized Backend Structure
  const syllabusStats = intelData.syllabus || { completed: 0, total: 0, percentage: 0 };
  const loSummary = {
    ...(intelData.lo || { approaching: 0, meeting: 0, exceeding: 0 }),
    total: intelData.lo ? (intelData.lo.approaching + intelData.lo.meeting + intelData.lo.exceeding) : 0
  };
  const overallScore = intelData.overall_score || 0;
  const pendingAlerts = intelData.not_done_students || [];

  const permissions   = d.permissions     || []
  const birthdays     = d.birthdays       || []
  const leave         = d.leaveSummary    || { approved: 0, pending: 0, rejected: 0, total: 0 }
  const homework      = d.homework       || []

  const todayDate = new Date()
  const todayBdays = birthdays.filter(b => {
    if (!b.date) return false;
    const day = getBdayDay(b.date)
    const mon = getBdayMonth(b.date)
    return day === todayDate.getDate() && mon === (todayDate.getMonth() + 1)
  })

  // Build LO chart data
  const loChartData = [
    { name: 'Approaching', value: loSummary.approaching || 0 },
    { name: 'Meeting',     value: loSummary.meeting     || 0 },
    { name: 'Exceeding',   value: loSummary.exceeding   || 0 },
  ]

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <div className="gradient-brand rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium">Welcome back,</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white mt-0.5">{user?.name || 'Teacher'}</h1>
            {d.topPerformers?.some(p => p.teacher_id === user?.id) && (
              <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 animate-pulse">
                🏆 Top Performer
              </span>
            )}
          </div>
          <p className="text-white/60 text-xs mt-1">
            Academic Intelligence Engine Active · Single Source of Truth Enabled
          </p>
        </div>
        <div className="w-20 h-20 bg-white/10 rounded-2xl hidden sm:flex items-center justify-center flex-shrink-0">
          <span className="text-4xl font-black text-white/30">IQ</span>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Syllabus Progress" value={`${syllabusStats.percentage}%`} color="green"  trend={syllabusStats.percentage} />
        <StatCard title="LO Coverage"      value={loSummary.total || 0}            color="purple" />
        <StatCard title="Performance IQ"  value={`${overallScore}%`}             color="teal"   trend={overallScore} />
        <StatCard title="Leave Summary"   value={leave.approved}                  color="amber"  />
      </div>

      {/* ── LMS Intelligence (Unified) ─────────────────────────────────────── */}
      {pendingAlerts.length > 0 && (
        <div className="card p-6 border-brand-100 bg-brand-50/20 shadow-lg shadow-brand-500/5">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader 
              title="Execution Alerts: Student Support Needed" 
              subtitle="Issues detected in your Micro Schedule topics requiring attention" 
            />
            <Link to="/teacher/schedule" className="text-xs font-bold text-brand-600 bg-white px-3 py-1.5 rounded-lg border border-brand-100 shadow-sm hover:bg-brand-50 transition-colors">
              Update Schedule
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingAlerts.map((item, i) => (
              <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm group hover:border-brand-300 transition-all">
                <div className="space-y-0.5">
                   <div className="flex items-center gap-1.5">
                     <span className="text-xs font-black text-slate-800">{item.name}</span>
                     <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">{item.status || 'Requires Attention'}</span>
                   </div>
                   <p className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
                     {item.topic} · {item.class}
                   </p>
                </div>
                <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-brand-50 transition-colors">
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Syllabus + LO + Top Performers row ────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Syllabus by class */}
        <div className="card p-6">
          <SectionHeader title="Live Syllabus Tracking" subtitle="Real-time completion %" />
          {(() => {
            const syllabusRows = d.syllabusStatsByClass || d.syllabus || [];
            if (syllabusRows.length > 0) return (
              <div className="space-y-4 mt-4">
                {syllabusRows.map((item, i) => {
                  const total = Number(item.total || 0);
                  const completed = Number(item.completed || 0);
                  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                  
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                        <span className="truncate max-w-[120px]">{item.class_name || item.class} · {item.subject}</span>
                        <span>{completed}/{total} ({pct}%)</span>
                      </div>
                      <ProgressBar value={completed} max={total || 1} color={pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red'} height="h-1.5" showLabel={false} />
                    </div>
                  );
                })}
              </div>
            );
            return <p className="text-center text-xs text-slate-400 py-10">No syllabus data</p>;
          })()}
        </div>

        {/* LO donut */}
        <div className="card p-6">
          <SectionHeader title="LO Distribution" subtitle="Overall student performance" />
          <div className="flex flex-col items-center justify-center min-h-[200px]">
             <LODonut 
               approaching={loSummary.approaching} 
               meeting={loSummary.meeting} 
               exceeding={loSummary.exceeding} 
               height={180} 
             />
          </div>
        </div>

        {/* Top Performers (Added as requested) */}
        <div className="card p-6">
          <SectionHeader title="Top Performers" subtitle="70% Teacher + 30% Principal Score" />
          <div className="space-y-3 mt-4">
            {d.topPerformers?.length > 0 ? d.topPerformers.map((p, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 rounded-xl transition-all ${p.teacher_id === user?.id ? 'bg-brand-50 border border-brand-100' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold
                  ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${p.teacher_id === user?.id ? 'text-brand-700' : 'text-slate-800'}`}>
                    {p.teacher_name} {p.teacher_id === user?.id && '(You)'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    T: {Number(p.avg_teacher_score).toFixed(1)} · P: {Number(p.avg_principal_score).toFixed(1)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-black text-emerald-600">{Number(p.weighted_score).toFixed(1)}%</p>
                </div>
              </div>
            )) : <p className="text-center text-xs text-slate-400 py-10">No performance data</p>}
          </div>
        </div>
      </div>

      {/* ── Birthday Highlights ──────────────────────────────────────────── */}
      {birthdays.length > 0 && (
        <div className="card p-6">
          <SectionHeader
            title="Upcoming Birthdays"
            subtitle={todayBdays.length > 0 ? `🎂 ${todayBdays.length} birthday(s) today!` : 'Students this week'}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {birthdays.slice(0, 6).map((b, i) => {
              const mon = getBdayMonth(b.date)
              const day = getBdayDay(b.date)
              const today = todayBdays.some(t => getBdayDay(t.date) === day)
              return (
                <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 ${
                  today ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-200' : 'bg-white border-slate-100'
                }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    today ? 'bg-purple-500 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {today ? '🎂' : (b.name || '?')[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.class}-{b.section} · {MONTHS_S[mon]} {day}</p>
                    {today && <span className="text-[10px] font-bold text-purple-600">TODAY!</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Permissions Panel ────────────────────────────────────────────── */}
      <div className="card p-6">
        <SectionHeader title="My Permissions" subtitle="Admin-granted access rights" />
        {permissions.length === 0
          ? <p className="text-sm text-slate-400 mt-4 text-center">No permissions configured. Contact admin.</p>
          : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {permissions.map(p => {
                const isExpired  = p.daysLeft < 0
                const isExpiring = p.daysLeft >= 0 && p.daysLeft <= 14
                return (
                  <div key={p.id} className={`rounded-xl border p-4 ${
                    isExpired  ? 'bg-rose-50 border-rose-200' :
                    isExpiring ? 'bg-amber-50 border-amber-200' :
                                 'bg-white border-slate-100'
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Shield size={15} className={isExpired ? 'text-rose-500' : isExpiring ? 'text-amber-500' : 'text-emerald-500'} />
                      {isExpired
                        ? <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">EXPIRED</span>
                        : isExpiring
                        ? <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">{p.daysLeft}d left</span>
                        : <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                      }
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{p.action}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.class} · {p.subject}</p>
                    <p className="text-[10px] text-slate-300 mt-1">{p.from} → {p.to}</p>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {/* ── Homework Summary ─────────────────────────────────────────────── */}
      {homework.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Recent Homework" subtitle="Latest assignments & submission status" />
            <Link to="/teacher/homework" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">
              View All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {homework.slice(0, 4).map((hw, i) => {
              const pct = hw.total > 0 ? Math.round((hw.submitted / hw.total) * 100) : 0
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{hw.description}</p>
                    <p className="text-xs text-slate-400">{hw.class_name}-{hw.section} · {hw.subject} · Due: {hw.due_date?.slice(0,10) || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${pct>=80?'text-emerald-600':pct>=50?'text-amber-600':'text-rose-600'}`}>{pct}%</p>
                    <p className="text-[10px] text-slate-400">{hw.submitted}/{hw.total}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Module Quick Access ──────────────────────────────────────────── */}
      <div>
        <SectionHeader title="All Modules" subtitle="Quick access to every feature" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {MENU_ITEMS.map(({ label, desc, to, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className="card p-5 flex items-start gap-4 hover:shadow-panel transition-all duration-200 group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${COLOR_MAP[color]}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
