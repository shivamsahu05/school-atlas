import { useState, useEffect, useCallback } from 'react'
import { Bell, AlertTriangle, Clock, BookOpen, CheckCircle, Cake, Loader2, Shield } from 'lucide-react'
import { SectionHeader, StatCard } from '../../components/ui/index.jsx'
import { dashboardApi } from '../../api'

const TYPE_CONFIG = {
  leave:      { icon: Clock,          color: 'bg-brand-50 border-brand-200', iconColor:'text-brand-600',  badge:'bg-brand-100 text-brand-700'  },
  alert:      { icon: AlertTriangle, color: 'bg-amber-50 border-amber-200', iconColor:'text-amber-600', badge:'bg-amber-100 text-amber-700' },
  event:      { icon: BookOpen,       color: 'bg-rose-50 border-rose-200',   iconColor:'text-rose-600',   badge:'bg-rose-100 text-rose-700'    },
  message:    { icon: Bell,           color: 'bg-purple-50 border-purple-200',iconColor:'text-purple-600',badge:'bg-purple-100 text-purple-700'},
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [filterType,    setFilterType]    = useState('All')

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await dashboardApi.getNotifications()
      if (res.success) {
        setNotifications(res.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = filterType === 'All'
    ? notifications
    : notifications.filter(n => n.type === filterType)

  const highCount   = notifications.filter(n => n.priority === 'high').length
  const mediumCount = notifications.filter(n => n.priority === 'medium').length

  const SELECT = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total"   value={notifications.length} icon={Bell}          color="blue"  />
        <StatCard title="Urgent"  value={highCount}            icon={AlertTriangle}  color="red"   />
        <StatCard title="Medium"  value={mediumCount}          icon={Clock}          color="amber" />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader title="All Notifications" subtitle={`${filtered.length} items`}/>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={SELECT}>
            <option>All</option>
            {Object.keys(TYPE_CONFIG).map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {error && <p className="text-sm text-rose-500 mb-3">{error}</p>}

        {filtered.length === 0
          ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <CheckCircle size={40} className="mb-3 opacity-30"/>
              <p className="text-sm">No notifications right now.</p>
            </div>
          )
          : (
            <div className="space-y-3">
              {filtered.map(n => {
                const cfg   = TYPE_CONFIG[n.type] || TYPE_CONFIG.alert
                const Icon  = cfg.icon
                return (
                  <div key={n.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${cfg.color}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.badge}`}>
                      <Icon size={15}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className={`text-sm font-medium ${cfg.iconColor}`}>{n.text}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 bg-slate-100 text-slate-600`}>
                          {n.type}
                        </span>
                      </div>
                      {n.time && <p className="text-xs opacity-60 mt-0.5">{new Date(n.time).toLocaleString()}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  )
}
