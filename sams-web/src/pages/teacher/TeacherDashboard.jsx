<<<<<<< HEAD
import React, { useState, useMemo } from 'react'
import { BookOpen, ClipboardList, Brain, Eye, TrendingUp, Star, Cake, Shield, AlertTriangle, Award, ChevronRight } from 'lucide-react'
=======
import { BookOpen, ClipboardList, Brain, Eye, TrendingUp, Star } from 'lucide-react'
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { StatCard, SectionHeader } from '../../components/ui/index.jsx'
import { BarChartWidget, LODonut } from '../../components/charts/index.jsx'
import { ProgressBar } from '../../components/ui/index.jsx'
<<<<<<< HEAD
import { SYLLABUS_STATS, SYLLABUS_ITEMS, LO_SUMMARY, OBSERVATIONS, ATTENDANCE_CHART, BIRTHDAYS, PERMISSIONS, TEACHER_PERFORMANCE, ALL_TEACHERS } from '../../data/dummyData'

// ── Helpers ────────────────────────────────────────────────────────────────
const NOW = new Date()
const NOW_MON = NOW.getMonth() + 1
const NOW_DAY = NOW.getDate()
function isBdayToday(b) { return b.month === NOW_MON && b.day === NOW_DAY }
function isBdayThisWeek(b) {
  const bDate = new Date(NOW.getFullYear(), b.month - 1, b.day)
  const diff = (bDate - NOW) / 86400000
  return diff >= 0 && diff <= 7
}
const MONTHS_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MENU_ITEMS = [
  { label: 'Leave Management', desc: 'Apply & track leave requests', to: '/teacher/leave', icon: ClipboardList, color: 'amber' },
  { label: 'Micro Schedule', desc: 'Weekly timetable & period status', to: '/teacher/schedule', icon: BookOpen, color: 'blue' },
  { label: 'Syllabus Tracking', desc: 'Track chapter completion with charts', to: '/teacher/syllabus', icon: BookOpen, color: 'green' },
  { label: 'Learning Outcomes', desc: 'Student LO scores & distribution', to: '/teacher/lo', icon: Brain, color: 'purple' },
  { label: 'Performance Analytics', desc: 'Attendance, marks & LO trend charts', to: '/teacher/analytics', icon: TrendingUp, color: 'red' },
]

const COLOR_MAP = {
  blue: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600', red: 'bg-rose-50 text-rose-600',
  teal: 'bg-teal-50 text-teal-600', purple: 'bg-purple-50 text-purple-600',
=======
import { SYLLABUS_STATS, LO_SUMMARY, OBSERVATIONS, ATTENDANCE_CHART } from '../../data/dummyData'

const MENU_ITEMS = [
  { label:'Leave Management',   desc:'Apply & track leave requests',          to:'/teacher/leave',    icon:ClipboardList, color:'amber'  },
  { label:'Micro Schedule',     desc:'Weekly timetable & period status',       to:'/teacher/schedule', icon:BookOpen,      color:'blue'   },
  { label:'Syllabus Tracking',  desc:'Track chapter completion with charts',   to:'/teacher/syllabus', icon:BookOpen,      color:'green'  },
  { label:'Homework / Classwork',desc:'Assign tasks & track submissions',      to:'/teacher/homework', icon:ClipboardList, color:'teal'   },
  { label:'Learning Outcomes',  desc:'Student LO scores & distribution',       to:'/teacher/lo',       icon:Brain,         color:'purple' },
  { label:'Performance Analytics',desc:'Attendance, marks & LO trend charts',  to:'/teacher/analytics',icon:TrendingUp,    color:'red'    },
]

const COLOR_MAP = {
  blue:'bg-brand-50 text-brand-600',green:'bg-emerald-50 text-emerald-600',
  amber:'bg-amber-50 text-amber-600',red:'bg-rose-50 text-rose-600',
  teal:'bg-teal-50 text-teal-600',purple:'bg-purple-50 text-purple-600',
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
}

export default function TeacherDashboard() {
  const { user } = useAuth()
<<<<<<< HEAD

  // Defensive data extraction
  const myObs = (OBSERVATIONS ?? []).filter(o => o?.teacher === 'Priya Sharma')
  const latestObs = myObs?.[0]
  const avgObsPct = myObs?.length > 0
    ? myObs.reduce((a, o) => a + ((o?.score ?? 0) / (o?.max ?? 1) * 100), 0) / myObs.length
    : 0

  // Dynamic Syllabus Filtering Logic
  const [filterGrade, setFilterGrade] = useState('All')
  const [filterSection, setFilterSection] = useState('All')
  const [filterSubject, setFilterSubject] = useState('All')

  const { myGrades, mySections, mySubjects } = useMemo(() => {
    const items = SYLLABUS_ITEMS ?? []
    const grades = new Set()
    const sections = new Set()
    const subjects = new Set()

    items.forEach(s => {
      const [g, sec] = (s.class || '').split('-')
      if (g) grades.add(g)
      if (sec) sections.add(sec)
      if (s.subject) subjects.add(s.subject)
    })

    return {
      myGrades: ['All', ...Array.from(grades)],
      mySections: ['All', ...Array.from(sections)],
      mySubjects: ['All', ...Array.from(subjects)]
    }
  }, [])

  const activeStats = useMemo(() => {
    const items = SYLLABUS_ITEMS ?? []
    const filtered = items.filter(s => {
      const matchSubject = filterSubject === 'All' || s.subject === filterSubject
      const [g, sec] = (s.class || '').split('-')
      const matchGrade = filterGrade === 'All' || g === filterGrade
      const matchSection = filterSection === 'All' || sec === filterSection
      return matchSubject && matchGrade && matchSection
    })
    const total = filtered.length
    const completed = filtered.filter(s => s.completed).length
    const pending = total - completed
    return {
      total, completed, pending,
      display: `${filterSubject === 'All' ? 'All Subjects' : filterSubject} · ${filterGrade === 'All' ? 'All Grades' : filterGrade}${filterSection !== 'All' ? '-' + filterSection : ''}`
    }
  }, [filterGrade, filterSection, filterSubject])

  const totalSyllabus = activeStats.total || 1
=======
  const myObs = OBSERVATIONS.filter(o => o.teacher === 'Priya Sharma')
  const latestObs = myObs[0]
  const avgObsPct = myObs.reduce((a,o) => a + (o.score/o.max*100), 0) / myObs.length
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Greeting Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl gradient-brand p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Hello,</p>
<<<<<<< HEAD
            <h2 className="font-display text-2xl lg:text-3xl text-white mb-2">Dear {user?.name ?? 'Teacher'}</h2>
            <p className="text-amber-300 font-semibold text-sm lg:text-base">
              Welcome to ATLAS – YOU ARE THE STAR PERFORMER OF THE SCHOOL ⭐
            </p>
            <p className="text-white/60 text-xs mt-2">{user?.subject ?? 'Mathematics'} · {user?.classAssigned ?? 'Grade 8-A'} · Academic Year 2023–24</p>
=======
            <h2 className="font-display text-2xl lg:text-3xl text-white mb-2">Dear {user?.name}</h2>
            <p className="text-amber-300 font-semibold text-sm lg:text-base">
              Welcome to ATLAS – YOU ARE THE STAR PERFORMER OF THE SCHOOL ⭐
            </p>
            <p className="text-white/60 text-xs mt-2">Mathematics · Grade 8-A · Academic Year 2023–24</p>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
          </div>
          <div className="hidden sm:flex w-14 h-14 bg-amber-400/20 rounded-2xl items-center justify-center flex-shrink-0">
            <Star size={28} className="text-amber-300" />
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* ── Today's Birthdays ─────────────────────────────────────────── */}
      <TodayBirthdayBanner />

      {/* ── Performance KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Topics Completed" value={`${activeStats.completed}/${activeStats.total}`}
          subtitle={`${Math.round(activeStats.completed / totalSyllabus * 100)}% of syllabus`}
          icon={BookOpen} color="blue" trend={Math.round(activeStats.completed / totalSyllabus * 100)} />
        <StatCard title="LO Achievement" value="84%" subtitle="Avg teacher score"
          icon={Brain} color="green" trend={84} />
        <StatCard title="Latest Obs." value={`${Math.round(((latestObs?.score ?? 0) / (latestObs?.max ?? 1)) * 100)}%`}
          subtitle="Classroom observation"
          icon={Eye} color="teal" trend={Math.round(((latestObs?.score ?? 0) / (latestObs?.max ?? 1)) * 100)} />
        <StatCard title="Avg Observation" value={`${Math.round(avgObsPct)}%`} subtitle="All observations"
          icon={TrendingUp} color="amber" trend={Math.round(avgObsPct)} />
=======
      {/* ── Performance KPI Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Topics"   value={`${SYLLABUS_STATS.completed}/${SYLLABUS_STATS.total}`}
          subtitle={`${Math.round(SYLLABUS_STATS.completed/SYLLABUS_STATS.total*100)}% completed`}
          icon={BookOpen}    color="blue"   trend={50} />
        <StatCard title="LO Achievement" value="84%"   subtitle="Avg teacher score"
          icon={Brain}       color="green"  trend={84} />
        <StatCard title="Latest Obs."    value={`${Math.round((latestObs?.score/latestObs?.max)*100)}%`}
          subtitle="Classroom observation"
          icon={Eye}         color="teal"   trend={Math.round((latestObs?.score/latestObs?.max)*100)} />
        <StatCard title="Avg Observation" value={`${Math.round(avgObsPct)}%`} subtitle="All observations"
          icon={TrendingUp}  color="amber"  trend={Math.round(avgObsPct)} />
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
      </div>

      {/* ── Syllabus Progress + LO Distribution ────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
<<<<<<< HEAD
        {/* Syllabus Completion Card */}
        <div className="card p-6 border-slate-100 bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Overall Completion</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{activeStats.display}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1.5 min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Subject</span>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="text-sm font-semibold border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm transition-all cursor-pointer outline-none"
                >
                  {mySubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[120px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Grade</span>
                <select
                  value={filterGrade}
                  onChange={(e) => { setFilterGrade(e.target.value); setFilterSection('All') }}
                  className="text-sm font-semibold border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm transition-all cursor-pointer outline-none"
                >
                  {myGrades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 min-w-[100px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Section</span>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  disabled={filterGrade === 'All'}
                  className="text-sm font-semibold border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:bg-slate-50/50 outline-none"
                >
                  {mySections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-semibold tracking-tight">Topics completed</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900">{activeStats.completed}</span>
                <span className="text-sm text-slate-400 font-bold">/ {activeStats.total}</span>
              </div>
            </div>
            <div className="relative">
              <ProgressBar value={activeStats.completed} max={totalSyllabus} color="blue" height="h-3" />
              <div className="absolute -top-6 right-0 text-xs font-bold text-slate-400 flex items-center gap-1.5">
                 <span className="text-slate-300 font-medium">{activeStats.completed}/{activeStats.total}</span>
                 <span className="text-slate-500">{Math.round(activeStats.completed / totalSyllabus * 100)}%</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {[
                { label: 'Total', val: activeStats.total, color: 'text-slate-800', bg: 'bg-slate-50' },
                { label: 'Completed', val: activeStats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                { label: 'Pending', val: activeStats.pending, color: 'text-amber-600', bg: 'bg-amber-50/50' },
              ].map(({ label, val, color, bg }) => (
                <div key={label} className={`text-center p-3 rounded-2xl ${bg} transition-colors`}>
                  <p className={`text-lg font-black ${color}`}>{val}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">{label}</p>
=======
        {/* Syllabus */}
        <div className="card p-6">
          <SectionHeader title="Syllabus Completion" subtitle="Mathematics · Grade 8-A" />
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Topics completed</span>
              <span className="font-bold text-slate-800">{SYLLABUS_STATS.completed} / {SYLLABUS_STATS.total}</span>
            </div>
            <ProgressBar value={SYLLABUS_STATS.completed} max={SYLLABUS_STATS.total} color="blue" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { label:'Total',     val:SYLLABUS_STATS.total,     color:'text-slate-800' },
                { label:'Completed', val:SYLLABUS_STATS.completed, color:'text-emerald-600' },
                { label:'Pending',   val:SYLLABUS_STATS.pending,   color:'text-amber-600' },
              ].map(({label,val,color}) => (
                <div key={label} className="text-center p-3 rounded-xl bg-slate-50">
                  <p className={`text-lg font-bold ${color}`}>{val}</p>
                  <p className="text-xs text-slate-400">{label}</p>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LO Distribution */}
        <div className="card p-6">
<<<<<<< HEAD
          <SectionHeader title="Learning Status" subtitle="Performance Overview" />
          <LODonut
            approaching={LO_SUMMARY?.approaching ?? 0}
            meeting={LO_SUMMARY?.meeting ?? 0}
            exceeding={LO_SUMMARY?.exceeding ?? 0}
=======
          <SectionHeader title="Learning Status" subtitle="Linear Equations · Current topic" />
          <LODonut
            approaching={LO_SUMMARY.approaching}
            meeting={LO_SUMMARY.meeting}
            exceeding={LO_SUMMARY.exceeding}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            height={200}
          />
        </div>
      </div>

      {/* ── Attendance Chart ────────────────────────────────────────────── */}
      <div className="card p-6">
<<<<<<< HEAD
        <SectionHeader title="Monthly Attendance Trend" subtitle="Participation Overview" />
        <BarChartWidget
          data={ATTENDANCE_CHART ?? []}
=======
        <SectionHeader title="Monthly Attendance Trend" subtitle="Grade 8-A · Current year" />
        <BarChartWidget
          data={ATTENDANCE_CHART}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
          dataKey="pct" xKey="month"
          color="#1a56db" height={200} name="Attendance"
        />
      </div>

<<<<<<< HEAD
      {/* ── Permission Countdown ────────────────────────────────────────── */}
      <PermissionPanel />

=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
      {/* ── Module Quick Access ─────────────────────────────────────────── */}
      <div>
        <SectionHeader title="All Modules" subtitle="Quick access to every feature" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
<<<<<<< HEAD
          {(MENU_ITEMS ?? []).map(({ label, desc, to, icon: Icon, color }) => (
=======
          {MENU_ITEMS.map(({ label, desc, to, icon: Icon, color }) => (
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            <Link
              key={to}
              to={to}
              className="card p-5 flex items-start gap-4 hover:shadow-panel transition-all duration-200 group cursor-pointer"
            >
<<<<<<< HEAD
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${COLOR_MAP[color] ?? 'bg-slate-50 text-slate-400'}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm group-hover:text-brand-600 transition-colors tracking-tight">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed truncate">{desc}</p>
=======
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${COLOR_MAP[color]}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
<<<<<<< HEAD

function PermissionPanel() {
  const list = PERMISSIONS ?? []
  const expiring = list.filter(p => (p?.daysLeft ?? 0) > 0 && (p?.daysLeft ?? 0) <= 14)
  const expired = list.filter(p => (p?.daysLeft ?? 0) <= 0)

  return (
    <div>
      <SectionHeader title="My Permissions" subtitle="Access rights for data entry & uploads" />
      <div className="space-y-2">
        {expired.length > 0 && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="text-rose-500 flex-shrink-0" />
            <span className="text-sm text-rose-700 font-medium">
              {expired.length} permission{expired.length > 1 ? 's' : ''} expired — contact admin to renew
            </span>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map(p => {
            const isExpired = (p?.daysLeft ?? 0) <= 0
            const isExpiring = (p?.daysLeft ?? 0) > 0 && (p?.daysLeft ?? 0) <= 14
            return (
              <div
                key={p?.id || Math.random()}
                className={`rounded-xl border p-4 ${isExpired ? 'bg-rose-50 border-rose-200' :
                  isExpiring ? 'bg-amber-50 border-amber-200' :
                    'bg-white border-slate-100'
                  }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isExpired ? 'bg-rose-100' : isExpiring ? 'bg-amber-100' : 'bg-emerald-100'
                    }`}>
                    <Shield size={15} className={isExpired ? 'text-rose-600' : isExpiring ? 'text-amber-600' : 'text-emerald-600'} />
                  </div>
                  {isExpired
                    ? <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">EXPIRED</span>
                    : isExpiring
                      ? <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">{p?.daysLeft}d left</span>
                      : <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                  }
                </div>
                <p className="text-xs font-semibold text-slate-800">{p?.action ?? 'Permission'}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{p?.class ?? '-'} · {p?.subject ?? '-'}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BirthdayHighlights() {
  const todayBdays = (BIRTHDAYS ?? []).filter(isBdayToday)
  const thisWeekBdays = (BIRTHDAYS ?? []).filter(b => !isBdayToday(b) && isBdayThisWeek(b))

  if (todayBdays.length === 0 && thisWeekBdays.length === 0) return null

  return (
    <div>
      <SectionHeader title="Birthdays" subtitle="School community celebration" />
      <div className="grid sm:grid-cols-2 gap-4">
        {todayBdays.length > 0 && (
          <div className="card p-4 border-purple-200 bg-purple-50 ring-1 ring-purple-200">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-3">🎉 Today</p>
            <div className="space-y-2">
              {todayBdays.map(b => (
                <div key={b?.id ?? b?.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center text-sm font-bold">🎂</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{b?.name ?? 'Student'}</p>
                    <p className="text-xs text-slate-500">{b?.role ?? 'Role'} · {b?.class ?? '-'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {thisWeekBdays.length > 0 && (
          <div className="card p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">📅 This Week</p>
            <div className="space-y-2">
              {thisWeekBdays.slice(0, 4).map(b => (
                <div key={b?.id ?? b?.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
                    {(b?.name ?? '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{b?.name ?? 'Student'}</p>
                    <p className="text-xs text-slate-400">{b?.role ?? 'Role'} · {MONTHS_SHORT[b?.month] ?? ''} {b?.day ?? ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TodayBirthdayBanner() {
  const todayBdays = (BIRTHDAYS ?? []).filter(isBdayToday)
  if (todayBdays.length === 0) return null

  const teachers = todayBdays.filter(b => b.type === 'teacher')
  const students = todayBdays.filter(b => b.type === 'student')

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
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
