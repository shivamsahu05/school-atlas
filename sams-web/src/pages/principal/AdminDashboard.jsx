<<<<<<< HEAD
import { useState, useEffect } from 'react'
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
import { Link } from 'react-router-dom'
import {
  Users, BookOpen, BarChart2, CheckCircle, GraduationCap,
  TrendingUp, Eye, Bell, Star, Calendar, UserCog, Clock,
<<<<<<< HEAD
  AlertTriangle, Cake, FileText, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { StatCard, SectionHeader, ProgressBar, StatusBadge, DataTable, SelectDropdown } from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import {
  SCHOOL_STATS, TEACHER_PERFORMANCE, OBS_CHART,
  WEEKLY_SYLLABUS, WEEK_RANGES, BIRTHDAYS, HW_TRACKING,
  LEAVES,
} from '../../data/dummyData'
import { MONTHS, COLOR_MAP } from '../../data/constants'
import { fetchCompletionReport } from '../../data/mockAPI'

// ── Helpers ────────────────────────────────────────────────────────────────
const TODAY = new Date()
const T_MON = TODAY.getMonth() + 1
const T_DAY = TODAY.getDate()

function isToday(b) { return b.month === T_MON && b.day === T_DAY }

function isBdayThisWeek(b) {
  const bDate = new Date(TODAY.getFullYear(), b.month - 1, b.day)
  // Normalizing to start of day for comparison
  const t = new Date(TODAY)
  t.setHours(0,0,0,0)
  bDate.setHours(0,0,0,0)
  
  const diff = (bDate - t) / 86400000
  return diff >= 0 && diff <= 7
}

function isLeaveToday(l) {
  const from = new Date(l.from);
  const to = new Date(l.to);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);
  return today >= from && today <= to && l.status === 'Approved';
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
  { label: 'Follow-ups', desc: 'Pending homework & syllabus tasks', to: '/admin/followups', icon: Bell, color: 'red', badge: 3 },
  { label: 'Faculty Directory', desc: 'Teacher salary, qualification & assignment', to: '/admin/teachers', icon: Users, color: 'teal' },
  { label: 'Teacher Performance', desc: 'Weighted scoring across 5 criteria', to: '/admin/performance', icon: TrendingUp, color: 'purple' },
  { label: 'Student Directory', desc: 'Advanced lifecycle, IDs & enrollment', to: '/admin/students', icon: GraduationCap, color: 'green' },
  { label: 'Timetable & Marks', desc: 'School timetable and marks overview', to: '/admin/timetable', icon: Calendar, color: 'blue' },
  { label: 'Leave Approval', desc: 'Approve or reject leave requests', to: '/admin/leave', icon: Clock, color: 'amber', badge: 2 },
]


export default function AdminDashboard() {
  const { user } = useAuth()
  const topTeachers = [...TEACHER_PERFORMANCE].sort((a, b) => b.overall - a.overall).slice(0, 5)
=======
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { StatCard, SectionHeader, ProgressBar, StatusBadge } from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { SCHOOL_STATS, TEACHER_PERFORMANCE, OBS_CHART } from '../../data/dummyData'

const MENU_ITEMS = [
  { label:'Syllabus Status',     desc:'Class/subject completion overview',    to:'/admin/syllabus',    icon:BookOpen,   color:'blue'   },
  { label:'Award LO Scores',     desc:'5-step workflow to enter LO scores',   to:'/admin/award-lo',    icon:Star,       color:'amber'  },
  { label:'Follow-ups',          desc:'Pending homework & syllabus tasks',    to:'/admin/followups',   icon:Bell,       color:'red',   badge:3 },
  { label:'Classroom Obs.',      desc:'Input scores & view analysis',         to:'/admin/observation', icon:Eye,        color:'teal'   },
  { label:'Teacher Performance', desc:'Weighted scoring across 5 criteria',   to:'/admin/performance', icon:TrendingUp, color:'purple' },
  { label:'User Management',     desc:'Add/edit/delete teachers & students',  to:'/admin/users',       icon:UserCog,    color:'green'  },
  { label:'Timetable & Marks',   desc:'School timetable and marks overview',  to:'/admin/timetable',   icon:Calendar,   color:'blue'   },
  { label:'Leave Approval',      desc:'Approve or reject leave requests',     to:'/admin/leave',       icon:Clock,      color:'amber', badge:2 },
]

const COLOR_MAP = {
  blue:'bg-brand-50 text-brand-600', green:'bg-emerald-50 text-emerald-600',
  amber:'bg-amber-50 text-amber-600', red:'bg-rose-50 text-rose-600',
  teal:'bg-teal-50 text-teal-600', purple:'bg-purple-50 text-purple-600',
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const topTeachers = [...TEACHER_PERFORMANCE].sort((a,b) => b.overall - a.overall).slice(0, 5)
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 10% 80%, #1a56db 0%, transparent 50%), radial-gradient(circle at 90% 20%, #0d9488 0%, transparent 50%)',
<<<<<<< HEAD
        }} />
=======
        }}/>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">Principal Dashboard</p>
            <h2 className="font-display text-2xl lg:text-3xl text-white mb-2">Welcome, {user?.name}</h2>
            <p className="text-slate-300 text-sm">School Academic Management System · Academic Year 2023–24</p>
          </div>
          <div className="hidden sm:flex w-14 h-14 bg-white/10 rounded-2xl items-center justify-center">
            <GraduationCap size={28} className="text-white" />
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* ── Today's Birthdays & Leaves ───────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <TodayBirthdayBanner />
        <TodayLeaveBanner />
      </div>

      {/* ── Top Row: School Stats and Upcoming Events ─────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader title="School Overview" subtitle="Real-time metrics" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title="Total Teachers" value={SCHOOL_STATS.totalTeachers} icon={Users} color="blue" trend={80} />
            <StatCard title="Total Students" value={SCHOOL_STATS.totalStudents} icon={GraduationCap} color="green" trend={90} />
            <StatCard title="Classes" value={SCHOOL_STATS.totalClasses} icon={BookOpen} color="teal" trend={70} />
            <StatCard title="Syllabus Comp." value={`${SCHOOL_STATS.syllabusCompletion}%`} icon={CheckCircle} color="amber" trend={SCHOOL_STATS.syllabusCompletion} />
          </div>
        </div>

        <div className="card p-6">
          <SectionHeader title="Upcoming Events" subtitle="Competitions & Festivals" />
          <div className="space-y-4 mt-2">
            {[
              { name: 'Science Fair', date: 'May 15', class: 'Grade 8-10', color: 'bg-brand-50 text-brand-600' },
              { name: 'Sports Day', date: 'Apr 20', class: 'All School', color: 'bg-emerald-50 text-emerald-600' },
              { name: 'Math Olympiad', date: 'Mar 10', class: 'Grade 6-9', color: 'bg-purple-50 text-purple-600' },
            ].map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer border border-slate-50">
                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${ev.color}`}>
                  <span className="text-[10px] uppercase font-bold">{ev.date.split(' ')[0]}</span>
                  <span className="text-sm font-bold leading-tight">{ev.date.split(' ')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{ev.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{ev.class}</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
              </div>
            ))}
            <Link to="/admin/competitions" className="block text-center text-xs font-semibold text-brand-600 hover:underline pt-2">
              View Event Calendar
            </Link>
          </div>
        </div>
=======
      {/* ── School Stats ───────────────────────────────────────────────── */}
      <SectionHeader title="School Overview" subtitle="Real-time metrics" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Teachers"    value={SCHOOL_STATS.totalTeachers}  icon={Users}       color="blue"   trend={80}  />
        <StatCard title="Total Students"    value={SCHOOL_STATS.totalStudents}  icon={GraduationCap} color="green" trend={90} />
        <StatCard title="Classes"           value={SCHOOL_STATS.totalClasses}   icon={BookOpen}    color="teal"   trend={70}  />
        <StatCard title="Syllabus Comp."    value={`${SCHOOL_STATS.syllabusCompletion}%`} icon={CheckCircle} color="amber" trend={SCHOOL_STATS.syllabusCompletion} />
        <StatCard title="Avg Attendance"    value={`${SCHOOL_STATS.avgAttendance}%`}      icon={Users}  color="purple" trend={SCHOOL_STATS.avgAttendance} />
        <StatCard title="Avg Performance"   value={`${SCHOOL_STATS.avgPerformance}%`}     icon={TrendingUp} color="red" trend={SCHOOL_STATS.avgPerformance} />
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Observation chart */}
        <div className="card p-6">
          <SectionHeader title="Observation Scores" subtitle="All teachers" />
          <BarChartWidget
            data={OBS_CHART} dataKey="score" xKey="name"
            color="#0d9488" height={200} name="Score %"
          />
        </div>

        {/* Top performers table */}
        <div className="card p-6">
          <SectionHeader title="Top Performers" subtitle="By overall score" />
          <div className="space-y-3 mt-2">
            {topTeachers.map((p, i) => (
              <div key={p.teacher.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold
<<<<<<< HEAD
                  ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {i + 1}
=======
                  ${i===0?'bg-amber-400 text-white':i===1?'bg-slate-300 text-slate-700':i===2?'bg-orange-400 text-white':'bg-slate-100 text-slate-500'}`}>
                  {i+1}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.teacher.name}</p>
                  <p className="text-xs text-slate-400">{p.teacher.subject}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-600">{p.overall.toFixed(1)}%</p>
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
            {badge && (
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
<<<<<<< HEAD

      {/* ── D. Notification Summary Panel ──────────────────────────────────── */}
      <NotificationPanel />

      {/* ── A. Weekly Syllabus Tracking ────────────────────────────────────── */}
      <WeeklySyllabusTracker />

      {/* ── B. Birthday Widget ─────────────────────────────────────────────── */}
      <BirthdayWidget />

      {/* ── C. HW / Notebook / Exam Tracking Table ─────────────────────────── */}
      <HWTrackingTable />

      {/* ── F. Incomplete Work Widget ──────────────────────────────────────── */}
      <IncompleteWorkWidget />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// D. Notification Summary Panel
// ────────────────────────────────────────────────────────────────────────────
function NotificationPanel() {
  const pendingLeaves = LEAVES.filter(l => l.status === 'Pending').length
  const todayBdays = BIRTHDAYS.filter(isToday).length
  const pendingHW = HW_TRACKING.filter(h => h.status === 'Pending').length
  const overdueSyl = WEEKLY_SYLLABUS.filter(s => s.pct < 50).length
  const permExpiring = 2   // static placeholder – replace with real permission API

  const NOTIFS = [
    { label: 'Pending Homework', count: pendingHW, color: 'amber', icon: FileText, to: '/admin/followups' },
    { label: 'Overdue Syllabus', count: overdueSyl, color: 'red', icon: BookOpen, to: '/admin/syllabus' },
    { label: 'Birthday Today', count: todayBdays, color: 'purple', icon: Cake, to: '#birthdays' },
    { label: 'Leave Pending', count: pendingLeaves, color: 'blue', icon: Clock, to: '/admin/leave' },
    { label: 'Permission Expiring', count: permExpiring, color: 'teal', icon: AlertTriangle, to: '/admin/users' },
  ]

  const colMap = {
    amber: { badge: 'bg-amber-500', icon: 'bg-amber-50 text-amber-600', border: 'border-amber-200' },
    red: { badge: 'bg-rose-500', icon: 'bg-rose-50 text-rose-600', border: 'border-rose-200' },
    purple: { badge: 'bg-purple-500', icon: 'bg-purple-50 text-purple-600', border: 'border-purple-200' },
    blue: { badge: 'bg-brand-500', icon: 'bg-brand-50 text-brand-600', border: 'border-brand-200' },
    teal: { badge: 'bg-teal-500', icon: 'bg-teal-50 text-teal-600', border: 'border-teal-200' },
  }

  return (
    <div>
      <SectionHeader
        title="Notifications"
        subtitle="Items requiring your attention"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {NOTIFS.map(({ label, count, color, icon: Icon, to }) => {
          const c = colMap[color]
          return (
            <Link
              key={label}
              to={to}
              className={`card p-4 flex flex-col gap-3 border ${c.border} hover:shadow-panel transition-all duration-200 cursor-pointer relative`}
              onClick={(e) => {
                if (to.startsWith('#')) {
                  e.preventDefault()
                  document.querySelector(to)?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
            >
              {count > 0 && (
                <span className={`absolute -top-2 -right-2 w-5 h-5 ${c.badge} text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow`}>
                  {count}
                </span>
              )}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{count}</p>
                <p className="text-xs text-slate-400 leading-tight mt-0.5">{label}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span>View</span>
                <ChevronRight size={12} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// A. Weekly Syllabus Tracking
// ────────────────────────────────────────────────────────────────────────────
function WeeklySyllabusTracker() {
  const [activeMonth, setActiveMonth] = useState(MONTHS[new Date().getMonth() + 1])
  const [activeWeek, setActiveWeek] = useState(WEEK_RANGES[0])

  const weekData = WEEKLY_SYLLABUS.filter(r => r.week === activeWeek)

  // Unique teachers for grouping
  const teachers = [...new Set(weekData.map(r => r.teacher))]

  // Summary counts for the selected week
  const green = weekData.filter(r => r.pct >= 80).length
  const yellow = weekData.filter(r => r.pct >= 50 && r.pct < 80).length
  const red = weekData.filter(r => r.pct < 50).length

  return (
    <div>
      <SectionHeader
        title="Weekly Syllabus Tracking"
        subtitle="Topic-completion % by teacher, class and subject"
      />

      {/* Month & Week Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <SelectDropdown 
          label="Month" 
          options={MONTHS.filter(m => m !== 'All')} 
          value={activeMonth} 
          onChange={(e) => setActiveMonth(e.target.value)} 
        />
        <SelectDropdown 
          label="Week" 
          options={WEEK_RANGES.map((w, index) => ({ value: w, label: `Week ${index + 1}` }))} 
          value={activeWeek} 
          onChange={(e) => setActiveWeek(e.target.value)} 
        />
      </div>

      {/* Legend + summary counts */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /><span className="text-xs text-slate-500">≥80% On Track ({green})</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /><span className="text-xs text-slate-500">50–79% Lagging ({yellow})</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /><span className="text-xs text-slate-500">&lt;50% Overdue ({red})</span></div>
      </div>

      {/* Teacher-wise tracking cards */}
      <div className="space-y-4">
        {teachers.map(teacher => {
          const rows = weekData.filter(r => r.teacher === teacher)
          return (
            <div key={teacher} className="card p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">{teacher}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {rows.map(row => (
                  <div key={`${row.class}-${row.subject}`} className="rounded-xl border border-slate-100 p-3 bg-slate-50/60">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-medium text-slate-700">{row.class}</p>
                        <p className="text-[11px] text-slate-400">{row.subject}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sylPctColor(row.pct)}`}>
                        {row.pct}%
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${sylBarColor(row.pct)}`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{row.completed}/{row.total} topics</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// B. Birthday Widget
// ────────────────────────────────────────────────────────────────────────────
function BirthdayWidget() {
  const [tab, setTab] = useState('all')   // 'all' | 'student' | 'teacher'
  const [monthIdx, setMonthIdx] = useState(0)       // 0 = All
  const [timeRange, setTimeRange] = useState('all') // 'all' | 'week'

  const filtered = BIRTHDAYS.filter(b => {
    const matchType = tab === 'all' ? true : b.type === tab
    const matchMonth = monthIdx === 0 ? true : b.month === monthIdx
    const matchRange = timeRange === 'all' ? true : isBdayThisWeek(b)
    return matchType && matchMonth && matchRange
  })

  // Sort: today first, then by month+day
  const sorted = [...filtered].sort((a, b) => {
    const aToday = isToday(a) ? 0 : 1
    const bToday = isToday(b) ? 0 : 1
    if (aToday !== bToday) return aToday - bToday
    return a.month !== b.month ? a.month - b.month : a.day - b.day
  })

  const todayCount = BIRTHDAYS.filter(isToday).length

  return (
    <div id="birthdays">
      <SectionHeader
        title="Birthdays"
        subtitle={todayCount > 0 ? `🎉 ${todayCount} birthday${todayCount > 1 ? 's' : ''} today!` : 'Student & teacher birthdays'}
      />

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Type tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {[['all', 'All'], ['student', 'Students'], ['teacher', 'Teachers']].map(([v, l]) => (
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
            { id: 'all', label: 'All Calendar' },
            { id: 'week', label: 'This Week' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => {
                setTimeRange(r.id)
                if (r.id === 'week') setMonthIdx(0) // Reset month if filtering by week
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${timeRange === r.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Month filter */}
        <select
          value={monthIdx}
          onChange={e => setMonthIdx(Number(e.target.value))}
          className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-8 text-center text-slate-400 text-sm">No birthdays found for this filter.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map(b => {
            const today = isToday(b)
            return (
              <div
                key={b.id}
                className={`rounded-xl p-4 flex items-center gap-3 border transition-all duration-200 ${today
                    ? 'bg-purple-50 border-purple-200 shadow-sm ring-1 ring-purple-300'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${today ? 'bg-purple-500 text-white' : b.type === 'teacher' ? 'bg-brand-100 text-brand-700' : 'bg-emerald-100 text-emerald-700'
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
                  <p className="text-xs text-slate-400 mt-0.5">{b.role} · {b.class}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {MONTHS[b.month]} {b.day}
                  </p>
                </div>

                {/* Type badge */}
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${b.type === 'teacher' ? 'bg-brand-50 text-brand-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                  {b.type === 'teacher' ? 'Staff' : 'Student'}
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
function HWTrackingTable() {
  const [filterClass, setFilterClass] = useState('All')
  const [filterSubject, setFilterSubject] = useState('All')
  const [filterType, setFilterType] = useState('All')

  const classes = ['All', ...new Set(HW_TRACKING.map(r => r.class))]
  const subjects = ['All', ...new Set(HW_TRACKING.map(r => r.subject))]
  const types = ['All', 'Homework', 'Notebook', 'Exam']

  const rows = HW_TRACKING.filter(r => {
    return (filterClass === 'All' || r.class === filterClass)
      && (filterSubject === 'All' || r.subject === filterSubject)
      && (filterType === 'All' || r.type === filterType)
  })

  // Summary counts
  const hwCount = rows.filter(r => r.type === 'Homework').length
  const nbCount = rows.filter(r => r.type === 'Notebook').length
  const exCount = rows.filter(r => r.type === 'Exam').length
  const pendingC = rows.filter(r => r.status === 'Pending').length

  const COLUMNS = [
    { key: 'class', label: 'Class', sortable: true, className: 'whitespace-nowrap' },
    { key: 'subject', label: 'Subject', sortable: true },
    {
      key: 'type', label: 'Type', sortable: true,
      render: v => {
        const map = { Homework: 'bg-brand-50 text-brand-600', Notebook: 'bg-teal-50 text-teal-600', Exam: 'bg-purple-50 text-purple-600' }
        return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[v] || ''}`}>{v}</span>
      }
    },
    {
      key: 'description', label: 'Description', sortable: false, className: 'max-w-[200px]',
      render: v => <span className="truncate block max-w-[200px] text-slate-600 text-xs">{v}</span>
    },
    { key: 'due', label: 'Due', sortable: false, className: 'whitespace-nowrap text-slate-500 text-xs' },
    {
      key: 'pct', label: 'Submission %', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${v >= 80 ? 'bg-emerald-500' : v >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`}
              style={{ width: `${v}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-700 w-9 text-right">{v}%</span>
        </div>
      )
    },
    {
      key: 'submitted', label: 'Submitted', sortable: true,
      render: (v, row) => <span className="text-xs text-slate-600">{v}/{row.total}</span>
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: v => <StatusBadge status={v} />
    },
    {
      key: 'actions', label: 'Details',
      render: (_, row) => (
        <Link 
          to={`/admin/completion-report?class=${row.class.split(' ')[1].replace('-', '')}&subject=${row.subject}`}
          className="text-brand-600 hover:text-brand-700 font-bold text-[10px] uppercase tracking-wider"
        >
          View Student Split
        </Link>
      )
    }
  ]

  const SELECT_CLS = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  return (
    <div>
      <SectionHeader
        title="Homework / Notebook / Exam Tracker"
        subtitle="Submission tracking across all classes and subjects"
      />

      {/* Summary mini-stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Homework', count: hwCount, color: 'blue' },
          { label: 'Notebook', count: nbCount, color: 'teal' },
          { label: 'Exam', count: exCount, color: 'purple' },
          { label: 'Pending', count: pendingC, color: 'amber' },
        ].map(({ label, count, color }) => (
          <StatCard key={label} title={label} value={count} color={color} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className={SELECT_CLS}>
          {classes.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className={SELECT_CLS}>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={SELECT_CLS}>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <span className="text-xs text-slate-400 self-center">{rows.length} record{rows.length !== 1 ? 's' : ''}</span>
      </div>

      <DataTable columns={COLUMNS} rows={rows} emptyMessage="No records match the selected filters." />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// E. Today Birthday Banner
// ────────────────────────────────────────────────────────────────────────────
function TodayLeaveBanner() {
  const todayLeaves = LEAVES.filter(isLeaveToday)
  if (todayLeaves.length === 0) return null

  return (
    <div className="card p-5 border-rose-200 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 ring-1 ring-rose-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-sm shadow-rose-200">
          <Clock size={16} />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">Teachers on Leave Today</p>
          <p className="text-[10px] text-slate-400">Faculty attendance overview for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {todayLeaves.map(l => (
          <div key={l.id} className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-rose-100 shadow-sm transition-all hover:bg-white">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {l.teacher[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">{l.teacher}</p>
              <p className="text-[10px] text-slate-400 truncate">{l.type} Leave · {l.from === l.to ? '1 Day' : 'Multi-day'}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
               <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                 ON LEAVE
               </span>
               <p className="text-[9px] text-slate-400 font-medium">Until {new Date(l.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        ))}
      </div>
      <Link to="/admin/leave?view=calendar" className="block text-center text-xs font-semibold text-rose-600 hover:underline pt-4 border-t border-rose-100/50 mt-4">
        View Leave Calendar
      </Link>
    </div>
  )
}

function TodayBirthdayBanner() {
  const todayBdays = BIRTHDAYS.filter(isToday)
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
        {todayBdays.map(b => (
          <div key={b.id} className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-purple-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
              🎉
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">{b.name}</p>
              <p className="text-[10px] text-slate-400">{b.class}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${b.type === 'teacher' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'
              }`}>
              {b.type === 'teacher' ? '👩‍🏫 Teacher' : '🎓 Student'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// F. Incomplete Work Widget
// ────────────────────────────────────────────────────────────────────────────
function IncompleteWorkWidget() {
  const [incomplete, setIncomplete] = useState([])
  
  useEffect(() => {
    fetchCompletionReport({ class: 'All', subject: 'All', section: 'All' }).then(data => {
      const pending = data.filter(s => !s.homeworkComplete || !s.notebookComplete)
      setIncomplete(pending)
    })
  }, [])

  if (incomplete.length === 0) return null

  return (
    <div id="incomplete-work" className="card p-6 bg-gradient-to-r from-rose-50 to-orange-50 border-rose-200 ring-1 ring-rose-100 mb-8 mx-auto w-full">
      <SectionHeader title="Did not yet homework and notebook" subtitle={`${incomplete.length} students have pending core assignments`} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
        {incomplete.slice(0, 12).map(student => (
          <div key={student.id} className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm flex flex-col gap-1.5 transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm truncate pr-2">{student.studentName}</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 flex-shrink-0 py-0.5 rounded-md">{student.class}-{student.section}</span>
            </div>
            <div className="text-[11px] font-medium leading-relaxed bg-rose-50/50 p-2 rounded-lg border border-rose-50 mt-1">
              {!student.homeworkComplete && <span className="text-rose-600 flex items-center gap-1.5"><AlertTriangle size={12}/> Homework missing ({student.subject})</span>}
              {!student.notebookComplete && <span className="text-rose-600 flex items-center gap-1.5 mt-1"><AlertTriangle size={12}/> Notebook unchecked ({student.subject})</span>}
            </div>
          </div>
        ))}
      </div>
      {incomplete.length > 12 && (
        <div className="mt-5 text-center">
          <Link to="/admin/completion-report" className="inline-block px-6 py-2.5 rounded-full text-xs font-bold bg-white text-rose-600 shadow-sm hover:shadow hover:bg-rose-50 transition-all border border-rose-100">
            View all {incomplete.length} students
          </Link>
        </div>
      )}
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
    </div>
  )
}
