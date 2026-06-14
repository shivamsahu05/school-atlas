import { useState, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, Shield, Ban, CheckCircle, Eye,
  Mail, Phone, GraduationCap, Briefcase, IndianRupee,
  Clock, Edit2, Trash2, Calendar, Search, Filter, Save, Download, Star, TrendingUp, Lock, FileUp, Loader2, AlertTriangle, X, Plus
} from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge, Modal, FormInput } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { teachersApi, scheduleApi, academicApi } from '../../api'

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', mobile: '',
    dob: '', qualification: '', experience: '', salary: '', subject: '', assignments: []
  })
  
  const [academics, setAcademics] = useState({ classes: [], sections: [], subjects: [] })
  const [classCache, setClassCache] = useState({})

  useEffect(() => {
    Promise.all([
      academicApi.getClasses(),
      academicApi.getSections(),
      academicApi.getSubjects()
    ]).then(([cRes, secRes, subRes]) => {
      setAcademics({
        classes: cRes.data || [],
        sections: secRes.data || [],
        subjects: subRes.data || []
      })
    }).catch(err => console.error("Failed to fetch academics", err))
  }, [])

  const [confirmModal, setConfirmModal] = useState(false)
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const [viewAssignments, setViewAssignments] = useState([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)

  useEffect(() => {
    if (!viewTarget?.id) {
      setViewAssignments([])
      return
    }
    setLoadingAssignments(true)
    scheduleApi.getMyAssignments({ teacher_id: viewTarget.id })
      .then(res => {
        // Fetch raw response details
        const raw = res?.data?.assignments || res?.assignments || []
        setViewAssignments(raw)
      })
      .catch(err => {
        console.error('Error fetching teacher assignments:', err)
        setViewAssignments([])
      })
      .finally(() => {
        setLoadingAssignments(false)
      })
  }, [viewTarget])

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await teachersApi.getAll({ search: search || undefined })
      const arr = res.data?.data?.items || res.data?.items || res.data || []
      setTeachers(arr)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teachers.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  const openEdit = (t) => {
    setEditTarget(t)
    setForm({
      name: t.name || '', email: t.email || '', password: '',
      phone: t.phone || '', mobile: t.mobile || '',
      dob: t.dob || '', qualification: t.qualification || '',
      experience: t.experience || '', salary: t.salary || '', subject: t.subject || '',
      assignments: t.assignments || []
    })
  }

  const handlePreSubmit = (e) => {
    e.preventDefault()

    if (form.assignments && form.assignments.length > 0) {
      const assignmentSet = new Set();
      for (const a of form.assignments) {
        if (!a.class_id || !a.section_id || !a.subject_id) {
          alert('Please select Class, Section, and Subject for all assignments.');
          return;
        }
        const key = `${a.class_id}-${a.section_id}-${a.subject_id}`;
        if (assignmentSet.has(key)) {
          alert('Duplicate assignment found. A teacher cannot be assigned the same Class, Section, and Subject twice.');
          return;
        }
        assignmentSet.add(key);
      }
    }

    if (!editTarget) {
      setConfirmModal(true)
    } else {
      processSubmit()
    }
  }

  const processSubmit = async () => {
    try {
      setSubmitting(true)
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (editTarget) {
        await teachersApi.update(editTarget.id, payload)
        setEditTarget(null)
      } else {
        await teachersApi.create(payload)
        setAddModal(false)
        setConfirmModal(false)
      }
      setForm({ name: '', email: '', password: '', phone: '', mobile: '', dob: '', qualification: '', experience: '', salary: '', subject: '', assignments: [] })
      fetchTeachers()
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  // Pre-fetch class data when editing a teacher
  useEffect(() => {
    if (editTarget && form.assignments?.length > 0) {
      form.assignments.forEach(async (a) => {
        if (a.class_id && !classCache[a.class_id]) {
          try {
            const [secRes, subRes] = await Promise.all([
              academicApi.getClassSections(a.class_id),
              academicApi.getClassSubjects(a.class_id)
            ]);
            setClassCache(prev => ({
              ...prev,
              [a.class_id]: {
                sections: secRes.data || secRes.sections || [],
                subjects: subRes.data || subRes.subjects || []
              }
            }));
          } catch (e) {
            console.error("Failed to load class cache", e);
          }
        }
      });
    }
  }, [editTarget, form.assignments]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this teacher? This cannot be undone.')) return
    try {
      await teachersApi.delete(id)
      fetchTeachers()
    } catch (err) { alert(err.response?.data?.message || 'Delete failed.') }
  }

  const handleToggle = async (t) => {
    try {
      const newStatus = t.status === 'blocked' ? 'active' : 'blocked'
      await teachersApi.updateStatus(t.id, newStatus)
      fetchTeachers()
    } catch (err) { alert(err.response?.data?.message || 'Status change failed.') }
  }

  const active = teachers.filter(t => t.status === 'active').length
  const blocked = teachers.filter(t => t.status === 'blocked').length

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'mobile', label: 'Mobile', sortable: false },
    { key: 'subject', label: 'Subject', sortable: true },
    { key: 'qualification', label: 'Qualification', sortable: false },
    { key: 'experience', label: 'Experience', sortable: false },
    { key: 'status', label: 'Status', sortable: true, render: v => <StatusBadge status={v || 'active'} /> },
    {
      key: '_actions', label: '', sortable: false,
      render: (_, r) => (
        <div className="flex gap-1.5">
          <button onClick={() => setViewTarget(r)}
            className="p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100">
            <Eye size={13} />
          </button>
          <button onClick={() => openEdit(r)}
            className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100">
            <Edit2 size={13} />
          </button>
          <button onClick={() => handleToggle(r)}
            className={`p-1.5 rounded-lg ${r.status === 'active'
              ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
            {r.status === 'active' ? <Ban size={13} /> : <CheckCircle size={13} />}
          </button>
          <button onClick={() => handleDelete(r.id)}
            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100">
            <Trash2 size={13} />
          </button>
        </div>
      )
    },
  ]

  const [errors, setErrors] = useState({})

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }

  const [isPasswordManual, setIsPasswordManual] = useState(false)

  const handleInputChange = (field, value) => {
    setForm(f => {
      const updated = { ...f, [field]: value };

      // Auto-generate password from name if not manually edited and in "Create" mode
      if (field === 'name' && !editTarget && !isPasswordManual) {
        const firstName = value.trim().split(' ')[0];
        if (firstName) {
          updated.password = `${firstName}@123#`;
        } else {
          updated.password = '';
        }
      }
      return updated;
    })

    if (field === 'password') {
      setIsPasswordManual(true)
    }

    // Clear error when typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Real-time validation for email
    if (field === 'email') {
      if (value && !validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      }
    }
  }

  const handleAddAssignment = () => {
    setForm(f => ({
      ...f,
      assignments: [...(f.assignments || []), { class_id: '', section_id: '', subject_id: '' }]
    }))
  }

  const handleRemoveAssignment = (index) => {
    setForm(f => ({
      ...f,
      assignments: f.assignments.filter((_, i) => i !== index)
    }))
  }

  const handleAssignmentChange = async (index, field, value) => {
    setForm(f => {
      const newAssignments = [...(f.assignments || [])]
      newAssignments[index] = { ...newAssignments[index], [field]: value }
      if (field === 'class_id') {
        newAssignments[index].section_id = ''
        newAssignments[index].subject_id = ''
      }
      return { ...f, assignments: newAssignments }
    })

    if (field === 'class_id' && value && !classCache[value]) {
      try {
        const [secRes, subRes] = await Promise.all([
          academicApi.getClassSections(value),
          academicApi.getClassSubjects(value)
        ]);
        setClassCache(prev => ({
          ...prev,
          [value]: {
            sections: secRes.data || secRes.sections || [],
            subjects: subRes.data || subRes.subjects || []
          }
        }));
      } catch (e) {
        console.error("Failed to fetch dynamic class options", e);
      }
    }
  }

  const renderFormFields = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Full Name *" value={form.name} onChange={e => handleInputChange('name', e.target.value)} required />
          <FormInput
            label="Email *"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={e => handleInputChange('email', e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <FormInput
              label={`Password ${editTarget ? '(leave blank to keep)' : ' *'}`}
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => handleInputChange('password', e.target.value)}
              required={!editTarget}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[32px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <Eye size={16} /> : <Lock size={16} />}
            </button>
          </div>
          <FormInput
            label="Phone (used for Login)"
            value={form.phone}
            maxLength={13}
            placeholder="Max 13 digits"
            onChange={e => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Mobile"
            value={form.mobile}
            maxLength={13}
            placeholder="Max 13 digits"
            onChange={e => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))}
          />
          <FormInput label="Date of Birth" type="date" value={form.dob} onChange={e => handleInputChange('dob', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Subject" value={form.subject} onChange={e => handleInputChange('subject', e.target.value)} placeholder="e.g. Mathematics" />
          <FormInput label="Experience" value={form.experience} onChange={e => handleInputChange('experience', e.target.value)} placeholder="e.g. 5 years" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Qualification" value={form.qualification} onChange={e => handleInputChange('qualification', e.target.value)} placeholder="e.g. M.Sc, B.Ed" />
          <FormInput label="Salary" value={form.salary} onChange={e => handleInputChange('salary', e.target.value)} placeholder="e.g. 45000" />
        </div>
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-800">Class & Section Assignments</span>
            <button type="button" onClick={handleAddAssignment} className="btn-secondary btn btn-sm gap-1.5">
              <Plus size={14} /> Add Assignment
            </button>
          </div>
          
          <div className="space-y-3">
            {(!form.assignments || form.assignments.length === 0) && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-6">
                No assignments added yet
              </div>
            )}
            {form.assignments?.map((assignment, index) => (
              <div key={index} className="flex gap-2 items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Class *</label>
                    <select 
                      value={assignment.class_id || ''}
                      onChange={e => handleAssignmentChange(index, 'class_id', e.target.value)}
                      className="form-input py-1.5 px-2 text-sm"
                      required
                    >
                      <option value="">Select</option>
                      {academics.classes.map(c => <option key={c.id} value={c.id}>{c.class_number || c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Section</label>
                    <select 
                      value={assignment.section_id || ''}
                      onChange={e => handleAssignmentChange(index, 'section_id', e.target.value)}
                      className="form-input py-1.5 px-2 text-sm"
                      disabled={!assignment.class_id}
                    >
                      <option value="">{assignment.class_id && classCache[assignment.class_id]?.sections?.length === 0 ? 'No Sections Available' : 'Select'}</option>
                      {assignment.class_id && classCache[assignment.class_id]?.sections?.map(s => 
                        <option key={s.section_id || s.id} value={s.section_id || s.id}>{s.section_name || s.name || s.code}</option>
                      )}
                      {/* Fallback to global sections if cache not yet populated but class selected */}
                      {assignment.class_id && (!classCache[assignment.class_id] || !classCache[assignment.class_id].sections) && academics.sections.map(s => 
                        <option key={s.id} value={s.id}>{s.name || s.code}</option>
                      )}
                    </select>
                  </div>
                  <div className="flex flex-col relative">
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Subject *</label>
                    <select 
                      value={assignment.subject_id || ''}
                      onChange={e => handleAssignmentChange(index, 'subject_id', e.target.value)}
                      className="form-input py-1.5 px-2 text-sm pr-8"
                      required
                      disabled={!assignment.class_id}
                    >
                      <option value="">{assignment.class_id && classCache[assignment.class_id]?.subjects?.length === 0 ? 'No Subjects Available' : 'Select'}</option>
                      {assignment.class_id && classCache[assignment.class_id]?.subjects?.map(s => 
                        <option key={s.subject_id || s.id} value={s.subject_id || s.id}>{s.subject_name || s.name}</option>
                      )}
                      {/* Fallback to global subjects if cache not yet populated but class selected */}
                      {assignment.class_id && (!classCache[assignment.class_id] || !classCache[assignment.class_id].subjects) && academics.subjects.map(s => 
                        <option key={s.id} value={s.id}>{s.name}</option>
                      )}
                    </select>
                  </div>
                </div>
                <button type="button" onClick={() => handleRemoveAssignment(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mt-5">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Staff" value={teachers.length} icon={Users} color="blue" />
        <StatCard title="Active" value={active} icon={CheckCircle} color="green" />
        <StatCard title="Blocked" value={blocked} icon={Ban} color="red" />
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <SectionHeader title="Teacher Directory" subtitle={`${teachers.length} staff members`} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
              <Search size={14} className="text-slate-400" />
              <input className="text-sm outline-none w-36" placeholder="Search…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => teachersApi.exportExcel().then(r => {
              const url = URL.createObjectURL(r.data)
              Object.assign(document.createElement('a'), { href: url, download: 'teachers.xlsx' }).click()
            }).catch(() => alert('Export failed.'))}
              className="btn-secondary btn btn-sm gap-1.5">
              <Download size={13} /> Export
            </button>
            <button onClick={() => setBulkModal(true)} className="btn-secondary btn btn-sm gap-1.5">
              <FileUp size={14} /> Bulk Import
            </button>
            <button onClick={() => { setEditTarget(null); setAddModal(true); setIsPasswordManual(false); }} className="btn-primary btn btn-sm gap-1.5">
              <UserPlus size={14} /> Add Teacher
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-rose-500 mb-3">{error}</p>}
        {loading
          ? <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-brand-500" /></div>
          : <DataTable columns={columns} rows={teachers} emptyMessage="No teachers found." />
        }
      </div>

      {/* Bulk Import Modal */}
      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Teacher Import" size="lg">
        <div className="space-y-6">
          {/* Step 1: Download */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-brand-600">
                <Download size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800">Step 1: Download Template</p>
                <p className="text-xs text-slate-500 mt-0.5">Use our standard format to ensure data consistency.</p>
              </div>
            </div>
            <button 
              onClick={() => teachersApi.downloadTemplate().then(r => {
                const url = URL.createObjectURL(r.data);
                Object.assign(document.createElement('a'), { href: url, download: 'teacher_bulk_template.xlsx' }).click();
              })}
              className="btn-primary btn btn-sm px-4"
            >
              Download
            </button>
          </div>

          {/* Step 2: Upload */}
          <div className="space-y-4">
            <div>
              <p className="font-bold text-slate-800">Step 2: Upload Data</p>
              <p className="text-xs text-slate-500 mt-0.5">Select your filled Excel file (.xlsx or .xls)</p>
            </div>

            {!bulkResult ? (
              <label className="group relative border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all bg-white hover:bg-brand-50/30">
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xlsx, .xls"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      setSubmitting(true)
                      const res = await teachersApi.bulkUpload(file)
                      setBulkResult(res.data.data)
                      fetchTeachers()
                    } catch (err) {
                      alert(err.response?.data?.message || 'Upload failed.')
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                />
                <div className="w-16 h-16 bg-slate-50 group-hover:bg-brand-100 rounded-full flex items-center justify-center text-slate-400 group-hover:text-brand-600 mb-4 transition-colors">
                  {submitting ? <Loader2 className="animate-spin" /> : <FileUp size={32} />}
                </div>
                <p className="text-sm font-bold text-slate-600">Click to Browse Files</p>
                <p className="text-xs text-slate-400 mt-1">or drag and drop here</p>
              </label>
            ) : (
              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Processing Complete</p>
                      <p className="text-xs text-slate-500">Summary of your import</p>
                    </div>
                  </div>
                  <button onClick={() => setBulkResult(null)} className="text-xs text-brand-600 font-bold hover:underline">Upload Another</button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Total</p>
                    <p className="text-lg font-bold text-slate-800">{bulkResult.total}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-center">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-500">Success</p>
                    <p className="text-lg font-bold text-emerald-600">{bulkResult.success}</p>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl text-center">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-rose-500">Failed</p>
                    <p className="text-lg font-bold text-rose-600">{bulkResult.failed}</p>
                  </div>
                </div>

                {bulkResult.errors?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-amber-500" /> Issues Detected ({bulkResult.errors.length})
                    </p>
                    <div className="max-h-32 overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-100">
                      {bulkResult.errors.map((err, i) => (
                        <p key={i} className="text-[10px] text-slate-500 mb-1 last:mb-0 leading-relaxed">• {err}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button 
              onClick={() => { setBulkModal(false); setBulkResult(null); }}
              className="btn-primary btn w-full justify-center py-3"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Teacher" size="lg">
        <form onSubmit={handlePreSubmit} className="space-y-4">
          {renderFormFields()}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary btn flex-1 justify-center disabled:opacity-60">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null} Create Teacher
            </button>
            <button type="button" onClick={() => setAddModal(false)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Teacher" size="lg">
        <form onSubmit={handlePreSubmit} className="space-y-4">
          {renderFormFields()}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary btn flex-1 justify-center disabled:opacity-60">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null} Save Changes
            </button>
            <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title="Confirm Teacher Details">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm font-bold text-blue-800 mb-2">Please review the details before creating:</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="text-slate-500">Name:</span> <span className="font-bold">{form.name}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Email:</span> <span className="font-bold">{form.email}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Phone:</span> <span className="font-bold">{form.phone || '—'}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Subject:</span> <span className="font-bold">{form.subject || '—'}</span></div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={processSubmit} disabled={submitting} className="btn-primary btn flex-1 justify-center">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2"/> : null} Confirm & Create
            </button>
            <button onClick={() => setConfirmModal(false)} className="btn-secondary btn px-4">Back to Edit</button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Teacher Details">
        {viewTarget && (
          <div className="space-y-3">
            {[
              ['Name', viewTarget.name],
              ['Email', viewTarget.email],
              ['Phone', viewTarget.phone || '—'],
              ['Mobile', viewTarget.mobile || '—'],
              ['Subject', viewTarget.subject || '—'],
              ['Qualification', viewTarget.qualification || '—'],
              ['Experience', viewTarget.experience || '—'],
              ['Salary', viewTarget.salary ? `₹${viewTarget.salary}` : '—'],
              ['Date of Birth', viewTarget.dob || '—'],
              ['Status', viewTarget.status || 'active'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-4 py-2 border-b border-slate-50">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-32 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-slate-800">{value}</span>
              </div>
            ))}
            
            {/* Timetable Schedule Section */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-3">Timetable Schedule / Assignments</span>
              {loadingAssignments ? (
                <div className="flex items-center gap-2 py-3 text-slate-400 text-xs">
                  <Loader2 className="animate-spin text-brand-500" size={16} />
                  <span>Loading schedule...</span>
                </div>
              ) : viewAssignments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {viewAssignments.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-brand-50/20 transition-all flex items-center justify-between group shadow-sm">
                      <div className="space-y-0.5">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Subject</div>
                        <div className="text-sm font-bold text-slate-700">{item.subjectName || '—'}</div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Class, Sec</div>
                        <div className="text-xs font-black text-brand-600 bg-brand-50/50 group-hover:bg-brand-100/50 px-2 py-0.5 rounded-md border border-brand-100/30 inline-block mt-0.5">
                          {item.className},{item.sectionCode || 'All'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-6">
                  No active class/subject assignments
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => { setViewTarget(null); openEdit(viewTarget) }}
                className="btn-secondary btn gap-1.5"><Edit2 size={14} /> Edit</button>
              <button onClick={() => setViewTarget(null)} className="btn-primary btn flex-1 justify-center">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
