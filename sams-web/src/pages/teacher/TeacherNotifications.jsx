import { useMemo, useState } from 'react'
import { 
  ClipboardList, BookOpen, Key, Cake, Clock, 
  Inbox, Filter 
} from 'lucide-react'
import { SectionHeader, EmptyState } from '../../components/ui/index.jsx'
import { 
  HOMEWORK, SYLLABUS_ITEMS, PERMISSIONS, BIRTHDAYS, LEAVES 
} from '../../data/dummyData'
import clsx from 'clsx'

const NotificationCard = ({ icon: Icon, title, subtitle, date, type = 'info', action }) => {
  const iconStyles = {
    warning: 'bg-amber-100 text-amber-600',
    error:   'bg-rose-100 text-rose-600',
    info:    'bg-blue-100 text-blue-600',
    success: 'bg-emerald-100 text-emerald-600',
  }

  const borderStyles = {
    warning: 'border-amber-100',
    error:   'border-rose-100',
    info:    'border-blue-100',
    success: 'border-emerald-100',
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
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{subtitle}</p>
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
      <div className="grid gap-3">
        {items.map(item => (
          <NotificationCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  )
}

export default function TeacherNotifications() {
  const todayStr = '2026-04-12'

  // Filters for homework alerts
  const [filterClass, setFilterClass] = useState('All')
  const [filterSection, setFilterSection] = useState('All')
  const [filterSubject, setFilterSubject] = useState('All')

  // Extract class/section/subject from homework data
  const hwList = HOMEWORK ?? []
  const classMap = useMemo(() => {
    const map = {}
    hwList.forEach(h => {
      const cls = h?.class ?? ''
      const match = cls.match(/Grade\s+(\d+)-([A-Z])/)
      if (match) {
        const [, base, sec] = match
        if (!map[base]) map[base] = new Set()
        map[base].add(sec)
      }
    })
    Object.keys(map).forEach(k => { map[k] = [...map[k]] })
    return map
  }, [hwList])

  const baseClasses = Object.keys(classMap)
  const availableSections = filterClass === 'All' ? [] : (classMap[filterClass] || [])
  const uniqueSubjects = [...new Set(hwList.map(h => h?.subject).filter(Boolean))]

  const groups = useMemo(() => {
    // Filter homework by class/section/subject
    const filteredHw = hwList.filter(h => {
      if ((h?.submitted ?? 0) >= (h?.total ?? 0)) return false
      const cls = h?.class ?? ''
      const match = cls.match(/Grade\s+(\d+)-([A-Z])/)
      if (filterClass !== 'All' && match) {
        if (match[1] !== filterClass) return false
        if (filterSection !== 'All' && match[2] !== filterSection) return false
      }
      if (filterSubject !== 'All' && h?.subject !== filterSubject) return false
      return true
    })

    const hw = filteredHw.map(h => ({
      id: `hw-${h?.id ?? Math.random()}`,
      icon: ClipboardList,
      title: `Pending: ${h?.subject ?? 'Assessment'}`,
      subtitle: `${h?.description ?? 'No description'}. ${(h?.total ?? 0) - (h?.submitted ?? 0)} students yet to submit.`,
      date: `Due ${h?.due ?? '-'}`,
      type: (h?.due ?? '') < todayStr ? 'error' : 'warning',
      action: 'Check Submissions'
    }))

    const syl = (SYLLABUS_ITEMS ?? []).filter(s => {
      const status = s?.status || (s?.completed ? 'completed' : 'pending')
      return status !== 'completed' && (s?.plannedDate ?? '') < todayStr
    }).map(s => ({
      id: `syl-${s?.id ?? Math.random()}`,
      icon: BookOpen,
      title: `Delayed: ${s?.topic ?? 'Topic'}`,
      subtitle: `${s?.chapter || s?.unit || '-'}. Planned for ${s?.plannedDate ?? '-'}.`,
      date: 'Delayed',
      type: 'error',
      action: 'Go to Syllabus'
    }))

    const perm = (PERMISSIONS ?? []).filter(p => (p?.daysLeft ?? 0) <= 2).map(p => ({
      id: `perm-${p?.id ?? Math.random()}`,
      icon: Key,
      title: `Permission ${(p?.daysLeft ?? 0) <= 0 ? 'Expired' : 'Expiring'}`,
      subtitle: `${p?.action ?? 'Access'} for ${p?.class ?? '-'} (${p?.subject ?? '-'})`,
      date: (p?.daysLeft ?? 0) <= 0 ? 'Expired' : `${p?.daysLeft}d left`,
      type: (p?.daysLeft ?? 0) <= 0 ? 'error' : 'warning',
      action: 'Request Extension'
    }))

    const bd = (BIRTHDAYS ?? []).filter(b => b?.month === 4 && b?.day === 12).map(b => ({
      id: `bd-${b?.id ?? Math.random()}`,
      icon: Cake,
      title: `Birthday Today: ${b?.name ?? 'Student'}`,
      subtitle: `Happy Birthday to ${b?.name ?? '?'} (${b?.role ?? '-'}).`,
      date: 'Today',
      type: 'success'
    }))

    const lv = (LEAVES ?? []).slice(0, 5).map(l => ({
      id: `lv-${l?.id ?? Math.random()}`,
      icon: Clock,
      title: `Leave: ${l?.status ?? 'Update'}`,
      subtitle: `${l?.type ?? 'Leave'} from ${l?.from ?? '-'} to ${l?.to ?? '-'}. Applied on ${l?.applied ?? '-'}.`,
      date: l?.applied ?? '-',
      type: l?.status === 'Approved' ? 'info' : l?.status === 'Rejected' ? 'error' : 'warning'
    }))

    return { hw, syl, perm, bd, lv }
  }, [todayStr, filterClass, filterSection, filterSubject])

  const totalItems = Object.values(groups).flat().length
  const SELECT = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <SectionHeader 
        title="Notifications Center" 
        subtitle="Dynamic alerts from all academic departments" 
      />

      {/* Filters: Class > Section > Subject */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-slate-400" />
        <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterSection('All') }} className={SELECT}>
          <option value="All">All Classes</option>
          {baseClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className={SELECT} disabled={filterClass === 'All'}>
          <option value="All">All Sections</option>
          {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
        </select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className={SELECT}>
          <option value="All">All Subjects</option>
          {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {totalItems === 0 ? (
        <div className="card py-24 flex items-center justify-center">
          <EmptyState 
            icon={Inbox} 
            message="No notifications available at the moment." 
          />
        </div>
      ) : (
        <div className="max-w-4xl space-y-10">
          <NotificationGroup title="Homework Alerts" items={groups.hw} />
          <NotificationGroup title="Syllabus Status" items={groups.syl} />
          <NotificationGroup title="Permissions" items={groups.perm} />
          <NotificationGroup title="Today's Birthdays" items={groups.bd} />
          <NotificationGroup title="Leave Updates" items={groups.lv} />
        </div>
      )}
    </div>
  )
}
