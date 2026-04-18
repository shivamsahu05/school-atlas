import { useMemo, useState } from 'react'
import { 
  ClipboardList, BookOpen, Key, Cake, Clock, 
  Inbox, Filter, Bell, UserPlus, AlertTriangle, 
  CheckCircle, MessageCircle, Trophy
} from 'lucide-react'
import { SectionHeader, EmptyState } from '../../components/ui/index.jsx'
import { 
  WEEKLY_HOMEWORK, WEEKLY_SYLLABUS, BIRTHDAYS, LEAVES, STUDENTS 
} from '../../data/dummyData'
import clsx from 'clsx'

const NotificationCard = ({ icon: Icon, title, subtitle, date, type = 'info', action }) => {
  const iconStyles = {
    warning: 'bg-amber-100 text-amber-600',
    error:   'bg-rose-100 text-rose-600',
    info:    'bg-blue-100 text-blue-600',
    success: 'bg-emerald-100 text-emerald-700',
    purple:  'bg-purple-100 text-purple-600',
    teal:    'bg-teal-100 text-teal-600'
  }

  const borderStyles = {
    warning: 'border-amber-100',
    error:   'border-rose-100',
    info:    'border-blue-100',
    success: 'border-emerald-100',
    purple:  'border-purple-100',
    teal:    'border-teal-100'
  }

  return (
    <div className={clsx(
      "flex items-start gap-4 p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all animate-slide-up",
      borderStyles[type]
    )}>
      <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", iconStyles[type])}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-800 truncate">{title}</p>
          {date && <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap uppercase tracking-wider">{date}</span>}
        </div>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{subtitle}</p>
        {action && (
          <button className="mt-2 text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-widest transition-colors">
            {action}
          </button>
        )}
      </div>
    </div>
  )
}

const NotificationGroup = ({ title, items }) => {
  if (!items?.length) return null
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(item => (
          <NotificationCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  )
}

export default function AdminNotifications() {
  const [filterType, setFilterType] = useState('All')

  const groups = useMemo(() => {
    const hw = WEEKLY_HOMEWORK.filter(h => h.defaulters.length > 0).map(h => ({
      id: `hw-${h.id}`,
      icon: AlertTriangle,
      title: `Defaulters: ${h.subject}`,
      subtitle: `${h.defaulters.length} students have not submitted homework for ${h.class}.`,
      date: `Week ${h.week}`,
      type: 'error',
      action: 'View Defaulters'
    }))

    const syl = WEEKLY_SYLLABUS.filter(s => s.pct < 50).map(s => ({
      id: `syl-${s.week}-${s.class}`,
      icon: BookOpen,
      title: 'Syllabus Lagging',
      subtitle: `${s.teacher}'s ${s.subject} class for ${s.class} is at ${s.pct}% completion.`,
      date: `Week ${s.week}`,
      type: 'warning',
      action: 'Check Details'
    }))

    const lv = LEAVES.filter(l => l.status === 'Pending').map(l => ({
      id: `lv-${l.id}`,
      icon: Clock,
      title: `Leave Request: ${l.teacher}`,
      subtitle: `${l.type} leave for ${l.duration} starting ${l.from}. Reason: ${l.reason}`,
      date: 'Pending',
      type: 'info',
      action: 'Review Request'
    }))

    const bd = BIRTHDAYS.filter(b => b.month === new Date().getMonth() + 1 && b.day === new Date().getDate()).map(b => ({
      id: `bd-${b.id}`,
      icon: Cake,
      title: `Birthday Today: ${b.name}`,
      subtitle: `Celebrate ${b.name}'s birthday (${b.role}).`,
      date: 'Today',
      type: 'success'
    }))

    const sys = [
      { id: 'sys-1', icon: UserPlus, title: 'New Admission', subtitle: 'A new student, Rahul Sharma, has been added to Grade 8-A.', date: '2h ago', type: 'teal' },
      { id: 'sys-2', icon: Trophy, title: 'Event Scheduled', subtitle: 'Science Fair 2024 has been marked in the school calendar.', date: '1d ago', type: 'purple' }
    ]

    return { hw, syl, lv, bd, sys }
  }, [])

  const filteredGroups = useMemo(() => {
    if (filterType === 'All') return groups
    const map = {
      'Academic': { hw: groups.hw, syl: groups.syl },
      'Staff': { lv: groups.lv },
      'Social': { bd: groups.bd },
      'System': { sys: groups.sys }
    }
    return map[filterType] || {}
  }, [groups, filterType])

  const totalItems = Object.values(groups).flat().length
  const SELECT = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <SectionHeader 
        title="Admin Notifications" 
        subtitle="Complete history of administrative alerts and school activities" 
      />

      {/* Filter Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        {['All', 'Academic', 'Staff', 'Social', 'System'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={clsx(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              filterType === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {totalItems === 0 ? (
        <div className="card py-24 flex items-center justify-center">
          <EmptyState 
            icon={Inbox} 
            message="No notification history available." 
          />
        </div>
      ) : (
        <div className="space-y-10">
          <NotificationGroup title="Homework & Syllabus Alerts" items={[...(filteredGroups.hw || []), ...(filteredGroups.syl || [])]} />
          <NotificationGroup title="Staff Leave Requests" items={filteredGroups.lv} />
          <NotificationGroup title="Upcoming Events & Birthdays" items={[...(filteredGroups.bd || []), ...(filteredGroups.sys || [])]} />
        </div>
      )}
    </div>
  )
}
