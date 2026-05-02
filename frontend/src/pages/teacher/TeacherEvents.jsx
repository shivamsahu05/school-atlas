import { useState, useEffect, useCallback } from 'react'
import { Calendar, Plus, Loader2, AlertTriangle, Trophy, Users } from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge, Modal } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { eventsApi } from '../../api'

export default function TeacherEvents() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [filter,  setFilter]  = useState('all')

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await eventsApi.getAll({ status: filter !== 'all' ? filter : undefined })
      setEvents(Array.isArray(res.data) ? res.data : (res.data?.items || res.events || res.items || []))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const upcoming  = events.filter(e => e.status === 'upcoming').length
  const ongoing   = events.filter(e => e.status === 'ongoing').length
  const completed = events.filter(e => e.status === 'completed').length

  const columns = [
    { key:'title',      label:'Event',     sortable:true },
    { key:'event_date', label:'Date',      sortable:true, render: v => v?.slice(0,10) || '—' },
    { key:'location',   label:'Location',  sortable:false },
    { key:'event_type', label:'Type',      sortable:true,
      render: v => <span className="text-xs font-semibold capitalize bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{v?.replace('_',' ')}</span> },
    { key:'target_class',label:'Class',    sortable:true },
    { key:'status',     label:'Status',    sortable:true, render: v => <StatusBadge status={v}/> },
    { key:'_count',     label:'Participants', sortable:false,
      render: (_,r) => r._count?.participants ?? 0 },
  ]

  const SELECT = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>
  if (error)   return (
    <div className="card p-8 text-center">
      <AlertTriangle size={28} className="text-rose-500 mx-auto mb-3"/>
      <p className="text-slate-600">{error}</p>
      <button onClick={fetchEvents} className="btn-primary btn mt-4">Retry</button>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Upcoming"  value={upcoming}  icon={Calendar} color="blue"  />
        <StatCard title="Ongoing"   value={ongoing}   icon={Trophy}   color="amber" />
        <StatCard title="Completed" value={completed} icon={Users}    color="green" />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader title="School Events" subtitle={`${events.length} events`} />
          <select value={filter} onChange={e => setFilter(e.target.value)} className={SELECT}>
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <DataTable columns={columns} rows={events} emptyMessage="No events found." />
      </div>
    </div>
  )
}
