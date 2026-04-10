import { useState } from 'react'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge } from '../../components/ui/index.jsx'
import { WEEKLY_SCHEDULE } from '../../data/dummyData'
import { clsx } from 'clsx'

export default function TeacherSchedule() {
  const [activeDay, setActiveDay] = useState('Monday')

  const totalPeriods    = WEEKLY_SCHEDULE.reduce((a,d) => a + d.periods.length, 0)
  const completedPeriods = WEEKLY_SCHEDULE.reduce((a,d) => a + d.periods.filter(p=>p.status==='Completed').length, 0)
  const pendingPeriods   = totalPeriods - completedPeriods

  const dayData = WEEKLY_SCHEDULE.find(d => d.day === activeDay)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Periods"  value={totalPeriods}    icon={Clock}        color="blue" />
        <StatCard title="Completed"      value={completedPeriods} icon={CheckCircle}  color="green" />
        <StatCard title="Pending"        value={pendingPeriods}   icon={AlertCircle}  color="amber" />
      </div>

      {/* Day selector */}
      <div className="card p-1.5 flex gap-1">
        {WEEKLY_SCHEDULE.map(d => {
          const done  = d.periods.filter(p => p.status === 'Completed').length
          const total = d.periods.length
          const isActive = d.day === activeDay
          return (
            <button
              key={d.day}
              onClick={() => setActiveDay(d.day)}
              className={clsx(
                'flex-1 flex flex-col items-center py-2.5 px-2 rounded-xl text-xs font-medium transition-all duration-150',
                isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              <span className="font-semibold">{d.day.slice(0,3)}</span>
              <span className={clsx('mt-0.5 text-[10px]', isActive ? 'text-white/70' : 'text-slate-400')}>
                {done}/{total}
              </span>
            </button>
          )
        })}
      </div>

      {/* Period list */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="section-title">{activeDay}</h2>
          <p className="section-sub">
            {dayData?.periods.filter(p=>p.status==='Completed').length} of {dayData?.periods.length} periods completed
          </p>
        </div>

        <div className="divide-y divide-slate-50">
          {dayData?.periods.map(period => (
            <div
              key={period.no}
              className={clsx(
                'flex items-center gap-4 px-6 py-4 transition-colors',
                period.status === 'Completed' ? 'hover:bg-emerald-50/30' : 'hover:bg-amber-50/30'
              )}
            >
              {/* Period number */}
              <div className={clsx(
                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold',
                period.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              )}>
                {period.no}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm">
                  {period.subject}
                  {period.class !== '–' && (
                    <span className="ml-2 text-xs text-slate-400 font-normal">· {period.class}</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock size={11}/> {period.time}
                </p>
              </div>

              <StatusBadge status={period.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
