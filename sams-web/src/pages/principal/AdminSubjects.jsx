import { useState, useMemo, useEffect } from 'react'
import { 
  BookOpen, Plus, FileUp, Search, Filter, 
  Users, GraduationCap, LayoutGrid, ChevronRight, X, 
  CheckCircle, AlertCircle, Info, Trash2, Edit2, Download, Save, 
  Link as LinkIcon, Eye, RotateCcw, ChevronDown
} from 'lucide-react'
import { 
  StatCard, SectionHeader, Tabs, 
  Modal, DataTable, FormInput, SelectDropdown,
  StatusBadge 
} from '../../components/ui/index.jsx'
import { subjectApi, teacherApi } from '../../services/schoolApi.js'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000'

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [academicClasses, setAcademicClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    class: 'All',
    subject: 'All'
  })

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Selection
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [assignForm, setAssignForm] = useState({
    teacherId: '',
    classId: ''
  })

  // Subject Form State
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const token = JSON.parse(localStorage.getItem('sams_session') || '{}')?.token
  const authHeaders = { 'Authorization': `Bearer ${token}` }

  const loadData = async () => {
    setLoading(true)
    try {
      const [subRes, teacherRes, classesRes] = await Promise.all([
        subjectApi.getAll().catch(err => { console.error('Subject API Error:', err); return { data: { subjects: [] } }; }),
        teacherApi.getAll({ role: 'teacher' }).catch(err => { console.error('Teacher API Error:', err); return { data: { data: { items: [] } } }; }),
        fetch(`${API_URL}/api/admin/classes`, { headers: authHeaders }).then(r => r.json()).catch(() => ({ success: false, classes: [] }))
      ])

      // Subject API returns: { success: true, subjects: [...] }
      const subjectsList = subRes.data?.subjects || []
      setSubjects(subjectsList)

      // Teacher API returns: { success: true, data: { items: [...], pagination: {...} } }
      const tPayload = teacherRes.data?.data
      const teachersList = Array.isArray(tPayload) ? tPayload : (tPayload?.items || [])
      setTeachers(teachersList)

      // Academic classes from the classes API
      if (classesRes.success) {
        const sorted = [...classesRes.classes].sort((a, b) =>
          (parseInt(a.class_number) || 0) - (parseInt(b.class_number) || 0)
        )
        setAcademicClasses(sorted)
      }
    } catch (error) {
      console.error('Unified load error:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // --- Computed Options for Filters ---
  const classOptions = useMemo(() => {
    return ['All', ...academicClasses.map(c => c.name)]
  }, [academicClasses])

  const subjectNameOptions = useMemo(() => {
    const names = Array.from(new Set(subjects.map(s => s.name)))
    return ['All', ...names.sort()]
  }, [subjects])

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      // 1. Text Search
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.code || '').toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchSearch) return false

      // 2. Subject Name Filter
      if (filters.subject !== 'All' && s.name !== filters.subject) return false

      // 3. Class Filter
      if (filters.class !== 'All') {
        const hasMatchingAssignment = s.assignments?.some(a => {
          if (!a.className) return false
          const cName = a.className.split('-')[0].trim()
          return cName === filters.class
        })
        if (!hasMatchingAssignment) return false
      }

      return true
    })
  }, [subjects, searchTerm, filters])

  const handleSaveSubject = async () => {
    if (!form.name || !form.code) {
      toast.error("Subject Name and Code are required.")
      return
    }

    try {
      setLoading(true)
      if (selectedSubject) {
        await subjectApi.update(selectedSubject.id, form)
        toast.success('Subject updated')
      } else {
        await subjectApi.create(form)
        toast.success('Subject created')
      }
      setIsAddModalOpen(false)
      setSelectedSubject(null)
      setForm({ name: '', code: '', description: '' })
      loadData()
    } catch (error) {
      toast.error('Failed to save subject')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubject = async (id) => {
    if (!id) {
      toast.error('No subject ID found')
      return
    }
    try {
      await subjectApi.delete(id)
      toast.success('Subject deleted')
      loadData()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete subject: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleBulkUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target.result
      const rows = text.split('\n').filter(r => r.trim())
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase())
      
      const newSubjects = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim())
        const obj = {}
        headers.forEach((h, i) => obj[h] = values[i])
        return obj
      })

      try {
        setLoading(true)
        for(let sub of newSubjects) {
          if (sub.name && sub.code) {
            await subjectApi.create({
              name: sub.name,
              code: sub.code,
              description: sub.description || ''
            })
          }
        }
        toast.success(`${newSubjects.length} subjects processed`)
        setIsBulkModalOpen(false)
        loadData()
      } catch (error) {
        toast.error('Bulk upload failed')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  const handleAssign = async () => {
    if (!assignForm.teacherId || !assignForm.classId) {
      toast.error("Please select both a Teacher and a Class.")
      return
    }

    try {
      setLoading(true)
      // Find selected class name for the API
      const selectedCls = academicClasses.find(c => String(c.id) === String(assignForm.classId))
      const className = selectedCls ? selectedCls.name : assignForm.classId
      
      await subjectApi.assign({
        subjectId: selectedSubject.id,
        teacherId: assignForm.teacherId,
        className
      })
      toast.success('Assignment successful')
      setIsAssignModalOpen(false)
      setAssignForm({ teacherId: '', classId: '' })
      loadData()
    } catch (error) {
      toast.error('Failed to assign subject')
    } finally {
      setLoading(false)
    }
  }

  // --- UI Components ---
  const COLUMNS = [
    { 
      key: 'name', 
      label: 'Subject', 
      sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs border border-brand-100">
            {v[0]}
          </div>
          <div>
            <p className="font-bold text-slate-800">{v}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{row.code}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'assignedTeacher', 
      label: 'Primary Teacher', 
      sortable: true,
      render: v => v ? (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-slate-700">{v}</span>
        </div>
      ) : (
        <span className="text-xs font-bold text-slate-300 italic">Unassigned</span>
      )
    },
    { 
      key: 'assignedClasses', 
      label: 'Coverage', 
      render: v => (
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
          {v?.length || 0} Classes
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Quick Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setSelectedSubject(row)
              setIsAssignModalOpen(true)
            }}
            className="px-3 py-1.5 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5"
          >
            <LinkIcon size={12} />
            Assign
          </button>
          <button onClick={() => {
            setSelectedSubject(row)
            setIsViewModalOpen(true)
          }} className="p-2 text-slate-400 hover:text-brand-600 transition-colors" title="View Assignments">
            <Eye size={14} />
          </button>
          <button onClick={() => {
            setSelectedSubject(row)
            setForm({ name: row.name, code: row.code, description: row.description || '' })
            setIsAddModalOpen(true)
          }} className="p-2 text-slate-400 hover:text-brand-600 transition-colors" title="Edit Subject">
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDeleteSubject(row.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Delete Subject">
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Subject Management</h1>
          <p className="text-slate-500 font-medium mt-1">Define global curriculum and staff assignments</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="btn-secondary px-6 flex items-center gap-2 group"
          >
            <FileUp size={18} className="text-slate-400 group-hover:text-brand-600" />
            Bulk Import
          </button>
          <button 
            onClick={() => {
              setSelectedSubject(null)
              setForm({ name: '', code: '', description: '' })
              setIsAddModalOpen(true)
            }}
            className="btn-primary px-8 flex items-center gap-2 shadow-lg shadow-brand-100"
          >
            <Plus size={18} />
            Add Subject
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Subjects" 
          value={subjects.length} 
          icon={BookOpen} 
          subtitle="+2 this term"
          color="brand"
          trend={100}
        />
        <StatCard 
          title="Unassigned" 
          value={subjects.filter(s => !s.assignedTeacher).length} 
          icon={AlertCircle} 
          color="amber"
          subtitle="Requires attention"
          trend={100}
        />
        <StatCard 
          title="Total Staff" 
          value={teachers.length} 
          icon={Users} 
          color="emerald"
        />
      </div>

       {/* Filter Bar */}
      <div className="bg-white p-5 rounded-[30px] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search subjects by name or code..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/20 transition-all font-medium"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Class Filter */}
            <div className="w-full sm:w-44 relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-500 transition-colors pointer-events-none">
                <GraduationCap size={14} />
              </div>
              <select 
                title="Filter by Class"
                value={filters.class}
                onChange={e => setFilters({ ...filters, class: e.target.value })}
                className="w-full pl-9 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none cursor-pointer hover:bg-white hover:border-brand-200 transition-all"
              >
                {classOptions.map(opt => <option key={opt} value={opt}>{opt === 'All' ? 'All Classes' : opt}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Subject Filter */}
            <div className="w-full sm:w-44 relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-500 transition-colors pointer-events-none">
                <BookOpen size={14} />
              </div>
              <select 
                title="Filter by Subject"
                value={filters.subject}
                onChange={e => setFilters({ ...filters, subject: e.target.value })}
                className="w-full pl-9 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/10 appearance-none cursor-pointer hover:bg-white hover:border-brand-200 transition-all"
              >
                {subjectNameOptions.map(opt => <option key={opt} value={opt}>{opt === 'All' ? 'All Subjects' : opt}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>

            <button 
              onClick={() => {
                setSearchTerm('')
                setFilters({ class: 'All', subject: 'All' })
              }}
              className="px-4 py-3 bg-slate-50 text-slate-400 hover:text-rose-600 shadow-sm border border-slate-100 rounded-xl flex items-center justify-center transition-all hover:bg-rose-50 hover:border-rose-100 group"
              title="Reset Filters"
            >
              <RotateCcw size={16} className="group-hover:rotate-[-90deg] transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100">
          <div className="animate-spin text-brand-600 mb-4">
            <BookOpen size={40} />
          </div>
          <p className="text-slate-500 font-bold">Generating curriculum view...</p>
        </div>
      ) : (
        <div className="card overflow-hidden border-slate-100">
          <DataTable 
            columns={COLUMNS} 
            rows={filteredSubjects} 
            emptyMessage="No subjects found. Try adjusting your search or add a new global subject." 
          />
        </div>
      )}

      {/* Add Modal */}
      <Modal 
        open={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title={selectedSubject ? 'Edit Subject' : 'Create Global Subject'}
        size="md"
      >
        <div className="space-y-6">
          <FormInput 
            label="Subject Name" 
            placeholder="e.g. Mathematics" 
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <FormInput 
            label="Subject Code" 
            placeholder="e.g. MATH101" 
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value })}
          />
          <FormInput 
            label="Description" 
            type="textarea"
            rows={3}
            placeholder="Optional overview..." 
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <div className="pt-6 flex gap-3">
            <button onClick={handleSaveSubject} className="btn-primary flex-1 py-4 text-sm font-bold shadow-xl shadow-brand-100">
              <Save size={18} className="mr-2" />
              {selectedSubject ? 'Update Subject' : 'Finalize Subject'}
            </button>
            <button onClick={() => setIsAddModalOpen(false)} className="btn-secondary px-8">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Assignment Modal */}
      <Modal 
        open={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        title="Curriculum Assignment"
        size="md"
      >
        <div className="space-y-8">
          {selectedSubject && (
            <div className="p-5 bg-gradient-to-br from-brand-600 to-brand-700 rounded-[30px] text-white shadow-xl shadow-brand-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-xl">
                  {selectedSubject.name[0]}
                </div>
                <div>
                  <h4 className="font-extrabold text-lg">{selectedSubject.name}</h4>
                  <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{selectedSubject.code}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <SelectDropdown 
               label="Assign To Teacher"
               options={[
                 { value: '', label: 'Select a Teacher' },
                 ...(Array.isArray(teachers) ? teachers : []).map(t => ({ value: t.id || t._id, label: t.name }))
               ]}
               value={assignForm.teacherId}
               onChange={e => setAssignForm({ ...assignForm, teacherId: e.target.value })}
            />
            
            <SelectDropdown 
               label="Assign To Class"
               options={[
                 { value: '', label: 'Select a Class' },
                 ...academicClasses.map(c => ({ value: c.id, label: c.name }))
               ]}
               value={assignForm.classId}
               onChange={e => setAssignForm({ ...assignForm, classId: e.target.value })}
            />
          </div>

          <div className="p-5 bg-slate-50 border border-slate-100 rounded-[30px] flex gap-4">
             <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-600 flex-shrink-0">
                <Info size={18} />
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
               Assigning a subject to a teacher will grant them access to syllabus tracking for that subject. Class assignment adds it to the student portal.
             </p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleAssign} className="btn-primary flex-1 py-4 text-sm font-bold shadow-xl shadow-brand-100">
               Confirm Assignment
            </button>
            <button onClick={() => setIsAssignModalOpen(false)} className="btn-secondary px-8">Close</button>
          </div>
        </div>
      </Modal>

      {/* View Assignments Modal */}
      <Modal 
        open={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Subject Directory View"
        size="md"
      >
        <div className="space-y-6">
          {selectedSubject && (
            <>
              <div className="p-5 bg-gradient-to-br from-brand-600 to-brand-700 rounded-[30px] text-white shadow-xl shadow-brand-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-xl">
                    {selectedSubject.name[0]}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg">{selectedSubject.name}</h4>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{selectedSubject.code}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Active Assignments</h5>
                {selectedSubject.assignments && selectedSubject.assignments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSubject.assignments.map((assignment, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                             <Users size={14} />
                           </div>
                           <div>
                             <p className="text-sm font-bold text-slate-700">{assignment.teacherName}</p>
                             <p className="text-xs font-medium text-slate-400">Class: {assignment.className}</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl border-dashed">
                     <Info size={24} className="mx-auto text-slate-300 mb-2" />
                     <p className="text-slate-500 font-medium text-sm">No assignments found for this subject.</p>
                     <p className="text-slate-400 text-xs mt-1">Use the Quick Actions menu to link a teacher and class.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={() => setIsViewModalOpen(false)} className="btn-secondary px-6">Close</button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Bulk Modal */}
      <Modal 
        open={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        title="Bulk Subject Import"
        size="md"
      >
        <div className="space-y-8">
          <div className="p-10 border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-brand-300 transition-colors">
             <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[30px] flex items-center justify-center mb-6 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all">
                <FileUp size={40} />
             </div>
             <p className="font-extrabold text-slate-800 text-lg">Drop CSV File Here</p>
             <p className="text-sm text-slate-500 mt-1 max-w-[200px]">Header: Name, Code, Description</p>
             <label className="btn-primary mt-8 px-8 py-3 cursor-pointer shadow-lg shadow-brand-100">
               Select File
               <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
             </label>
          </div>

          <div className="bg-brand-50/50 p-6 rounded-[30px] border border-brand-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Download size={40} className="text-brand-600" />
            </div>
            <p className="text-xs font-black text-brand-600 uppercase mb-3 tracking-widest">Get Started Faster</p>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Use our standard template to ensure error-free imports. Required fields are Name and Code.
            </p>
            <button 
              onClick={() => {
                const csv = "Name,Code,Description\nMathematics,MATH101,Core numerical science\nEnglish Literature,ENG202,Shakespeare and modern prose\n";
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Subjects_Bulk_Template.csv';
                a.click();
              }}
              className="text-brand-700 font-bold text-xs flex items-center gap-2 hover:underline"
            >
              <Download size={14} />
              Download Excel/CSV Template
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
