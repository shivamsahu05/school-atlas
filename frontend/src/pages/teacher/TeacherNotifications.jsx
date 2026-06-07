import { useState, useEffect, useCallback } from 'react'
import { Bell, AlertTriangle, Clock, BookOpen, Loader2, CheckCircle, Trash2, Info } from 'lucide-react'
import { SectionHeader, Modal } from '../../components/ui/index.jsx'
import { dashboardApi } from '../../api'
import { toast } from 'react-hot-toast'

const TYPE_CONFIG = {
  leave:      { icon: Clock,          color: 'bg-brand-50 border-brand-200', iconColor:'text-brand-600',  badge:'bg-brand-100 text-brand-700'  },
  alert:      { icon: AlertTriangle, color: 'bg-amber-50 border-amber-200', iconColor:'text-amber-600', badge:'bg-amber-100 text-amber-700' },
  event:      { icon: BookOpen,       color: 'bg-rose-50 border-rose-200',   iconColor:'text-rose-600',   badge:'bg-rose-100 text-rose-700'    },
  message:    { icon: Bell,           color: 'bg-purple-50 border-purple-200',iconColor:'text-purple-600',badge:'bg-purple-100 text-purple-700'},
  info:       { icon: Info,           color: 'bg-blue-50 border-blue-200',   iconColor:'text-blue-600',   badge:'bg-blue-100 text-blue-700'    },
}

export default function TeacherNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true)
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

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const handleClearAll = async () => {
    try {
      await dashboardApi.clearNotifications()
      setNotifications([])
      setShowClearConfirm(false)
      toast.success('Notification history cleared')
    } catch (err) {
      toast.error('Failed to clear history')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <SectionHeader title="My Notifications" subtitle={`${notifications.length} items`} />
          {notifications.length > 0 && (
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              title="Clear All History"
            >
              <Trash2 size={18}/>
            </button>
          )}
        </div>

        <div className="p-6">
          {error && <p className="text-sm text-rose-500 mb-3">{error}</p>}

          {notifications.length === 0
            ? (
              <div className="flex flex-col items-center py-20 text-slate-400">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="opacity-20"/>
                </div>
                <p className="text-sm font-medium">All caught up — no pending notifications.</p>
              </div>
            )
            : (
              <div className="space-y-4">
                {notifications.map(n => {
                  const cfg   = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
                  const Icon  = cfg.icon
                  return (
                    <div key={n.id} className={`flex items-start gap-4 rounded-2xl border px-5 py-4 transition-all hover:shadow-md ${cfg.color} ${!n.read ? 'ring-1 ring-brand-300 shadow-sm' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.badge}`}>
                        <Icon size={18}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'} ${cfg.iconColor}`}>{n.text}</p>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 bg-white/50 border border-current/10 uppercase tracking-wider`}>
                            {n.type}
                          </span>
                        </div>
                        {n.time && (
                          <div className="flex items-center gap-1.5 mt-2 text-slate-400">
                            <Clock size={12}/>
                            <p className="text-[11px] font-medium">{new Date(n.time).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      </div>

      <Modal 
        show={showClearConfirm} 
        onClose={() => setShowClearConfirm(false)}
        title="Clear My History?"
      >
        <div className="p-6">
          <p className="text-slate-600 text-sm leading-relaxed">
            Are you sure you want to permanently delete your notification history? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-8">
            <button 
              onClick={() => setShowClearConfirm(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
            <button 
              onClick={handleClearAll}
              className="px-6 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200"
            >
              Clear Now
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
