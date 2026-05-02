import { useState, useEffect, useCallback } from 'react'
import { Bell, AlertTriangle, Clock, BookOpen, Loader2, CheckCircle } from 'lucide-react'
import { SectionHeader } from '../../components/ui/index.jsx'
import { dashboardApi } from '../../api'

const TYPE_ICON = {
  leave:   Clock,
  alert:   AlertTriangle,
  event:   BookOpen,
  message: Bell
}
const TYPE_COLOR = {
  leave:   'bg-brand-50 border-brand-200 text-brand-700',
  alert:   'bg-amber-50 border-amber-200 text-amber-700',
  event:   'bg-rose-50 border-rose-200 text-rose-700',
  message: 'bg-purple-50 border-purple-200 text-purple-700'
}

export default function TeacherNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true)
      const { intelligenceApi } = await import('../../api')
      const res = await intelligenceApi.getNotifications()
      
      const rawNotifs = Array.isArray(res.data) ? res.data : []
      const notifs = rawNotifs.map(n => ({
        id:      n.id,
        type:    n.type,
        message: n.text,
        date:    n.time,
      }))

      setNotifications(notifs)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6">
        <SectionHeader title="My Notifications" subtitle={`${notifications.length} items`} />
        {notifications.length === 0
          ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <CheckCircle size={40} className="mb-3 opacity-30"/>
              <p className="text-sm">All caught up — no pending notifications.</p>
            </div>
          )
          : (
            <div className="mt-5 space-y-3">
              {notifications.map(n => {
                const Icon  = TYPE_ICON[n.type] || Bell
                const color = TYPE_COLOR[n.type] || 'bg-slate-50 border-slate-200 text-slate-700'
                return (
                  <div key={n.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${color}`}>
                    <Icon size={16} className="flex-shrink-0 mt-0.5"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{n.message}</p>
                      {n.date && <p className="text-xs opacity-70 mt-0.5">{n.date?.slice(0,10)}</p>}
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
