import { useState, useEffect } from 'react'
import { 
  RefreshCw, ShieldAlert, CheckCircle, ArrowRightCircle,
  Trash2, Users, AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react'
import { 
  SectionHeader, StatusBadge, 
  Modal, InfoRow 
} from '../../components/ui/index.jsx'
import { systemApi, studentApi, academicApi } from '../../services/schoolApi'
import { toast } from 'react-hot-toast'

/**
 * School Yearly System Tools
 */
export default function AdminSystemTools() {
  const [activeSession, setActiveSession] = useState('Loading...')

  // Bulk Promote States
  const [isBulkPromoteOpen, setIsBulkPromoteOpen] = useState(false)
  const [promoData, setPromoData] = useState([])
  const [promoClasses, setPromoClasses] = useState([])
  const [loadingPromo, setLoadingPromo] = useState(false)
  const [expandedClasses, setExpandedClasses] = useState({})
  
  // Confirmation Flow
  const [confirmStep, setConfirmStep] = useState(0)

  useEffect(() => {
    systemApi.getStatus().then(res => {
      setActiveSession(res.data.session)
    }).catch(err => {
      setActiveSession('Unknown')
    })
  }, [])

  useEffect(() => {
    if (isBulkPromoteOpen) {
      fetchPromoData()
    } else {
      setConfirmStep(0)
    }
  }, [isBulkPromoteOpen])

  const fetchPromoData = async () => {
    setLoadingPromo(true)
    try {
      const [stuRes, clsRes] = await Promise.all([
        studentApi.getAll({ class_id: 'All' }),
        academicApi.getClasses()
      ])
      
      const students = stuRes.data.data || []
      const classes = clsRes.data.data || clsRes.data.classes || []
      
      setPromoClasses(classes.sort((a,b) => a.sort_order - b.sort_order))
      setPromoData(students.map(s => ({
        ...s,
        promote: s.status === 'Active' // checked by default if Active
      })))
      
      if (classes.length > 0) {
        setExpandedClasses({ [classes[0].id]: true })
      }
    } catch (err) {
      toast.error('Failed to load data for bulk promotion')
    } finally {
      setLoadingPromo(false)
    }
  }

  const togglePromote = (studentId) => {
    setPromoData(prev => prev.map(s => s.id === studentId ? { ...s, promote: !s.promote } : s))
  }

  const toggleClassExpand = (classId) => {
    setExpandedClasses(prev => ({ ...prev, [classId]: !prev[classId] }))
  }

  const executeBulkPromote = async () => {
    try {
      const sortedPromoData = [...promoData].sort((a, b) => a.name.localeCompare(b.name))
      const payload = {
        promotions: sortedPromoData.map(s => ({ student_id: s.id, promote: s.promote }))
      }
      const res = await systemApi.bulkPromote(payload)
      toast.success(res.data.message || 'Bulk promotion completed successfully.')
      setIsBulkPromoteOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to execute bulk promotion.')
    } finally {
      setConfirmStep(0)
    }
  }

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
      title: 'Bulk Student Promotion',
      desc: 'Promote all eligible students to the next academic class securely.',
      icon: Users,
      color: 'blue',
      action: () => setIsBulkPromoteOpen(true)
    },
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
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100'
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

       {/* Bulk Promotion Modal */}
       <Modal
          open={isBulkPromoteOpen}
          onClose={() => setIsBulkPromoteOpen(false)}
          title="Bulk Student Promotion"
          size="xl"
       >
          {loadingPromo ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="animate-spin text-slate-400" size={32} />
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Confirm Step 1 */}
              {confirmStep === 1 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center animate-fade-in">
                  <AlertTriangle className="mx-auto text-amber-500 mb-4" size={32} />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Are you sure you want to proceed with bulk promotion?</h3>
                  <p className="text-sm text-slate-600 mb-6">This will calculate the next class for all selected students.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button className="btn-secondary" onClick={() => setConfirmStep(0)}>Cancel</button>
                    <button className="btn-primary" onClick={() => setConfirmStep(2)}>Confirm</button>
                  </div>
                </div>
              )}

              {/* Confirm Step 2 */}
              {confirmStep === 2 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center animate-fade-in">
                  <ShieldAlert className="mx-auto text-rose-500 mb-4" size={40} />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">CRITICAL ACTION</h3>
                  <p className="text-sm text-rose-600 font-medium mb-6">This action will permanently update student classes and roll numbers. Do you really want to continue?</p>
                  <div className="flex items-center justify-center gap-3">
                    <button className="btn-secondary" onClick={() => setConfirmStep(0)}>Cancel</button>
                    <button className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700" onClick={executeBulkPromote}>Yes, Proceed</button>
                  </div>
                </div>
              )}

              {/* Data View */}
              {confirmStep === 0 && (
                <>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                    <AlertTriangle className="shrink-0 mt-0.5 text-blue-500" size={16} />
                    <div>
                      <strong>⚠️ Note:</strong> Unchecked students will remain in the same class for the next academic session. Please verify carefully before submitting, as this action will update student academic records in bulk.
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {promoClasses.map(cls => {
                      const classStudents = promoData.filter(s => s.class_id === cls.id)
                      if (classStudents.length === 0) return null

                      // Group by section
                      const sectionsObj = {}
                      classStudents.forEach(s => {
                        const secName = s.class?.section || 'No Section'
                        if (!sectionsObj[secName]) sectionsObj[secName] = []
                        sectionsObj[secName].push(s)
                      })

                      const isExpanded = expandedClasses[cls.id]

                      return (
                        <div key={cls.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                          <button 
                            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                            onClick={() => toggleClassExpand(cls.id)}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown size={18} className="text-slate-400"/> : <ChevronRight size={18} className="text-slate-400"/>}
                              <h3 className="font-bold text-slate-700">{cls.name}</h3>
                              <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border shadow-sm">
                                {classStudents.length} Students
                              </span>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-4 border-t border-slate-200 space-y-6">
                              {Object.entries(sectionsObj).map(([secName, students]) => (
                                <div key={secName}>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">{secName}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {students.map(s => (
                                      <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${s.promote ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                                        <input 
                                          type="checkbox" 
                                          className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                                          checked={s.promote}
                                          onChange={() => togglePromote(s.id)}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <span className={`font-bold text-sm ${s.promote ? 'text-blue-900' : 'text-slate-500 line-through'}`}>{s.name}</span>
                                            {s.status === 'Failed' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">FAILED</span>}
                                          </div>
                                          <div className="text-xs text-slate-400 mt-0.5">Roll No: {s.roll_no} | Status: {s.status}</div>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Modal Footer */}
              {confirmStep === 0 && (
                <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-slate-100">
                  <button className="btn-secondary" onClick={() => setIsBulkPromoteOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={() => setConfirmStep(1)}>Review & Submit</button>
                </div>
              )}

            </div>
          )}
       </Modal>
    </div>
  )
}
