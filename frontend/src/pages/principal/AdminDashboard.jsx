import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  Users, BookOpen, BarChart2, CheckCircle, GraduationCap,
  TrendingUp, Eye, Bell, Star, Calendar, UserCog, Clock,
  AlertTriangle, Cake, FileText, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { StatCard, SectionHeader, ProgressBar, StatusBadge, DataTable, SelectDropdown } from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { MONTHS, COLOR_MAP } from '../../data/constants'
import { dashboardApi, intelligenceApi } from '../../api'

// ── Helpers ────────────────────────────────────────────────────────────────
const TODAY = new Date()
const T_MON = TODAY.getMonth() + 1
const T_DAY = TODAY.getDate()

function getMonthDay(dateStr) {
  if (!dateStr) return { month: 0, day: 0 };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { month: 0, day: 0 };
  return { month: d.getMonth() + 1, day: d.getDate() };
}

function isToday(b) {
  const { month, day } = getMonthDay(b.date);
  return month === T_MON && day === T_DAY
}

function isBdayThisWeek(b) {
  const { month, day } = getMonthDay(b.date);
  if (!month || !day) return false;
  const bDate = new Date(TODAY.getFullYear(), month - 1, day)
  const t = new Date(TODAY)
  t.setHours(0, 0, 0, 0)
  bDate.setHours(0, 0, 0, 0)

  const diff = (bDate - t) / 86400000
  return diff >= 0 && diff <= 7
}

function sylPctColor(pct) {
  if (pct >= 80) return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  if (pct >= 50) return 'bg-amber-100 text-amber-700 border border-amber-200'
  return 'bg-rose-100 text-rose-700 border border-rose-200'
}

function sylBarColor(pct) {
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 50) return 'bg-amber-400'
  return 'bg-rose-500'
}

const MENU_ITEMS = [
  { label: 'Syllabus Status', desc: 'Class/subject completion overview', to: '/admin/syllabus', icon: BookOpen, color: 'blue' },
  { label: 'Award LO Scores', desc: '5-step workflow to enter LO scores', to: '/admin/award-lo', icon: Star, color: 'amber' },
  { label: 'Follow-ups', desc: 'Pending homework & syllabus tasks', to: '/admin/followups', icon: Bell, color: 'red', badge: 0 },
  { label: 'Faculty Directory', desc: 'Teacher salary, qualification & assignment', to: '/admin/teachers', icon: Users, color: 'teal' },
  { label: 'Teacher Performance', desc: 'Weighted scoring across 5 criteria', to: '/admin/performance', icon: TrendingUp, color: 'purple' },
  { label: 'Student Directory', desc: 'Advanced lifecycle, IDs & enrollment', to: '/admin/students', icon: GraduationCap, color: 'green' },
  { label: 'Timetable & Marks', desc: 'School timetable and marks overview', to: '/admin/timetable', icon: Calendar, color: 'blue' },
  { label: 'Leave Approval', desc: 'Approve or reject leave requests', to: '/admin/leave', icon: Clock, color: 'amber', badge: 0 },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [intel, setIntel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hwNotifications, setHwNotifications] = useState([])
  const [liveNotifications, setLiveNotifications] = useState([])

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [dashRes, intelRes, hwRes, notifRes] = await Promise.all([
          dashboardApi.getAdminMetrics(),
          intelligenceApi.getAdminDashboard(),
          dashboardApi.getHomeworkNotifications(),
          dashboardApi.getNotifications()
        ])
        
        if (isMounted) {
          setIntel(intelRes?.data || null)
          setHwNotifications(hwRes?.data || [])
          setLiveNotifications(notifRes?.data || [])
          setData(dashRes?.data || {
            overview: {},
            events: [],
            observations: [],
            topPerformers: [],
            management: {},
            notifications: [],
            weeklySyllabus: [],
            birthdays: []
          })
        }
      } catch (err) {
        if (isMounted) {
          console.error("Dashboard API failed:", err)
          setData(d => d || { overview: {}, events: [], observations: [], topPerformers: [], management: {}, notifications: [], weeklySyllabus: [], birthdays: [] })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000); // 30s polling
    return () => { isMounted = false; clearInterval(interval); }
  }, [])
  if (loading) return <div className="p-10 text-center animate-pulse text-brand-600 font-bold">Loading Live Dashboard Analytics...</div>;

  const topPerformers = data?.topPerformers || [];
  const events = data?.events || [];
  const observations = data?.observations || [];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 10% 80%, #1a56db 0%, transparent 50%), radial-gradient(circle at 90% 20%, #0d9488 0%, transparent 50%)',
        }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">Principal Dashboard</p>
            <h2 className="font-display text-2xl lg:text-3xl text-white mb-2">Welcome, {user?.name || 'Admin'}</h2>
            <p className="text-slate-300 text-sm">School Academic Management System · Live Database Connected</p>
          </div>
          <div className="hidden sm:flex w-14 h-14 bg-white/10 rounded-2xl items-center justify-center">
            <GraduationCap size={28} className="text-white" />
          </div>
        </div>
      </div>

      {/* ── Today's Birthdays & Leaves ───────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <TodayBirthdayBanner birthdays={data?.birthdays || []} />
        <TodayLeaveBanner leaves={data?.notifications || []} />
      </div>

      {/* ── Top Row: School Stats and Upcoming Events ─────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader title="School Overview" subtitle="Real-time database metrics" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title="Total Teachers" value={data?.overview?.totalTeachers || 0} icon={Users} color="blue" trend={100} />
            <StatCard title="Total Students" value={data?.overview?.totalStudents || 0} icon={GraduationCap} color="green" trend={100} />
            <StatCard title="Classes" value={data?.overview?.totalClasses || 0} icon={BookOpen} color="teal" trend={100} />
            <StatCard title="Syllabus Comp." value={`${data?.overview?.syllabusCompletion || 0}%`} icon={CheckCircle} color="amber" trend={Number(data?.overview?.syllabusCompletion) || 0} />
          </div>
        </div>

        <div className="card p-6">
          <SectionHeader title="Upcoming Events" subtitle="Live from school_events" />
          <div className="space-y-4 mt-2">
            {events.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No upcoming events scheduled</p>
            ) : events.map((ev, i) => {
              const eDate = new Date(ev.date);
              const monthStr = eDate.toLocaleDateString('en-US', { month: 'short' });
              const dayStr = eDate.getDate();
              const isComp = ev.category === 'competition';
              const targetPath = isComp ? '/admin/competitions' : '/admin/events';
              
              return (
                <Link 
                  key={i} 
                  to={targetPath}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer border border-slate-50"
                >
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold",
                    isComp ? "bg-amber-50 text-amber-600" : "bg-brand-50 text-brand-600"
                  )}>
                    <span className="text-[10px] uppercase">{monthStr}</span>
                    <span className="text-sm leading-tight">{dayStr}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{ev.title}</p>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                        isComp ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {ev.category || 'Event'}
                      </span>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">{ev.class}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Observation chart */}
        <div className="card p-6">
          <SectionHeader title="Observation Scores" subtitle="Real-time averages" />
          {observations.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No observation data available</p>
          ) : (
            <BarChartWidget
              data={observations} dataKey="avgScore" xKey="teacher_name"
              color="#0d9488" height={200} name="Score %"
            />
          )}
        </div>

        {/* Top performers table — now teacher-based with 70/30 score */}
        <div className="card p-6">
          <SectionHeader title="Top Performers" subtitle="Dynamic: Weighted score across 6 parameters" />
          <div className="space-y-3 mt-2">
            {topPerformers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No performance data available</p>
            ) : topPerformers.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/50 border border-slate-100/30">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black
                  ${i === 0 ? 'bg-amber-400 text-white shadow-sm' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{p.teacher_name || '—'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Excellence</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {Number(p.weighted_score).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Module Grid ────────────────────────────────────────────────── */}
      <SectionHeader title="Management Modules" subtitle="Quick access to all admin features" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MENU_ITEMS.map(({ label, desc, to, icon: Icon, color, badge }) => (
          <Link
            key={to} to={to}
            className="card p-5 flex items-start gap-3 hover:shadow-panel transition-all duration-200 group cursor-pointer relative"
          >
            {badge > 0 && (
              <span className="absolute top-3 right-3 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${COLOR_MAP[color]}`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </Link>
        ))}
      </div>


      {/* ── A. Weekly Syllabus Tracking ────────────────────────────────────── */}
      <WeeklySyllabusTracker syllabus={data?.weeklySyllabus || []} />

      {/* ── B. Birthday Widget ─────────────────────────────────────────────── */}
      <BirthdayWidget birthdays={data?.birthdays || []} />

      {/* ── C. HW / Notebook / Exam Tracking Table ─────────────────────────── */}
      <HWTrackingTable hwTracking={hwNotifications} />

      {/* ── LIVE ACTIVITY FEED ────────────────────────────────────────────── */}
      <LiveActivityFeed notifications={liveNotifications} />

      {/* ── F. Incomplete Work Widget ──────────────────────────────────────── */}
      <IncompleteWorkWidget intel={intel} />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// A. Weekly Syllabus Tracking
// ────────────────────────────────────────────────────────────────────────────
function WeeklySyllabusTracker({ syllabus = [] }) {
  if (!syllabus || syllabus.length === 0) return null;

  // Backend returns: { class, subject, teacher, pct, total, completed }
  const normalized = syllabus.map(r => ({
    className:  r.class  || r.className  || r.class_name  || '—',
    subjectName:r.subject|| r.subjectName|| r.subject_name|| '—',
    teacher:    r.teacher|| '—',
    completion: Number(r.pct ?? r.completion ?? 0),
    total:      Number(r.total || 0),
    completed:  Number(r.completed || 0),
  }));

  const green  = normalized.filter(r => r.completion >= 80).length
  const yellow = normalized.filter(r => r.completion >= 50 && r.completion < 80).length
  const red    = normalized.filter(r => r.completion < 50).length

  return (
    <div>
      <SectionHeader
        title="Weekly Syllabus Tracking"
        subtitle="Topic-completion % by class and subject (Live)"
      />

      <div className="flex flex-wrap items-center gap-4 mb-4 mt-2">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /><span className="text-xs text-slate-500">≥80% On Track ({green})</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /><span className="text-xs text-slate-500">50–79% Lagging ({yellow})</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /><span className="text-xs text-slate-500">&lt;50% Overdue ({red})</span></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card p-5">
          <p className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-tight">Syllabus Completion by Class</p>
          <BarChartWidget 
            data={normalized.slice(0, 8)} 
            dataKey="completion" 
            xKey="className" 
            color="#3b82f6" 
            height={220} 
            name="Completion %"
          />
        </div>
        <div className="card p-5 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-3">
            <TrendingUp size={32} className="text-brand-600" />
          </div>
          <h4 className="text-lg font-black text-slate-800">{Math.round((green / (normalized.length || 1)) * 100)}%</h4>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">On-Track Classes</p>
          <div className="w-full mt-4 space-y-2">
             <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400">TARGET</span>
                <span className="text-emerald-600">80%</span>
             </div>
             <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.round((green / (normalized.length || 1)) * 100)}%` }} />
             </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {normalized.map((row, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-3 bg-slate-50/60">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-xs font-medium text-slate-700">{row.className}</p>
                  <p className="text-[11px] text-slate-400">{row.subjectName}</p>
                  {row.teacher && <p className="text-[10px] text-slate-300">{row.teacher}</p>}
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sylPctColor(row.completion)}`}>
                  {row.total > 0 ? `${row.completed}/${row.total}` : '—'} ({row.completion}%)
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${sylBarColor(row.completion)}`}
                  style={{ width: `${Math.min(row.completion, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// B. Birthday Widget
// ────────────────────────────────────────────────────────────────────────────
function BirthdayWidget({ birthdays = [] }) {
  const [tab, setTab] = useState('all')   // 'all' | 'Student' | 'Teacher'
  const [timeRange, setTimeRange] = useState('all') // 'all' | 'week'

  const filtered = birthdays.filter(b => {
    const matchType = tab === 'all' ? true : b.role === tab
    const matchRange = timeRange === 'all' ? true : isBdayThisWeek(b)
    return matchType && matchRange
  })

  const sorted = [...filtered].sort((a, b) => {
    const aToday = isToday(a) ? 0 : 1
    const bToday = isToday(b) ? 0 : 1
    if (aToday !== bToday) return aToday - bToday
    return getMonthDay(a.date).day - getMonthDay(b.date).day
  })

  const todayCount = birthdays.filter(isToday).length

  return (
    <div id="birthdays">
      <SectionHeader
        title="Birthdays"
        subtitle={todayCount > 0 ? `🎉 ${todayCount} birthday${todayCount > 1 ? 's' : ''} today! (Live Database)` : 'Student & teacher birthdays (Live Database)'}
      />

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Type tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {[['all', 'All'], ['Student', 'Students'], ['Teacher', 'Teachers']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Time range toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {[
            { id: 'all', label: 'Current Month' },
            { id: 'week', label: 'This Week' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => {
                setTimeRange(r.id)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${timeRange === r.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-8 text-center text-slate-400 text-sm">No birthdays found for this filter.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((b, i) => {
            const today = isToday(b)
            const { month, day } = getMonthDay(b.date)
            return (
              <div
                key={i}
                className={`rounded-xl p-4 flex items-center gap-3 border transition-all duration-200 ${today
                  ? 'bg-purple-50 border-purple-200 shadow-sm ring-1 ring-purple-300'
                  : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${today ? 'bg-purple-500 text-white' : b.role === 'Teacher' ? 'bg-brand-100 text-brand-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                  {today ? '🎂' : b.name[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800 truncate">{b.name}</p>
                    {today && (
                      <span className="text-[10px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full">TODAY</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {MONTHS[month]} {day}
                  </p>
                </div>

                {/* Type badge */}
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${b.role === 'Teacher' ? 'bg-brand-50 text-brand-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                  {b.role === 'Teacher' ? 'Staff' : 'Student'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// C. HW / Notebook / Exam Tracking Table
// ────────────────────────────────────────────────────────────────────────────
function HWTrackingTable({ hwTracking = [] }) {
  if (!hwTracking || hwTracking.length === 0) {
    return (
      <div>
        <SectionHeader title="Homework / Notebook / Exam Tracker" subtitle="Live tracking of incomplete tasks" />
        <div className="card p-8 text-center text-slate-400 text-sm border-dashed">No incomplete homework records found. Great!</div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader title="Homework / Notebook / Exam Tracker" subtitle="Live tracking of incomplete tasks" />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">Class</th>
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Teacher</th>
                <th className="px-5 py-4">Task Type</th>
                <th className="px-5 py-4">Topic</th>
                <th className="px-5 py-4">Month/Week</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hwTracking.map((hw, i) => (
                <tr key={hw.event_id || i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-700">{hw.class} {hw.section}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{hw.student_name}</td>
                  <td className="px-5 py-3 text-slate-600">{hw.subject}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{hw.teacher_name}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{hw.task_type}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={hw.topic}>{hw.topic}</td>
                  <td className="px-5 py-3 text-slate-500 text-[10px] uppercase font-bold">{hw.month || '—'} · {hw.week || '—'}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                      {hw.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400 text-xs">
                    {new Date(hw.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// LIVE ACTIVITY FEED
// ────────────────────────────────────────────────────────────────────────────
function LiveActivityFeed({ notifications = [] }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="card p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
      <SectionHeader title="Live Activity Feed" subtitle="Recent real-time alerts from teacher actions" />
      
      <div className="space-y-4 mt-4">
        {notifications.map((n, i) => (
          <div key={n.event_id || i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all group">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} />
              </div>
              {i === 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 group-hover:text-rose-700 transition-colors">
                {n.text}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{n.type}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(n.time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                </span>
              </div>
            </div>
            
            <button className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Action Required
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}


// ────────────────────────────────────────────────────────────────────────────
// E. Today Birthday Banner
// ────────────────────────────────────────────────────────────────────────────
function TodayLeaveBanner({ leaves = [] }) {
  // Filter for leaves
  const todayLeaves = leaves.filter(l => l.type === 'leave')
  if (todayLeaves.length === 0) return null

  return (
    <div className="card p-5 border-rose-200 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 ring-1 ring-rose-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-sm shadow-rose-200">
          <Clock size={16} />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">Pending Leave Requests</p>
          <p className="text-[10px] text-slate-400">Action required</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {todayLeaves.map((l, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-rose-100 shadow-sm transition-all hover:bg-white">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              L
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 truncate">{l.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TodayBirthdayBanner({ birthdays = [] }) {
  const todayBdays = birthdays.filter(isToday)
  if (todayBdays.length === 0) return null

  return (
    <div className="card p-5 border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 ring-1 ring-purple-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎂</span>
        <div>
          <p className="font-bold text-slate-800 text-sm">Today's Birthdays</p>
          <p className="text-[10px] text-slate-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {todayBdays.map((b, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-purple-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
              🎉
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">{b.name}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${b.role === 'Teacher' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
              }`}>
              {b.role === 'Teacher' ? '👩‍🏫 Teacher' : '🎓 Student'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// F. Incomplete Work Widget (No API data yet - render empty)
// ────────────────────────────────────────────────────────────────────────────
function IncompleteWorkWidget({ intel }) {
  if (!intel || (!intel.highPriorityAlerts?.length && !intel.pendingTeacherActions?.length)) return null;

  return (
    <div>
      <SectionHeader 
        title="Academic Intelligence Alerts" 
        subtitle="Critical issues detected by the LMS engine" 
      />
      <div className="grid lg:grid-cols-2 gap-6 mt-4">
        {/* Overdue/High Priority */}
        <div className="card p-5 border-rose-100 bg-rose-50/10">
          <h4 className="text-sm font-bold text-rose-700 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} /> Overdue Syllabus & Tasks
          </h4>
          <div className="space-y-3">
            {intel.highPriorityAlerts?.slice(0, 5).map((item, i) => (
              <div key={i} className="bg-white p-3 rounded-xl border border-rose-100 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.topic}</p>
                  <p className="text-[11px] text-slate-400">{item.class_name}-{item.section} · {item.teacher_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    {item.days_overdue}d Overdue
                  </span>
                </div>
              </div>
            ))}
            {!intel.highPriorityAlerts?.length && <p className="text-xs text-slate-400 text-center py-4">No critical alerts</p>}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="card p-5 border-amber-100 bg-amber-50/10">
          <h4 className="text-sm font-bold text-amber-700 flex items-center gap-2 mb-4">
            <Clock size={16} /> Lagging Progress Tracking
          </h4>
          <div className="space-y-3">
            {intel.pendingTeacherActions?.slice(0, 5).map((item, i) => (
              <div key={i} className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.teacher_name}</p>
                  <p className="text-[11px] text-slate-400">{item.class_name}-{item.section} · {item.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-amber-600">{item.pending_topics} Pending</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
