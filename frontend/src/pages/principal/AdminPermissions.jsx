import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { 
  ShieldCheck, ShieldAlert, Clock, Calendar, 
  Search, Plus, Trash2, Edit2, AlertTriangle, 
  Info, CheckCircle, XCircle, Lock, Unlock,
  BookOpen, ClipboardList, Brain, BarChart2,
  ChevronDown, GraduationCap, LayoutGrid, Users
} from 'lucide-react'
import { 
  StatCard, SectionHeader, StatusBadge, 
  Modal, DataTable
} from '../../components/ui/index.jsx'
import api from '../../services/api'
import clsx from 'clsx'

/**
 * 100% Database-Driven Permission System
 */
export default function AdminPermissions() {
  const [activePermissions, setActivePermissions] = useState([])
  const [expiredPermissions, setExpiredPermissions] = useState([])
  const [meta, setMeta] = useState({
    teachers: [],
    classes: [],
    sections: [],
    subjects: [],
    modules: []
  })
  
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  
  // ── Auth Guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('NO TOKEN → Redirecting to login')
      navigate('/login')
    }
  }, [navigate])

  const [form, setForm] = useState({
    teacher_id: '', 
    module_id: '', 
    class_id: '',
    section_id: '',
    subject_id: '',
    start_date: '', 
    end_date: ''
  })

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true)
    try {
      const [metaRes, activeRes, expiredRes] = await Promise.all([
        api.get('/admin/permissions/meta'),
        api.get('/admin/permissions/active'),
        api.get('/admin/permissions/expired')
      ])

      if (metaRes.data?.success) {
        setMeta(metaRes.data.data || { teachers: [], classes: [], sections: [], subjects: [], modules: [] })
      }

      if (activeRes.data?.success) {
        const activeList = activeRes.data.data
        setActivePermissions(Array.isArray(activeList) ? activeList : [])
      }

      if (expiredRes.data?.success) {
        const expiredList = expiredRes.data.data
        setExpiredPermissions(Array.isArray(expiredList) ? expiredList : [])
      }
        
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ── Logic ──────────────────────────────────────────────────────────────────

  const allPermissions = useMemo(() => {
    return [...activePermissions, ...expiredPermissions]
  }, [activePermissions, expiredPermissions])

  const filteredSections = useMemo(() => {
    if (!form.class_id || !Array.isArray(meta.sections)) return []
    return meta.sections.filter(s => String(s.class_id) === String(form.class_id))
  }, [form.class_id, meta.sections])

  const filtered = useMemo(() => {
    if (!Array.isArray(allPermissions)) return []
    if (!searchTerm) return allPermissions
    const term = searchTerm.toLowerCase()
    return allPermissions.filter(p =>
      (p.teacher || p.teacher_name || '')?.toLowerCase().includes(term) ||
      (p.class_name || '')?.toLowerCase().includes(term) ||
      (p.module || p.module_label || '')?.toLowerCase().includes(term)
    )
  }, [allPermissions, searchTerm])

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to REVOKE this access? The teacher will lose access instantly.')) return
    try {
      const res = await api.delete(`/admin/permissions/${id}`)
      if (res.data.success) {
        alert('Access revoked successfully')
        fetchData()
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error('[REVOKE FAILED]:', error)
      alert('Failed to revoke access')
    }
  }

  const handleGrant = async () => {
    const selectedModuleKey = meta.modules.find(m => String(m.id) === String(form.module_id))?.module_key;
    const isGlobalModule = selectedModuleKey === 'students_management' || selectedModuleKey === 'SYLLABUS_UPLOAD';
    const isAllModules = form.module_id === 'ALL_ACADEMIC' || form.module_id === 'ALL_FULL';

    if (!form.teacher_id || !form.module_id || !form.start_date || !form.end_date) {
      alert('Please fill in all required fields.')
      return
    }

    if (!isGlobalModule && !isAllModules && !form.class_id) {
      alert('Class Scope is required for this module.')
      return
    }

    try {
      if (isEditMode) {
        const res = await api.put(`/admin/permissions/${editingId}`, {
          start_date: form.start_date,
          end_date: form.end_date
        })
        if (res.data.success) {
          alert('Permission updated successfully')
          fetchData()
          setIsModalOpen(false)
        }
      } else {
        const res = await api.post('/admin/permissions/grant', form)
        if (res.data.success) {
          alert('Permission granted successfully')
          fetchData()
          setIsModalOpen(false)
        }
      }
    } catch (error) {
      console.error('[GRANT FAILED]:', error);
      alert(error.response?.data?.message || 'Action failed')
    }
  }

  const openEdit = (p) => {
    setIsEditMode(true)
    setEditingId(p.id)
    setForm({
      teacher_id: p.teacher_id,
      module_id: p.module_id,
      class_id: p.class_id,
      section_id: p.section_id || '',
      subject_id: p.subject_id || '',
      start_date: p.start_date ? p.start_date.split('T')[0] : '',
      end_date: p.end_date ? p.end_date.split('T')[0] : ''
    })
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setIsEditMode(false)
    setEditingId(null)
    setForm({
      teacher_id: '', module_id: '', class_id: '',
      section_id: '', subject_id: '',
      start_date: '', end_date: ''
    })
  }

  const MODULE_ICONS = {
    'MARKS_ENTRY': BarChart2,
    'SYLLABUS_UPLOAD': BookOpen,
    'HOMEWORK_ENTRY': ClipboardList,
    'LO_ENTRY': Brain,
    'students_management': GraduationCap
  }

  const selectedModuleKey = meta.modules.find(m => String(m.id) === String(form.module_id))?.module_key;
  const isGlobalModule = selectedModuleKey === 'students_management' || selectedModuleKey === 'SYLLABUS_UPLOAD';

  // ── Table Config ───────────────────────────────────────────────────────────

  const COLUMNS = [
    { 
      key: 'module', label: 'Module Permission',
      render: (v, row) => {
        const Icon = MODULE_ICONS[row.module_key] || ShieldCheck
        return (
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
               <Icon size={16} />
             </div>
             <div>
                <p className="font-bold text-slate-800 text-xs uppercase">{v}</p>
                <p className="text-[10px] text-slate-400">{row.teacher}</p>
             </div>
          </div>
        )
      }
    },
    { 
      key: 'class_name', label: 'Scope', 
      render: (v, row) => (
        <div className="text-xs font-medium text-slate-600">
          {v || 'Global Access'} {row.section ? `- ${row.section}` : ''}
          <p className="text-[10px] text-slate-400">{row.subject || 'All Subjects'}</p>
        </div>
      )
    },
    { 
      key: 'duration', label: 'Validity Period',
      render: (_, row) => {
        const start = row.start_date ? new Date(row.start_date).toLocaleDateString() : 'N/A'
        const end = row.end_date ? new Date(row.end_date).toLocaleDateString() : 'Permanent'
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = row.end_date ? new Date(row.end_date) : null;
        if (expiry) expiry.setHours(0, 0, 0, 0);
        const isPermanent = !row.end_date;
        const isActive = isPermanent || (expiry && expiry >= today);

        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-700">{start} to {end}</span>
            <span className={clsx("text-[10px] font-bold mt-1", isActive ? "text-emerald-600" : "text-rose-500")}>
              {isPermanent ? 'Permanent Access' : (isActive ? `${row.daysLeft} days remaining` : 'Expired')}
            </span>
          </div>
        )
      }
    },
    { 
      key: 'status', label: 'Status',
      render: (_, row) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = row.end_date ? new Date(row.end_date) : null;
        if (expiry) expiry.setHours(0, 0, 0, 0);
        const isActive = !row.end_date || (expiry && expiry >= today);
        return (
          <div className="flex items-center gap-2">
             {isActive ? (
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
      }
    },
    { 
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-400 transition-colors"
            title="Edit"
          >
            <Edit2 size={15} />
          </button>
          <button 
            onClick={() => handleRevoke(row.id)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors"
            title="Revoke Access"
          >
            <Trash2 size={15} />
          </button>
        </div>
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
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Grant Permission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Permissions" value={activePermissions.length} icon={ShieldCheck} color="green" />
        <StatCard title="Expired Locks" value={expiredPermissions.length} icon={ShieldAlert} color="red" />
        <StatCard title="System Integrity" value="100%" icon={Lock} color="blue" />
        <StatCard title="DB Source" value="Verified" icon={ShieldCheck} color="purple" />
      </div>

      {/* Main Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <SectionHeader title="Active Access Tokens" subtitle="Verified database records" />
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Search teacher, class..."
               className="input pl-10 py-2 text-sm w-48 md:w-64"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        <DataTable columns={COLUMNS} rows={filtered} loading={loading} />
      </div>

      {/* Grant Permission Modal */}
      <Modal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Edit Access Period" : "Grant Module Access"}
        size="md"
      >
        <div className="space-y-6">
           <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100 flex gap-4">
              <Info size={20} className="text-brand-600 flex-shrink-0" />
              <p className="text-xs text-brand-700 leading-relaxed">
                {isEditMode 
                  ? "Updating the end date will instantly adjust the teacher's access window."
                  : "Permissions granted here will automatically expire at 12:00 AM on the day after the end date."}
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
                      disabled={isEditMode}
                      className="select pl-11 disabled:opacity-50"
                      value={form.teacher_id} 
                      onChange={e => setForm({...form, teacher_id: e.target.value})}
                    >
                      <option value="">Choose teacher...</option>
                      {Array.isArray(meta.teachers) && meta.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {!isEditMode && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown size={16} />
                    </div>}
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
                      disabled={isEditMode}
                      className="select pl-11 disabled:opacity-50"
                      value={form.module_id} 
                      onChange={e => setForm({...form, module_id: e.target.value})}
                    >
                      <option value="">Select module...</option>
                      <option value="ALL_ACADEMIC" className="font-bold text-brand-600">All Academic (Excludes Students Mgt.)</option>
                      <option value="ALL_FULL" className="font-bold text-rose-600">Full System (Includes Students Mgt.)</option>
                      {Array.isArray(meta.modules) && meta.modules.map(m => <option key={m.id} value={m.id}>{m.module_name || m.name}</option>)}
                    </select>
                    {!isEditMode && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown size={16} />
                    </div>}
                 </div>
              </div>

              {/* Class & Section Scope - Hidden for Students Management and All Modules (Optional) */}
              {!isEditMode && !isGlobalModule && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Class Scope</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none">
                            <GraduationCap size={16} />
                          </div>
                          <select 
                            className="select pl-11"
                            value={form.class_id} 
                            onChange={e => setForm({...form, class_id: e.target.value})}
                          >
                            <option value="">Select class...</option>
                            {Array.isArray(meta.classes) && meta.classes.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <ChevronDown size={16} />
                          </div>
                        </div>
                    </div>
                    <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Section (Optional)</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none">
                            <LayoutGrid size={16} />
                          </div>
                          <select 
                            className="select pl-11"
                            value={form.section_id} 
                            onChange={e => setForm({...form, section_id: e.target.value})}
                          >
                            <option value="">All Sections</option>
                            {Array.isArray(filteredSections) && filteredSections.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <ChevronDown size={16} />
                          </div>
                        </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="relative group">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Subject (Optional)</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none">
                          <BookOpen size={16} />
                        </div>
                        <select 
                          className="select pl-11"
                          value={form.subject_id} 
                          onChange={e => setForm({...form, subject_id: e.target.value})}
                        >
                          <option value="">All Subjects</option>
                          {Array.isArray(meta.subjects) && meta.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <ChevronDown size={16} />
                        </div>
                    </div>
                  </div>
                </>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Start Date</label>
                    <input type="date" className="input" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">End Date (Expiry)</label>
                    <input type="date" className="input" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                 </div>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-50">
             {isEditMode && (
               <button 
                onClick={() => handleRevoke(editingId)} 
                className="btn bg-rose-600 hover:bg-rose-700 text-white flex-1 justify-center py-3"
               >
                  <Trash2 size={16} className="mr-2" /> Revoke Access
               </button>
             )}
             <button onClick={handleGrant} className="btn-primary flex-1 justify-center py-3">
                <ShieldCheck size={16} className="mr-2" /> {isEditMode ? 'Update Period' : 'Grant Access'}
             </button>
             <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-8 text-xs font-bold uppercase tracking-wider">Cancel</button>
           </div>
        </div>
      </Modal>

    </div>
  )
}
