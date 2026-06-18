import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, ClipboardList, Brain, TrendingUp, Calendar, Clock,
  User, Loader2, AlertTriangle, ChevronRight, Shield, Gift, PartyPopper, Star, Eye, Users, Filter,
  Bell, Trophy, Megaphone, LayoutDashboard
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { StatCard, SectionHeader, ProgressBar, SelectDropdown } from '../../components/ui/index.jsx'
import { LODonut } from '../../components/charts/index.jsx'
import { dashboardApi, intelligenceApi } from '../../api'
import clsx from 'clsx'

const COLOR_MAP = { blue: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-rose-50 text-rose-600', teal: 'bg-teal-50 text-teal-600', purple: 'bg-purple-50 text-purple-600' }
const MENU_ITEMS = [
  { label: 'Dashboard', desc: 'Main overview & KPIs', to: '/teacher', icon: LayoutDashboard, color: 'blue' },
  { label: 'Syllabus Tracking', desc: 'Chapter completion charts', to: '/teacher/syllabus', icon: BookOpen, color: 'green', perm: 'SYLLABUS_UPLOAD' },
  { label: 'Syllabus Report', desc: 'Syllabus status & report', to: '/teacher/syllabus-report', icon: ClipboardList, color: 'green', perm: 'SYLLABUS_UPLOAD' },
  { label: 'Learning Outcomes', desc: 'Student LO distribution', to: '/teacher/lo', icon: Brain, color: 'purple', perm: 'LO_ENTRY' },
  { label: 'Performance', desc: 'Analytics & observation', to: '/teacher/analytics', icon: TrendingUp, color: 'red', perm: 'MARKS_ENTRY' },
  { label: 'Time Table', desc: 'Weekly period overview', to: '/teacher/time-table', icon: Clock, color: 'blue' },
  { label: 'Micro Schedule', desc: 'Period-wise planning', to: '/teacher/schedule', icon: Calendar, color: 'blue', perm: 'MICRO_SCHEDULE' },
  { label: 'Events & Notices', desc: 'School events & updates', to: '/teacher/events', icon: Megaphone, color: 'amber' },
  { label: 'Competitions', desc: 'Track school competitions', to: '/teacher/competitions', icon: Trophy, color: 'purple' },
  { label: 'Leave Management', desc: 'Apply & track leaves', to: '/teacher/leave', icon: Clock, color: 'teal' },
  { label: 'Notifications', desc: 'Recent alerts & messages', to: '/teacher/notifications', icon: Bell, color: 'red' },
  { label: 'My Profile', desc: 'View your profile details', to: '/teacher/profile', icon: User, color: 'blue' },
  { label: 'Students', desc: 'Student list & profiles', to: '/teacher/students', icon: Users, color: 'green', perm: 'students_management' }
]

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [intel, setIntel] = useState(null)
  const [loading, setLoading] = useState(true)

  // Filters for Overall Completion
  const [filterSubject, setFilterSubject] = useState('All')
  const [filterClass, setFilterClass] = useState('All')

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const [dashRes, intelRes] = await Promise.all([dashboardApi.getTeacherDashboard(), intelligenceApi.getTeacherDashboard()])
      setData(dashRes.data); setIntel(intelRes.data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchDashboard();
    window.addEventListener('dashboard-refresh', fetchDashboard);
    return () => window.removeEventListener('dashboard-refresh', fetchDashboard);
  }, [fetchDashboard])

  const syllabusRows = data?.syllabusStatsByClass || []

  // Filter Options
  const subjects = useMemo(() => ['All', ...new Set(syllabusRows.map(r => r.subject))], [syllabusRows])
  const classes = useMemo(() => ['All', ...new Set(syllabusRows.map(r => r.class_name))], [syllabusRows])

  // Filtered Syllabus Logic - FIXED: String concatenation bug + Period counting
  const filteredMetrics = useMemo(() => {
    const filtered = syllabusRows.filter(r => {
      return (filterSubject === 'All' || r.subject === filterSubject) &&
        (filterClass === 'All' || r.class_name === filterClass);
    });
    // Use Number() to prevent string concatenation (e.g. 0 + "5" = "05")
    const total = filtered.reduce((acc, r) => acc + Number(r.total || 0), 0);
    const completed = filtered.reduce((acc, r) => acc + Number(r.completed || 0), 0);
    const total_periods = filtered.reduce((acc, r) => acc + Number(r.total_periods || 0), 0);
    const completed_periods = filtered.reduce((acc, r) => acc + Number(r.completed_periods || 0), 0);
    const pending_periods = total_periods - completed_periods;
    const pending = total - completed;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const period_pct = total_periods > 0 ? Math.round((completed_periods / total_periods) * 100) : 0;
    return { total, completed, pending, pct, total_periods, completed_periods, pending_periods, period_pct };
  }, [syllabusRows, filterSubject, filterClass]);

  const birthdayState = useMemo(() => {
    if (!data) return { today: [], thisWeek: [], isTeacherToday: false };
    const today = new Date();
    const list = data.birthdays || [];

    const isToday = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
    };

    const isThisWeek = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      // Check if it's within next 7 days
      const target = new Date(today.getFullYear(), d.getMonth(), d.getDate());
      const diffTime = target - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    };

    const teacherDob = data.profile?.dob;
    const isTeacherToday = isToday(teacherDob);
    const todayList = list.filter(b => isToday(b.date));
    const upcomingList = list.filter(b => !isToday(b.date) && isThisWeek(b.date));

    return { today: todayList, thisWeek: upcomingList, isTeacherToday };
  }, [data]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500" /></div>

  const intelData = intel || {}
  const syllabusStats = intelData?.syllabus || { completed: 0, total: 0, percentage: 0 }
  const loSummary = intelData?.lo || { approaching: 0, meeting: 0, exceeding: 0, total: 0 }
  const pendingAlerts = intelData?.not_done_students || []
  const isTopPerformer = (data?.topPerformers || []).some(p => p.teacher_id === user?.id);

  const primaryAssignment = data?.assignments?.[0] || {};
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

  const latestObs = data?.latestLoScore || { pct: 0 };
  const overallPerf = intelData.overall_score || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-[#0d225c] rounded-[2rem] p-6 md:p-8 lg:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-blue-200/80 text-xs font-bold uppercase tracking-widest">Hello,</p>
                {(() => {
                  const rankIndex = (data?.topPerformers || []).findIndex(p => p.teacher_id === user?.id);
                  if (rankIndex === 0) return <span className="bg-amber-400/20 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-lg border border-amber-400/30 uppercase tracking-tighter">⭐ Top 1 Performer</span>;
                  if (rankIndex === 1) return <span className="bg-blue-400/20 text-blue-300 text-[9px] font-black px-2 py-0.5 rounded-lg border border-blue-400/30 uppercase tracking-tighter">⭐ Top 2 Performer</span>;
                  if (rankIndex === 2) return <span className="bg-slate-400/20 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded-lg border border-slate-400/30 uppercase tracking-tighter">⭐ Top 3 Performer</span>;
                  return null;
                })()}
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">Dear <span className="text-white">{user?.name || 'Teacher'}</span></h1>
              <div className="space-y-1">
                {(() => {
                  const rankIndex = (data?.topPerformers || []).findIndex(p => p.teacher_id === user?.id);
                  const rank = rankIndex !== -1 ? rankIndex + 1 : null;
                  const score = rankIndex !== -1 ? Number(data?.topPerformers[rankIndex]?.weighted_score || 0) : 0;
                  const isStar = (rank && rank <= 5) || score >= 85;
                  if (isStar) {
                    return <p className="text-amber-400 text-xs md:text-sm font-black uppercase tracking-tight flex items-center gap-2">Welcome to ATLAS — You are one of the Star Performers of the School 🌟</p>;
                  }
                  return <p className="text-blue-300 text-xs md:text-sm font-black uppercase tracking-tight flex items-center gap-2">Welcome to ATLAS — Keep up the great work and continue making an impact.</p>;
                })()}
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">{primaryAssignment.subject || 'Academic'} · {academicYear}</p>
              </div>
            </div>
            {(() => {
               const rankIndex = (data?.topPerformers || []).findIndex(p => p.teacher_id === user?.id);
               const rank = rankIndex !== -1 ? rankIndex + 1 : null;
               const score = rankIndex !== -1 ? Number(data?.topPerformers[rankIndex]?.weighted_score || 0) : 0;
               const isStar = (rank && rank <= 5) || score >= 85;
               if (!isStar) return null;
               return (
                 <div className="flex gap-2">
                   <div className="hidden lg:block w-20 h-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-lg"><Star className="text-amber-400 fill-amber-400" size={32} /></div>
                   <div className="hidden lg:block w-20 h-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-lg"><Star className="text-amber-400 fill-amber-400" size={32} /></div>
                 </div>
               )
            })()}
        </div>
      </div>

      {/* KPI StatCards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard title="Periods Completed" value={`${syllabusStats.periods_completed || 0}/${syllabusStats.periods_total || 0}`} subtitle={`${syllabusStats.percentage || 0}% of syllabus`} icon={BookOpen} color="brand" trend={syllabusStats.percentage || 0} />
        {(() => {
          const loPct = loSummary.total > 0 ? Math.round(((loSummary.exceeding * 100) + (loSummary.meeting * 80) + (loSummary.approaching * 60)) / loSummary.total) : 0;
          return <StatCard title="LO Achievement" value={`${loPct}%`} subtitle="Avg teacher score" icon={Brain} color="green" trend={loPct} />;
        })()}
        <StatCard title="Latest Obs." value={`${latestObs.pct}%`} subtitle="Classroom observation" icon={Eye} color="teal" trend={latestObs.pct} />
        <StatCard title="Overall Performance" value={`${Math.round(overallPerf)}%`} subtitle="Weighted score" icon={TrendingUp} color="amber" trend={overallPerf} />
      </div>

      {/* Birthday Celebration - Premium Soft Blue Design (Relocated) */}
      {(birthdayState.isTeacherToday || birthdayState.today.length > 0 || birthdayState.thisWeek.length > 0) && (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-[2rem] p-5 md:p-6 text-slate-800 shadow-sm border border-blue-100/30 flex flex-col md:flex-row items-center gap-6 group">
          {/* Subtle Festive Accents */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute top-0 left-0 w-3 h-full bg-indigo-500/60 rounded-l-[2rem] pointer-events-none" />

          <div className="flex items-center gap-4 shrink-0 md:border-r border-indigo-100 md:pr-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-blue-100 shadow-sm">
              <Gift className="text-indigo-500 animate-bounce" size={24} />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 leading-none mb-1.5">Celebrations</h2>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-tight">Weekly Star Forecast</p>
            </div>
          </div>

          <div className="flex-1 flex flex-wrap items-center gap-3 relative z-10">
            {/* Today Section */}
            {(birthdayState.isTeacherToday || birthdayState.today.length > 0) && (
              <div className="flex items-center gap-2">
                {birthdayState.isTeacherToday && (
                  <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm shadow-indigo-200 animate-pulse">
                    <span className="text-sm">🎂</span>
                    <p className="text-[10px] font-black uppercase tracking-tight">Your Birthday!</p>
                  </div>
                )}
                {birthdayState.today.map((stu, i) => (
                  <div key={i} className="bg-white border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-2.5 shadow-sm hover:shadow-md transition-all">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                      Today: <span className="text-indigo-600">{stu.name}</span>
                      <span className="text-slate-400 ml-2 font-bold text-[9px] tracking-widest bg-slate-50 px-1.5 py-0.5 rounded-md">Grade {stu.class}</span>
                    </p>
                    <PartyPopper size={12} className="text-indigo-400" />
                  </div>
                ))}
              </div>
            )}

            {/* Vertical Separator */}
            {(birthdayState.today.length > 0 || birthdayState.isTeacherToday) && birthdayState.thisWeek.length > 0 && (
              <div className="w-px h-8 bg-indigo-100/50 mx-2 hidden md:block" />
            )}

            {/* Upcoming Section */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
              {birthdayState.thisWeek.slice(0, 5).map((stu, i) => {
                const bday = new Date(stu.date);
                const dayName = bday.toLocaleDateString('en-GB', { weekday: 'short' });
                const dayNum = bday.getDate();
                const monthName = bday.toLocaleDateString('en-GB', { month: 'short' });

                return (
                  <div key={i} className="flex items-center gap-3 bg-white/60 border border-indigo-50 px-3 py-1.5 rounded-xl hover:bg-white hover:border-indigo-200 transition-all group/item min-w-[140px] shadow-sm">
                    <div className="bg-white rounded-lg p-1 px-2 border border-indigo-50 group-hover/item:border-indigo-100 text-center">
                      <p className="text-[7px] font-black text-slate-300 uppercase leading-none">{monthName}</p>
                      <p className="text-xs font-black text-indigo-500 leading-none mt-0.5">{dayNum}</p>
                    </div>
                    <div className="flex flex-col leading-tight overflow-hidden">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">{stu.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Grade {stu.class} · {dayName}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-300 hover:text-indigo-500 transition-colors cursor-pointer group/link ml-auto pl-4 border-l border-indigo-100">
            <span className="text-[9px] font-black uppercase tracking-widest">Calendar</span>
            <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
          </div>
        </div>
      )}

      {/* Overall Completion Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-[2rem] shadow-sm border border-slate-100/50 flex flex-col space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Overall Completion</h2>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filterSubject === 'All' ? 'All Subjects' : filterSubject} · {filterClass === 'All' ? 'All Grades' : `Grade ${filterClass}`}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 w-full md:w-auto">
              <SelectDropdown label="Grade - Class" options={classes} value={filterClass} onChange={e => setFilterClass(e.target.value)} />
              <SelectDropdown label="Subject" options={subjects} value={filterSubject} onChange={e => setFilterSubject(e.target.value)} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-tight">Week successfully completed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-[#0d225c] tracking-tighter">{filteredMetrics.completed}</span>
                  <span className="text-slate-300 text-base md:text-lg font-bold">/ {filteredMetrics.total}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 leading-none mb-1">{filteredMetrics.completed}/{filteredMetrics.total}</p>
                <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter leading-none">{filteredMetrics.pct}%</p>
              </div>
            </div>
            <div className="h-2.5 md:h-3.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(37,99,235,0.3)]" style={{ width: `${filteredMetrics.pct}%` }} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-tight">Periods successfully completed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-indigo-900 tracking-tighter">{filteredMetrics.completed_periods}</span>
                  <span className="text-slate-300 text-base md:text-lg font-bold">/ {filteredMetrics.total_periods}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-300 leading-none mb-1">{filteredMetrics.completed_periods}/{filteredMetrics.total_periods}</p>
                <p className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter leading-none">{filteredMetrics.period_pct}%</p>
              </div>
            </div>
            <div className="h-2.5 md:h-3.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(99,102,241,0.3)]" style={{ width: `${filteredMetrics.period_pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 pt-2 md:pt-4">
            {[
              { val: filteredMetrics.total, lab: 'Total Weeks', col: 'slate', bg: 'bg-slate-50/50', border: 'border-slate-100', text: 'text-slate-800' },
              { val: filteredMetrics.completed, lab: 'Completed Weeks', col: 'emerald', bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-600' },
              { val: filteredMetrics.total_periods, lab: 'Total Periods', col: 'indigo', bg: 'bg-indigo-50/50', border: 'border-indigo-100', text: 'text-indigo-600' },
              { val: filteredMetrics.completed_periods, lab: 'Completed Periods', col: 'emerald', bg: 'bg-emerald-50/50', border: 'border-emerald-100', text: 'text-emerald-600' }
            ].map((item, idx) => (
              <div key={idx} className={clsx(item.bg, item.border, "p-3 md:p-5 rounded-2xl md:rounded-3xl border text-center group hover:bg-white hover:shadow-md transition-all flex flex-col items-center justify-center")}>
                <p className={clsx("text-2xl md:text-[36px] font-black tracking-tighter leading-none mb-1 md:mb-2", item.text)}>{item.val}</p>
                <p className={clsx("text-[7px] md:text-[10px] font-black uppercase tracking-widest leading-none", idx === 0 ? "text-slate-400" : (idx === 1 || idx === 3) ? "text-emerald-500" : "text-indigo-500")}>{item.lab}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Overview Donut */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100/50 flex flex-col items-center">
          <div className="w-full mb-4"><SectionHeader title="Learning Status" subtitle="Performance Overview" /></div>
          <div className="flex-1 flex flex-col items-center justify-center py-4 w-full">
            <LODonut approaching={loSummary.approaching} meeting={loSummary.meeting} exceeding={loSummary.exceeding} height={200} />
            <div className="mt-8 grid grid-cols-1 gap-y-3 w-full px-4">
              {[
                { label: 'Approaching', count: loSummary.approaching, color: '#f59e0b' },
                { label: 'Meeting', count: loSummary.meeting, color: '#2563eb' },
                { label: 'Exceeding', count: loSummary.exceeding, color: '#10b981' }
              ].map(cat => (
                <div key={cat.label} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cat.color }} />
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{cat.label}</p>
                  </div>
                  <p className="text-[11px] font-black text-slate-400 leading-none">{cat.count} Topics</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Modules */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 rounded-[2rem]">
          <SectionHeader title="Top Performers" />
          <div className="space-y-2.5 mt-4">
            {(data?.topPerformers || []).slice(0, 5).map((p, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 rounded-xl transition-all ${p.teacher_id === user?.id ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50/50 border border-slate-100/50'}`}>
                <div className="w-6 h-6 rounded-lg bg-white shadow-sm text-[9px] font-black flex items-center justify-center text-slate-400">{i + 1}</div>
                <div className="flex-1 min-w-0"><p className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight">{p.teacher_name}</p></div>
                <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{Number(p.weighted_score).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6 rounded-[2rem]">
          <SectionHeader title="Quick Modules" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {MENU_ITEMS.filter(item => {
              if (!item.perm) return true;
              return (data?.permissions || []).some(p => p.module_key === item.perm);
            }).map(({ label, to, icon: Icon, color }) => (
              <Link key={to} to={to} className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 hover:shadow-md transition-all group hover:-translate-y-1 text-center">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${COLOR_MAP[color]}`}><Icon size={18} /></div>
                <p className="font-black text-slate-800 text-[10px] group-hover:text-brand-600 tracking-tight leading-none uppercase">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
