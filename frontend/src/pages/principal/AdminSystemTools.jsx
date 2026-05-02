import { useState } from 'react'
import { 
  RefreshCw, Users, ShieldAlert, FileText, 
  CheckCircle, ArrowRightCircle, AlertTriangle,
  History, Settings, Trash2, Database
} from 'lucide-react'
import { 
  StatCard, SectionHeader, StatusBadge, 
  Modal, InfoRow 
} from '../../components/ui/index.jsx'

/**
 * School Yearly System Tools
 * (Bulk Promotion, Session Reset, Data Archiving)
 */
export default function AdminSystemTools() {
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false)
  const [promoteStatus, setPromoteStatus] = useState('Idle') // Idle, Processing, Done
  
  const handlePromoteAll = () => {
    setPromoteStatus('Processing')
    setTimeout(() => {
      setPromoteStatus('Done')
    }, 2000)
  }

  const TOOLS = [
    {
      title: 'Yearly Student Promotion',
      desc: 'Bulk promote all students to next class. Transfers history and generates new Roll numbers.',
      icon: ArrowRightCircle,
      color: 'blue',
      action: () => setIsPromoteModalOpen(true)
    },
    {
      title: 'Teacher Permission Reset',
      desc: 'Revoke all time-bound module permissions for the new academic session.',
      icon: ShieldAlert,
      color: 'amber',
      action: () => alert('All permissions have been reset.')
    },
    {
      title: 'Academic Year Rollover',
      desc: 'Finalize 2023-24 data and prepare system for 2024-25. Archive old logs.',
      icon: RefreshCw,
      color: 'purple',
      action: () => alert('System rollover initiated...')
    },
    {
      title: 'Bulk Data Cleanup',
      desc: 'Remove duplicate student entries and legacy notification logs.',
      icon: Trash2,
      color: 'red',
      action: () => alert('Cleanup completed.')
    }
  ]

  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
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
             <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-widest">Active Session: 2023-24</span>
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

       {/* Promotion Modal */}
       <Modal open={isPromoteModalOpen} onClose={() => setIsPromoteModalOpen(false)} title="Bulk Student Promotion" size="md">
          <div className="space-y-6">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                 <div className="flex gap-3">
                    <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                    <div>
                       <p className="text-xs font-bold text-amber-800">Critical Action Warning</p>
                       <p className="text-[10px] text-amber-700 leading-relaxed mt-1">
                         This will move all "Active" students to the next grade (e.g., 8th to 9th). 
                         Please ensure all results have been finalized before proceeding. This CANNOT be undone easily.
                       </p>
                    </div>
                 </div>
              </div>

              {promoteStatus === 'Idle' && (
                <div className="space-y-4">
                   <InfoRow label="Total Students to Promote" value="840" />
                   <InfoRow label="Academic Year" value="2023-24 → 2024-25" />
                   <button onClick={handlePromoteAll} className="btn-primary w-full justify-center py-3">
                      Confirm & Start Promotion
                   </button>
                </div>
              )}

              {promoteStatus === 'Processing' && (
                <div className="py-8 text-center space-y-4">
                  <RefreshCw className="mx-auto text-brand-600 animate-spin" size={32} />
                  <p className="text-sm font-bold text-slate-700">Moving records, please wait...</p>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                     <div className="bg-brand-500 h-full w-2/3 animate-pulse" />
                  </div>
                </div>
              )}

              {promoteStatus === 'Done' && (
                <div className="py-8 text-center space-y-4">
                  <CheckCircle className="mx-auto text-emerald-500" size={48} />
                  <p className="text-sm font-bold text-slate-700">Promotion Successful!</p>
                  <p className="text-xs text-slate-400">All student records have been shifted to 2024-25 session.</p>
                  <button onClick={() => setIsPromoteModalOpen(false)} className="btn-secondary px-8">Close</button>
                </div>
              )}
          </div>
       </Modal>
    </div>
  )
}
