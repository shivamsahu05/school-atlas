import { BookOpen, ClipboardList, Brain, Eye, TrendingUp, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { StatCard, SectionHeader } from '../../components/ui/index.jsx'
import { BarChartWidget, LODonut } from '../../components/charts/index.jsx'
import { ProgressBar } from '../../components/ui/index.jsx'
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
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const myObs = OBSERVATIONS.filter(o => o.teacher === 'Priya Sharma')
  const latestObs = myObs[0]
  const avgObsPct = myObs.reduce((a,o) => a + (o.score/o.max*100), 0) / myObs.length

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Greeting Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl gradient-brand p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">Hello,</p>
            <h2 className="font-display text-2xl lg:text-3xl text-white mb-2">Dear {user?.name}</h2>
            <p className="text-amber-300 font-semibold text-sm lg:text-base">
              Welcome to ATLAS – YOU ARE THE STAR PERFORMER OF THE SCHOOL ⭐
            </p>
            <p className="text-white/60 text-xs mt-2">Mathematics · Grade 8-A · Academic Year 2023–24</p>
          </div>
          <div className="hidden sm:flex w-14 h-14 bg-amber-400/20 rounded-2xl items-center justify-center flex-shrink-0">
            <Star size={28} className="text-amber-300" />
          </div>
        </div>
      </div>

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
      </div>

      {/* ── Syllabus Progress + LO Distribution ────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
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
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LO Distribution */}
        <div className="card p-6">
          <SectionHeader title="Learning Status" subtitle="Linear Equations · Current topic" />
          <LODonut
            approaching={LO_SUMMARY.approaching}
            meeting={LO_SUMMARY.meeting}
            exceeding={LO_SUMMARY.exceeding}
            height={200}
          />
        </div>
      </div>

      {/* ── Attendance Chart ────────────────────────────────────────────── */}
      <div className="card p-6">
        <SectionHeader title="Monthly Attendance Trend" subtitle="Grade 8-A · Current year" />
        <BarChartWidget
          data={ATTENDANCE_CHART}
          dataKey="pct" xKey="month"
          color="#1a56db" height={200} name="Attendance"
        />
      </div>

      {/* ── Module Quick Access ─────────────────────────────────────────── */}
      <div>
        <SectionHeader title="All Modules" subtitle="Quick access to every feature" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
