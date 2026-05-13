import { useState, useEffect } from 'react'
import { 
  RefreshCw, ShieldAlert, CheckCircle, ArrowRightCircle,
  Trash2
} from 'lucide-react'
import { 
  SectionHeader, StatusBadge, 
  Modal, InfoRow 
} from '../../components/ui/index.jsx'
import { systemApi } from '../../services/schoolApi'
import { toast } from 'react-hot-toast'

/**
 * School Yearly System Tools
 */
export default function AdminSystemTools() {
  const [activeSession, setActiveSession] = useState('Loading...')

  useEffect(() => {
    systemApi.getStatus().then(res => {
      setActiveSession(res.data.session)
    }).catch(err => {
      setActiveSession('Unknown')
    })
  }, [])

  const doubleConfirmAction = async (taskName, apiCall) => {
    if (window.confirm(`WARNING: Are you sure you want to execute [${taskName}]?`)) {
      if (window.confirm(`FINAL WARNING: This is a critical action and cannot be undone. Are you ABSOLUTELY certain you want to proceed with [${taskName}]?`)) {
        try {
          const res = await apiCall()
          toast.success(res.data.message || 'Task completed successfully.')
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to execute task.')
        }
      }
    }
  }

  const TOOLS = [
    {
      title: 'Academic Year Rollover',
      desc: 'Finalize 2023-24 data and prepare system for 2024-25. Archive old logs.',
      icon: RefreshCw,
      color: 'purple',
      action: () => doubleConfirmAction('Academic Year Rollover', systemApi.rolloverYear)
    },
    {
      title: 'Teacher Permission Reset',
      desc: 'Revoke all time-bound module permissions for the new academic session.',
      icon: ShieldAlert,
      color: 'amber',
      action: () => doubleConfirmAction('Teacher Permission Reset', systemApi.resetPermissions)
    },
    {
      title: 'Bulk Data Cleanup',
      desc: 'Remove duplicate student entries and legacy notification logs.',
      icon: Trash2,
      color: 'red',
      action: () => doubleConfirmAction('Bulk Data Cleanup', systemApi.cleanupData)
    }
  ]

  const colorMap = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100'
  }

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex items-center justify-between">
          <div>
             <h1 className="text-2xl font-display font-bold text-slate-800">System Management Tools</h1>
             <p className="text-sm text-slate-500">Critical administration tasks for session rollover and data integrity</p>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">Active Session: {activeSession}</span>
          </div>
       </div>

       <div className="grid md:grid-cols-2 gap-4">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon
            return (
              <div key={i} className="card p-6 flex items-start gap-4 hover:shadow-panel transition-all">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${colorMap[tool.color]}`}>
                    <Icon size={24} />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{tool.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tool.desc}</p>
                    <button 
                      onClick={tool.action}
                      className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
                    >
                      Initialize Task <ArrowRightCircle size={14} />
                    </button>
                 </div>
              </div>
            )
          })}
       </div>

       <div className="card p-6">
          <SectionHeader title="System Activity Logs" subtitle="Recent administrative actions" />
          <div className="mt-4 space-y-3">
             {[
               { user: 'Principal', task: 'Created Teacher account for "Amit Kumar"', time: '2h ago' },
               { user: 'System', task: 'Auto-archived 500+ old notifications', time: '5h ago' },
               { user: 'Principal', task: 'Granted "Marks Entry" to Grade 10 Math teacher', time: '1d ago' },
             ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-200 text-xs">
                   <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">{log.user}</span>
                      <span className="text-slate-400 tracking-tight">{log.task}</span>
                   </div>
                   <span className="text-slate-400 italic">{log.time}</span>
                </div>
             ))}
          </div>
       </div>

    </div>
  )
}
