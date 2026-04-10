import { Link } from 'react-router-dom'
import {
  Users, BookOpen, BarChart2, CheckCircle, GraduationCap,
  TrendingUp, Eye, Bell, Star, Calendar, UserCog, Clock,
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

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 10% 80%, #1a56db 0%, transparent 50%), radial-gradient(circle at 90% 20%, #0d9488 0%, transparent 50%)',
        }}/>
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

      {/* ── School Stats ───────────────────────────────────────────────── */}
      <SectionHeader title="School Overview" subtitle="Real-time metrics" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Teachers"    value={SCHOOL_STATS.totalTeachers}  icon={Users}       color="blue"   trend={80}  />
        <StatCard title="Total Students"    value={SCHOOL_STATS.totalStudents}  icon={GraduationCap} color="green" trend={90} />
        <StatCard title="Classes"           value={SCHOOL_STATS.totalClasses}   icon={BookOpen}    color="teal"   trend={70}  />
        <StatCard title="Syllabus Comp."    value={`${SCHOOL_STATS.syllabusCompletion}%`} icon={CheckCircle} color="amber" trend={SCHOOL_STATS.syllabusCompletion} />
        <StatCard title="Avg Attendance"    value={`${SCHOOL_STATS.avgAttendance}%`}      icon={Users}  color="purple" trend={SCHOOL_STATS.avgAttendance} />
        <StatCard title="Avg Performance"   value={`${SCHOOL_STATS.avgPerformance}%`}     icon={TrendingUp} color="red" trend={SCHOOL_STATS.avgPerformance} />
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
                  ${i===0?'bg-amber-400 text-white':i===1?'bg-slate-300 text-slate-700':i===2?'bg-orange-400 text-white':'bg-slate-100 text-slate-500'}`}>
                  {i+1}
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
    </div>
  )
}
