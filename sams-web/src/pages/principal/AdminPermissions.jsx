import { useState, useMemo } from 'react'
import { 
  ShieldCheck, ShieldAlert, Clock, Calendar, 
  Search, Plus, Trash2, Edit2, AlertTriangle, 
  Info, CheckCircle, XCircle, Lock, Unlock,
  BookOpen, ClipboardList, Brain, BarChart2,
  ChevronDown, GraduationCap, LayoutGrid, Users
} from 'lucide-react'
import { 
  StatCard, SectionHeader, Tabs, StatusBadge, 
  Modal, DataTable, FilterChips 
} from '../../components/ui/index.jsx'
import { PERMISSIONS as INIT_PERMISSIONS, ALL_TEACHERS } from '../../data/dummyData'
import { ALL_CLASSES, SUBJECTS } from '../../data/constants'
import clsx from 'clsx'

/**
 * Advanced Time-Bound Permission System
 */
export default function AdminPermissions() {
  const [permissions, setPermissions] = useState(INIT_PERMISSIONS ?? [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [form, setForm] = useState({
    teacherId: '', 
    action: 'Marks Entry', 
    classPrefix: 'Grade 8',
    section: 'A',
    subject: 'Mathematics',
    from: '', to: ''
  })

  // --- Computed Options ---
  const classOptions = useMemo(() => {
    const grades = new Set()
    ALL_CLASSES.forEach(c => {
      if (c === 'All') return
      grades.add(c.split('-')[0].trim())
    })
    return Array.from(grades).sort()
  }, [])

  const sectionOptions = useMemo(() => {
    const sections = new Set()
    ALL_CLASSES.forEach(c => {
      if (c === 'All') return
      if (c.includes('-')) sections.add(c.split('-')[1].trim())
    })
    return Array.from(sections).sort()
  }, [])

  // ── Logic ──────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return permissions.filter(p => 
      p.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.class.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [permissions, searchTerm])

  const handleGrant = () => {
    if (!form.teacherId || !form.from || !form.to) {
      alert('Please fill in all required fields.')
      return
    }

    const teacher = ALL_TEACHERS.find(t => t.id === form.teacherId)
    const newPerm = {
      ...form,
      class: `${form.classPrefix}-${form.section}`,
      id: `PM${String(permissions.length + 1).padStart(2, '0')}`,
      teacherName: teacher?.name || 'Unknown',
      daysLeft: 30, // Mock calculation
      status: 'Active'
    }
    setPermissions([newPerm, ...permissions])
    setIsModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Revoke this permission immediately?')) {
      setPermissions(prev => prev.filter(p => p.id !== id))
    }
  }

  const MODULE_ICONS = {
    'Marks Entry': BarChart2,
    'Upload Syllabus': BookOpen,
    'Homework Entry': ClipboardList,
    'LO Entry': Brain
  }

  // ── Table Config ───────────────────────────────────────────────────────────

  const COLUMNS = [
    { 
      key: 'action', label: 'Module Permission',
      render: (v) => {
        const Icon = MODULE_ICONS[v] || ShieldCheck
        return (
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
               <Icon size={16} />
             </div>
             <div>
                <p className="font-bold text-slate-800 text-xs uppercase">{v}</p>
                <p className="text-[10px] text-slate-400">Restricted Access</p>
             </div>
          </div>
        )
      }
    },
    { key: 'class', label: 'Class Scope', sortable: true },
    { 
      key: 'duration', label: 'Validity Period',
      render: (_, row) => (
        <div className="flex flex-col">
           <span className="text-xs font-semibold text-slate-700">{row.from} to {row.to}</span>
           <span className={clsx(
             "text-[10px] font-bold mt-1",
             row.daysLeft > 0 ? "text-emerald-600" : "text-rose-500"
           )}>
             {row.daysLeft > 0 ? `${row.daysLeft} days remaining` : 'Expired'}
           </span>
        </div>
      )
    },
    { 
      key: 'status', label: 'Status',
      render: (_, row) => (
        <div className="flex items-center gap-2">
           {row.daysLeft > 0 ? (
             <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">
               <Unlock size={12} /> OPEN
             </span>
           ) : (
             <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold">
               <Lock size={12} /> LOCKED
             </span>
           )}
        </div>
      )
    },
    { 
      key: 'actions', label: 'Revoke',
      render: (_, row) => (
        <button 
          onClick={() => handleDelete(row.id)}
          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Permission Control</h1>
          <p className="text-sm text-slate-500">Manage time-bound module access for teaching staff</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Grant Permission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Permissions" value={permissions.filter(p => p.daysLeft > 0).length} icon={ShieldCheck} color="green" />
        <StatCard title="Expired Locks" value={permissions.filter(p => p.daysLeft <= 0).length} icon={ShieldAlert} color="red" />
        <StatCard title="Marks Entry Logs" value="24" icon={Clock} color="blue" />
        <StatCard title="System Security" value="High" icon={ShieldCheck} color="purple" />
      </div>

      {/* Main Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <SectionHeader title="Active Access Tokens" subtitle="Time-bound constraints" />
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Search scope..."
               className="input pl-10 py-2 text-sm w-48 md:w-64"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        <DataTable columns={COLUMNS} rows={filtered} />
      </div>

      {/* Grant Permission Modal */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Grant Module Access"
        size="md"
      >
        <div className="space-y-6">
           <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100 flex gap-4">
              <Info size={20} className="text-brand-600 flex-shrink-0" />
              <p className="text-xs text-brand-700 leading-relaxed">
                Permissions granted here will automatically expire at 11:59 PM on the end date. 
                The teacher's mobile application and web portal will instantly block these actions upon expiry.
              </p>
           </div>

           <div className="space-y-5">
              {/* Select Faculty */}
              <div className="relative group">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Select Faculty</label>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none">
                      <Users size={16} />
                    </div>
                    <select 
                      className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none cursor-pointer hover:bg-white transition-all"
                      value={form.teacherId} 
                      onChange={e => setForm({...form, teacherId: e.target.value})}
                    >
                      <option value="">Choose teacher...</option>
                      {ALL_TEACHERS.map(t => <option key={t.id} value={t.id}>{t.name} ({t.id})</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown size={16} />
                    </div>
                 </div>
              </div>

              {/* Access Module */}
              <div className="relative group">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Access Module</label>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none">
                      <Lock size={16} />
                    </div>
                    <select 
                      className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none cursor-pointer hover:bg-white transition-all"
                      value={form.action} 
                      onChange={e => setForm({...form, action: e.target.value})}
                    >
                      <option>Marks Entry</option>
                      <option>Upload Syllabus</option>
                      <option>Homework Entry</option>
                      <option>LO Entry</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown size={16} />
                    </div>
                 </div>
              </div>

              {/* Class & Section Scope */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="relative group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Class Scope</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none">
                        <GraduationCap size={16} />
                      </div>
                      <select 
                        className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none cursor-pointer hover:bg-white transition-all"
                        value={form.classPrefix} 
                        onChange={e => setForm({...form, classPrefix: e.target.value})}
                      >
                        {classOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                 </div>
                 <div className="relative group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Section</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none">
                        <LayoutGrid size={16} />
                      </div>
                      <select 
                        className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none cursor-pointer hover:bg-white transition-all"
                        value={form.section} 
                        onChange={e => setForm({...form, section: e.target.value})}
                      >
                        {sectionOptions.map(opt => <option key={opt} value={opt}>Section {opt}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                 </div>
              </div>

              {/* Subject */}
              <div className="relative group">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Subject</label>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none">
                      <BookOpen size={16} />
                    </div>
                    <select 
                      className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none cursor-pointer hover:bg-white transition-all"
                      value={form.subject} 
                      onChange={e => setForm({...form, subject: e.target.value})}
                    >
                       {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown size={16} />
                    </div>
                 </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Start Date</label>
                    <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all hover:bg-white" value={form.from} onChange={e => setForm({...form, from: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">End Date (Expiry)</label>
                    <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all hover:bg-white" value={form.to} onChange={e => setForm({...form, to: e.target.value})} />
                 </div>
              </div>
           </div>

           <div className="flex gap-3 pt-4 border-t border-slate-50">
             <button onClick={handleGrant} className="btn-primary flex-1 justify-center py-3">
                <ShieldCheck size={16} /> Grant Access Token
             </button>
             <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-8 text-xs font-bold uppercase tracking-wider">Cancel</button>
           </div>
        </div>
      </Modal>

    </div>
  )
}
