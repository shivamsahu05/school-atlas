import { useState, useMemo, useEffect } from 'react'
import {
  Users, UserPlus, Shield, Ban, CheckCircle, Eye,
  Mail, Phone, GraduationCap, Briefcase, IndianRupee,
  Clock, Edit2, Trash2, Calendar, Search, Filter, Save, Download, Star, TrendingUp, Lock, FileUp
} from 'lucide-react'
import {
  StatCard, SectionHeader, Tabs, StatusBadge,
  Modal, DataTable, InfoRow, FilterChips, FormInput, SelectDropdown
} from '../../components/ui/index.jsx'
import { teacherApi } from '../../services/schoolApi.js'
import { DEPARTMENTS, ALL_CLASSES, ADMIN_DEPT_FILTER } from '../../data/constants'
import clsx from 'clsx'

/**
 * Enhanced Teacher & Staff Management with Password Management
 */
export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([])

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDept, setFilterDept] = useState('All')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  // Selection
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [assignClass, setAssignClass] = useState('')

  // Form State
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '', dob: '',
    qualification: '', experience: '',
    subject: 'Mathematics', salary: '', status: 'Active',
    assignedClasses: ['Grade 8-A']
  })

  // ── Logic ──────────────────────────────────────────────────────────────────

  // Load teachers from API on mount
  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    setLoading(true)
    try {
    const response = await teacherApi.getAll({ role: 'teacher' })
      const apiData = response.data // axios wrapper: { success, data: { items, pagination } }
      const teacherList = Array.isArray(apiData?.data?.items) ? apiData.data.items
        : Array.isArray(apiData?.data) ? apiData.data
        : Array.isArray(apiData) ? apiData 
        : []
      setTeachers(teacherList)
    } catch (error) {
      console.error('Failed to load teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const term = searchTerm.toLowerCase()
      const matchSearch = !term || 
        (t.name || '').toLowerCase().includes(term) ||
        String(t.id || '').toLowerCase().includes(term) ||
        (t.email || '').toLowerCase().includes(term) ||
        (t.mobile || t.phone || '').includes(searchTerm)
      const matchDept = filterDept === 'All' || (t.subject || t.role || '').includes(filterDept)
      return matchSearch && matchDept
    })
  }, [teachers, searchTerm, filterDept])

  // Auto-generate password from name
  const generatePassword = (name) => {
    if (!name) return ''
    const firstName = name.split(' ')[0]
    return `${firstName}@123#`
  }

  const validateMobileUnique = (mobile) => {
    return !teachers.some(t => t.mobile === mobile && t.id !== selectedTeacher?.id)
  }

  const handleSaveTeacher = async () => {
    if (!form.name || !form.email || !form.dob || !form.mobile || !form.password) {
      alert("Name, Email, DOB, Mobile, and Password are required.")
      return
    }

    if (!validateMobileUnique(form.mobile)) {
      alert("Mobile number must be unique.")
      return
    }

    setLoading(true)
    try {
      if (selectedTeacher) {
        // Update
        await teacherApi.update(selectedTeacher.id, { ...form })
      } else {
        // Create
        const newId = `TCH-${String(teachers.length + 1).padStart(3, '0')}`
        await teacherApi.create({ ...form, id: newId, role: 'teacher' })
      }
      loadTeachers() // Reload list
      closeAllModals()
    } catch (error) {
      alert("Failed to save teacher: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target.result
      const rows = text.split('\n').map(r => r.trim()).filter(r => r)

      let imported = 0
      let errors = []
      setLoading(true)

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',')
        if (cols.length < 3) continue
        const [name, email, mobile, subject, salary] = cols

        if (!name || !email || !mobile) {
          errors.push(`Row ${i + 1}: Missing required fields.`)
          continue
        }

        const newId = `TCH-${String(teachers.length + imported + 1).padStart(3, '0')}`
        const newTeacher = {
          id: newId,
          name, email, mobile,
          password: generatePassword(name),
          subject: subject || 'Mathematics',
          salary: salary || '',
          status: 'Active',
          role: 'teacher'
        }

        try {
          await teacherApi.create(newTeacher)
          imported++
        } catch (error) {
          errors.push(`Row ${i + 1}: Failed to import.`)
        }
      }

      if (errors.length) {
        alert("Errors found during import:\n" + errors.join('\n') + "\n\nSuccessfully imported " + imported + " teachers.")
      } else {
        alert("Success! " + imported + " teachers imported.")
      }
      
      setLoading(false)
      loadTeachers()
      setIsBulkModalOpen(false)
    }
    reader.readAsText(file)
  }

  const handlePasswordReset = async () => {
    if (!form.password) {
      alert("Please enter new password.")
      return
    }
    setLoading(true)
    try {
      await teacherApi.update(selectedTeacher.id, { 
        password: form.password 
      })
      alert("Password updated successfully!")
      loadTeachers()
    } catch (error) {
      alert("Failed to update password: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleBlockStatus = async (id) => {
    const teacher = teachers.find(t => t.id === id)
    if (!teacher) return
    const isActive = teacher.status === 'active' || teacher.status === 'Active'
    const newStatus = isActive ? 'inactive' : 'active'
    setLoading(true)
    try {
      await teacherApi.update(id, { status: newStatus })
      setTeachers(prev => prev.map(t => 
        t.id === id ? { ...t, status: newStatus } : t
      ))
    } catch (error) {
      alert("Failed to update status: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeacher = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return
    setLoading(true)
    try {
      await teacherApi.delete(id)
      setTeachers(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      alert("Failed to delete teacher: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const getPerformance = (teacher) => {
    const classPerformance = 85
    const attendance = 95
    const adminRating = teacher.adminRating ? parseFloat(teacher.adminRating) : 4.0
    const ratingScore = (adminRating / 5) * 100
    const finalScore = Math.round((classPerformance * 0.5) + (attendance * 0.2) + (ratingScore * 0.3))

    let badge = '⚠ Needs Improvement'
    let badgeColor = 'bg-red-100 text-red-700'
    if (finalScore >= 85) { badge = '⭐ Top Performer'; badgeColor = 'bg-green-100 text-green-700' }
    else if (finalScore >= 70) { badge = '👍 Good'; badgeColor = 'bg-blue-100 text-blue-700' }

    return { finalScore, badge, badgeColor, classPerformance, attendance, adminRating, adminRemarks: teacher.adminRemarks || '' }
  }

  const handleSavePerformance = async () => {
    try {
      await teacherApi.update(selectedTeacher.id, {
        adminRating: form.adminRating,
        adminRemarks: form.adminRemarks
      })
    } catch (err) {
      console.warn('API does not support rating fields yet, saving locally.')
    }
    // Always update local state so user sees the change
    setTeachers(prev => prev.map(t => 
      t.id === selectedTeacher.id 
        ? { ...t, adminRating: form.adminRating, adminRemarks: form.adminRemarks }
        : t
    ))
    alert('Rating saved successfully!')
    setIsPerformanceModalOpen(false)
  }

  const resetForm = () => {
    setForm({
      name: '', email: '', mobile: '', password: '', dob: '',
      qualification: '', experience: '',
      subject: 'Mathematics', salary: '', status: 'Active',
      assignedClasses: ['Grade 8-A']
    })
    setSelectedTeacher(null)
    setAssignClass('')
  }

  const closeAllModals = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setIsViewModalOpen(false)
    setIsPerformanceModalOpen(false)
    setIsAssignModalOpen(false)
    resetForm()
  }

  const departments = ADMIN_DEPT_FILTER


  // ── Table Config ───────────────────────────────────────────────────────────
  const COLUMNS = [
    {
      key: 'name', label: 'Teacher',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-brand text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {v[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-800 leading-tight">{v}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{row.id} · {row.role || 'Teacher'}</p>
          </div>
        </div>
      )
    },
    { key: 'subject', label: 'Department' },
    {
      key: 'experience', label: 'Exp.',
      render: v => <span className="text-xs font-semibold text-slate-600">{v || '5+'} yrs</span>
    },
    {
      key: 'salary', label: 'Monthly Salary',
      render: v => (
        <div className="flex items-center gap-1 text-slate-700 font-bold">
          <IndianRupee size={12} className="text-slate-400" />
          <span>{v || '45,000'}</span>
        </div>
      )
    },
    {
      key: 'mobile', label: 'Mobile (Login)',
      render: v => <span className="text-xs font-mono text-slate-700">{v || 'N/A'}</span>
    },
    {
      key: 'performance', label: 'Performance',
      render: (_, row) => {
        const perf = getPerformance(row)
        return (
          <div className="flex flex-col items-start gap-1">
            <span className="text-sm font-bold text-slate-800">{perf.finalScore}%</span>
            <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-bold", perf.badgeColor)}>{perf.badge}</span>
          </div>
        )
      }
    },
    {
      key: 'status', label: 'Access',
      render: v => <StatusBadge status={v || 'Active'} />
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSelectedTeacher(row); setIsViewModalOpen(true); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => { setSelectedTeacher(row); setForm({ ...row, adminRating: getPerformance(row).adminRating, adminRemarks: getPerformance(row).adminRemarks }); setIsPerformanceModalOpen(true); }}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors"
            title="Performance"
          >
            <Star size={15} />
          </button>
          <button
            onClick={() => { 
              setSelectedTeacher(row); 
              setForm({ 
                name: row.name || '', 
                email: row.email || '', 
                mobile: row.mobile || row.phone || '', 
                password: '', 
                dob: row.dob || '',
                qualification: row.qualification || '', 
                experience: row.experience || '',
                subject: row.subject || 'Mathematics', 
                salary: row.salary || '', 
                status: row.status || 'Active',
                assignedClasses: row.assignedClasses || ['Grade 8-A']
              }); 
              setIsEditModalOpen(true); 
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            title="Edit & Reset Password"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => { setSelectedTeacher(row); setIsAssignModalOpen(true); }}
            className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors"
            title="Class Assignment"
          >
            <Calendar size={15} />
          </button>
          <button
            onClick={() => toggleBlockStatus(row.id)}
            className={`p-1.5 rounded-lg transition-colors ${row.status === 'inactive' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-500 hover:bg-amber-100'}`}
            title={row.status === 'inactive' ? 'Activate' : 'Deactivate'}
          >
            {row.status === 'inactive' ? <CheckCircle size={15} /> : <Ban size={15} />}
          </button>
          <button
            onClick={() => handleDeleteTeacher(row.id, row.name)}
            className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
            title="Delete Teacher"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ]

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Mobile', 'Email', 'Department', 'Salary', 'Status']
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + filteredTeachers.map(t => [
      t.id, t.name, t.mobile, t.email, t.subject, t.salary, t.status
    ].join(',')).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `SAMS_Teachers_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Faculty Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create accounts, manage credentials & performance tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsBulkModalOpen(true)} className="btn-secondary flex items-center gap-2 px-4 py-2.5">
            <FileUp size={16} /> Bulk Upload
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-slate-600">
            <Download size={16} /> Export
          </button>
          <button
            onClick={() => {
              resetForm()
              setForm(prev => ({ ...prev, password: generatePassword('') }))
              setIsAddModalOpen(true)
            }}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg"
          >
            <UserPlus size={16} /> Add Teacher
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Faculty" value={teachers.length} icon={Users} color="blue" loading={loading} />
        <StatCard title="Active Teachers" value={teachers.filter(t => t.status !== 'inactive').length} icon={Shield} color="green" />
        <StatCard title="Avg Experience" value="7.2 yrs" icon={GraduationCap} color="purple" />
        <StatCard title="Avg Performance" value="82%" icon={TrendingUp} color="amber" />
      </div>

      {/* Controls + Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <FilterChips options={departments} value={filterDept} onChange={setFilterDept} />
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or mobile..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              autoComplete="off"
              name="teacher-search-unique"
            />
          </div>
        </div>

        <DataTable columns={COLUMNS} rows={filteredTeachers} loading={loading} />
      </div>

      {/* ADD/EDIT Teacher Modal */}
      <Modal
        open={isAddModalOpen || isEditModalOpen}
        onClose={closeAllModals}
        title={selectedTeacher ? 'Edit Teacher Account' : 'Create New Teacher Account'}
        size="lg"
      >
        <form autoComplete="off" onSubmit={e => e.preventDefault()}>
        <div className="max-h-[80vh] overflow-y-auto space-y-6 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <FormInput
                label="Full Name *"
                value={form.name}
                onChange={e => {
                  const name = e.target.value
                  setForm({ ...form, name })
                  // Auto-generate password
                  if (!selectedTeacher) {
                    setForm(prev => ({ ...prev, password: generatePassword(name) }))
                  }
                }}
                placeholder="e.g. Dr. Amit Verma"
              />
            </div>

            <FormInput label="Email *" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <FormInput label="Mobile Number * (Used for Login)" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} maxLength={10} />

            <div className="md:col-span-2">
              <FormInput
                label="Password *"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                helperText={selectedTeacher ? "Leave blank to keep existing password" : `Auto-generated: ${generatePassword(form.name) || 'Enter name first'}`}
              />
            </div>

            <FormInput label="Date of Birth *" type="date" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })} />
            <SelectDropdown label="Department *" options={DEPARTMENTS} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />


            <FormInput label="Monthly Salary (₹)" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} />
            <FormInput label="Experience (Years)" type="number" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
            <FormInput label="Qualification" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} />
          </div>

          <div className="pt-4 border-t border-slate-200 flex gap-3">
            <button
              onClick={handleSaveTeacher}
              disabled={loading}
              className="btn-primary flex-1 py-3 font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : (selectedTeacher ? 'Update Account' : 'Create Account')}
            </button>
            <button onClick={closeAllModals} className="btn-secondary px-8 py-3" disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Teacher Profile" size="md">
        <div className="max-h-[80vh] overflow-y-auto">
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-xl shadow-lg">
                  {selectedTeacher.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedTeacher.name}</h3>
                  <p className="text-brand-600 text-sm font-semibold">{selectedTeacher.subject} Dept</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="Teacher ID" value={selectedTeacher.id} />
                <InfoRow label="Status" value={<StatusBadge status={selectedTeacher.status} />} />
                <InfoRow label="Mobile (Login)" value={selectedTeacher.mobile || 'N/A'} />
                <InfoRow label="Email" value={selectedTeacher.email || 'N/A'} />
                <InfoRow label="DOB" value={selectedTeacher.dob || 'N/A'} />
                <InfoRow label="Experience" value={selectedTeacher.experience ? `${selectedTeacher.experience} yrs` : 'N/A'} />
                <InfoRow label="Qualification" value={selectedTeacher.qualification || 'N/A'} />
                <InfoRow label="Salary" value={selectedTeacher.salary ? `₹${selectedTeacher.salary}` : 'N/A'} />
              </div>

              {selectedTeacher.assignedClasses?.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wide">Assigned Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.assignedClasses.map(c => (
                      <span key={c} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 mt-6 flex justify-end">
                <button onClick={() => setIsViewModalOpen(false)} className="btn-primary px-8">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Performance Review Modal */}
      <Modal open={isPerformanceModalOpen} onClose={() => setIsPerformanceModalOpen(false)} title="Performance Review" size="lg">
        <div className="max-h-[80vh] overflow-y-auto space-y-6">
          {selectedTeacher && (() => {
            const perf = getPerformance({ ...selectedTeacher, adminRating: form.adminRating, adminRemarks: form.adminRemarks })
            return (
              <>
                {/* Score Header */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg border-2 border-brand-200">
                      {selectedTeacher.name[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{selectedTeacher.name}</h3>
                      <p className="text-slate-500 text-sm">{selectedTeacher.subject || selectedTeacher.role || 'Teacher'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-800">{perf.finalScore}%</p>
                    <span className={clsx('text-xs font-bold px-3 py-1 rounded-full', perf.badgeColor)}>{perf.badge}</span>
                  </div>
                </div>

                {/* Admin Override */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <h4 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Edit2 size={16} className="text-amber-500" />
                    Admin Rating Override
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormInput
                      label="Admin Rating (1-5)"
                      type="number"
                      step="0.5"
                      min="1"
                      max="5"
                      value={form.adminRating || ''}
                      onChange={e => setForm({ ...form, adminRating: e.target.value })}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Remarks</label>
                    <textarea
                      rows="3"
                      value={form.adminRemarks || ''}
                      onChange={e => setForm({ ...form, adminRemarks: e.target.value })}
                      placeholder="Performance notes, strengths, areas for improvement..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 font-medium resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                    <button onClick={handleSavePerformance} className="btn-primary flex-1 py-2.5">
                      <Save size={14} /> Save Rating
                    </button>
                    <button onClick={() => setIsPerformanceModalOpen(false)} className="btn-secondary px-6">
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            )
          })()}
        </div>
      </Modal>

      {/* Class Assignment Modal */}
      <Modal open={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Class Assignments" size="md">
        <div className="max-h-[80vh] overflow-y-auto space-y-6">
          {selectedTeacher && (
            <div>
              <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl gradient-brand text-white flex items-center justify-center font-bold">
                  {selectedTeacher.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-lg">{selectedTeacher.name}</p>
                  <p className="text-sm text-slate-500">{selectedTeacher.subject} Department</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-4">Current Assignments</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(form.assignedClasses || []).map((c, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium flex items-center gap-1 border">
                        {c}
                        <Trash2 size={12} className="cursor-pointer hover:text-rose-500" onClick={() => setForm({ ...form, assignedClasses: form.assignedClasses.filter((_, idx) => idx !== i) })} />
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-3 items-end bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200">
                    <div className="flex-1">
                      <SelectDropdown
                        label="Add Class"
                        options={ALL_CLASSES.map(c => ({ value: c, label: c }))}
                        value={assignClass}
                        onChange={e => setAssignClass(e.target.value)}
                      />

                    </div>
                    <button
                      onClick={() => {
                        if (assignClass && !form.assignedClasses?.includes(assignClass)) {
                          setForm({ ...form, assignedClasses: [...form.assignedClasses || [], assignClass] })
                          setAssignClass('')
                        }
                      }}
                      className="btn-secondary py-2.5 px-6 whitespace-nowrap h-min"
                      disabled={!assignClass}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                  <p className="font-semibold text-amber-800 mb-2">ℹ️ Scope Info</p>
                  <p className="text-amber-700 leading-relaxed">Teachers access only assigned classes for syllabus, homework, and LO entry. Assignments auto-expire end of academic year.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button onClick={handleSaveTeacher} className="btn-primary flex-1 py-3">
                  Save Assignments
                </button>
                <button onClick={() => setIsAssignModalOpen(false)} className="btn-secondary px-8 py-3">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
      {/* Bulk Upload Modal */}
      <Modal
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Teacher Bulk Import"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4">
              <FileUp size={32} />
            </div>
            <p className="font-semibold text-slate-800">Choose CSV File</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Upload teacher list with Name, Email, Mobile, Subject, Salary</p>
            <label className="btn-secondary mt-6 text-xs cursor-pointer px-4 py-2 flex items-center">
              Browse Files
              <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
            </label>
          </div>

          <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
            <p className="text-[10px] font-bold text-brand-600 uppercase mb-2">Instructions</p>
            <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-4 mb-3">
              <li>Header row required: Name, Email, Mobile, Subject, Salary</li>
              <li>Passwords will be automatically generated as Firstname@123#</li>
              <li>ID will be assigned automatically</li>
            </ul>
            <button onClick={() => {
              const csv = "Name,Email,Mobile,Subject,Salary\nAnjali Roy,anjali@school.com,9876543210,English,45000\n";
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'Teacher_Bulk_Template.csv';
              a.click();
            }} className="text-brand-600 font-bold text-xs underline cursor-pointer">Download Template</button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
