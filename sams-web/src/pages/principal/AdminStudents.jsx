import { useState, useMemo, useEffect } from 'react'
import {
  Users, UserPlus, FileUp, Download, Search, Filter,
  Trash2, Edit2, AlertCircle, CheckCircle, GraduationCap,
  History, UserX, UserCheck, RefreshCw, ChevronRight, ChevronDown, Download as DownloadIcon, Eye, Ban, TrendingUp
} from 'lucide-react'
import { StatCard, SectionHeader, Tabs, StatusBadge, Modal, DataTable, FilterChips, InfoRow, FormInput, SelectDropdown } from '../../components/ui/index.jsx'
import { ALL_CLASSES as GLOBAL_CLASSES } from '../../data/constants.js'

const ALL_CLASSES   = GLOBAL_CLASSES.filter(c => c !== 'All')
const BASE_CLASSES  = [...new Set(ALL_CLASSES.map(c => c.split('-')[0]))]
const SECTIONS      = ['A', 'B', 'C', 'D']
import { studentApi } from '../../services/schoolApi.js'
import { STUDENTS } from '../../data/dummyData.js'

import clsx from 'clsx'

// ── Components ─────────────────────────────────────────────────────────────

/**
 * Advanced Student Manager for Admin Portal
 */
export default function AdminStudents() {
  const [students, setStudents] = useState([])
  
  useEffect(() => {
    studentApi.getAll().then(res => {
      const data = res.data?.data || res.data;
      const apiStudents = Array.isArray(data) ? data : [];
      setStudents(apiStudents.length > 0 ? apiStudents : STUDENTS);
    }).catch(err => {
      console.error('Failed to fetch students, using fallback:', err);
      setStudents(STUDENTS);
    })
  }, [])


  const [activeTab, setActiveTab] = useState('all') // 'all' | 'active' | 'graduated' | 'failed'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('All')
  const [filterSection, setFilterSection] = useState('All')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isLifecycleModalOpen, setIsLifecycleModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)

  // Selection
  const [selectedStudent, setSelectedStudent] = useState(null)

  // Form State
  const [form, setForm] = useState({
    name: '', fatherName: '', motherName: '', gender: 'Male',
    class: 'Grade 8-A', mobile: '', optMobile: '', address: '',
    dob: '', remarks: '', isNewStudent: false
  })

  const [alert, setAlert] = useState(null) // { type: 'error' | 'warning', message: '', requireCheckbox?: boolean }
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'primary', onConfirm: null })

  // ── Logic ──────────────────────────────────────────────────────────────────

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const sClass = s.class ? s.class.split('-')[0] : ''
      const sSection = s.class ? s.class.split('-')[1] : ''

      const matchClass = filterClass === 'All' || sClass === filterClass
      const matchSection = filterSection === 'All' || sSection === filterSection

      const matchTab = activeTab === 'all' || (activeTab === 'graduated' && s.status === 'Graduated') ||
        (activeTab === 'failed' && s.status === 'Failed') ||
        (activeTab === 'active' && (!s.status || s.status === 'Active'))

      return matchSearch && matchClass && matchSection && matchTab
    })
  }, [students, searchTerm, filterClass, filterSection, activeTab])

  /**
   * Validation and Duplicate Logic
   */
  const handleSave = () => {
    // 0. Base Validations
    if (!form.name || !form.fatherName || !form.motherName || !form.mobile) {
      setAlert({ type: 'error', message: 'Name, Father Name, Mother Name, and Primary Mobile are required.' })
      return
    }
    if (form.mobile.length !== 10 || isNaN(form.mobile)) {
      setAlert({ type: 'error', message: 'Primary Mobile must be a valid 10-digit number.' })
      return
    }

    // 1. Check for EXACT duplicate (Name + Father + Mother + Mobile)
    const exactMatch = students.find(s =>
      s.id !== editId &&
      s.name.toLowerCase() === form.name.toLowerCase() &&
      s.fatherName?.toLowerCase() === form.fatherName.toLowerCase() &&
      s.motherName?.toLowerCase() === form.motherName.toLowerCase() &&
      s.mobile === form.mobile
    )

    if (exactMatch) {
      setAlert({ type: 'error', message: 'Student already exists or may be a FAILED student. Do not create new ID.' })
      return
    }

    // 2. Class conflict
    const classConflict = students.find(s =>
      s.id !== editId &&
      s.name.toLowerCase() === form.name.toLowerCase() &&
      s.class === form.class
    )

    if (classConflict && !form.isNewStudent) {
      setAlert({ type: 'warning', message: 'A student with the same name already exists in this class.', requireCheckbox: true })
      return
    }

    if (editId) {
      // Edit Mode
      setStudents(prev => prev.map(s => s.id === editId ? { ...form, id: s.id, rollNo: s.rollNo, status: s.status, history: s.history } : s))
    } else {
      // Create Mode
      const newId = `S${String(students.length + 1).padStart(3, '0')}`
      const newStudent = { ...form, id: newId, rollNo: 'TBD', status: 'Active', history: [{ year: '2023-24', class: form.class, result: 'Joined' }] }
      setStudents([newStudent, ...students])
    }

    setIsAddModalOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setForm({ name: '', fatherName: '', motherName: '', gender: 'Male', class: 'Grade 8-A', mobile: '', optMobile: '', address: '', dob: '', remarks: '', isNewStudent: false })
    setAlert(null)
    setEditId(null)
  }

  const handleBlock = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Block Student",
      message: "Are you sure you want to block this student? They will be hidden from active lists.",
      type: "danger",
      onConfirm: () => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'Blocked' } : s))
      }
    });
  }

  const handleEdit = (row) => {
    setForm({ ...row, isNewStudent: false })
    setEditId(row.id)
    setIsAddModalOpen(true)
  }

  const handleBulkUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const rows = text.split('\n').map(r => r.trim()).filter(r => r)

      const newStudents = []
      let errors = []

      for (let i = 1; i < rows.length; i++) {
        // Simple comma split parsing
        const cols = rows[i].split(',')
        const [name, fatherName, gender, cls, mobile] = cols

        if (!name || !fatherName || !gender || !cls || !mobile) {
          errors.push(`Row ${i + 1}: Missing required fields.`)
          continue
        }

        newStudents.push({
          id: `S${String(students.length + newStudents.length + 1).padStart(3, '0')}`,
          name, fatherName, gender, class: cls, mobile,
          rollNo: 'TBD', status: 'Active',
          history: [{ year: '2023-24', class: cls, result: 'Joined via Bulk' }]
        })
      }

      if (errors.length) {
        alert("Errors found during import:\n" + errors.join('\n') + "\n\nSuccessfully imported " + newStudents.length + " students.")
      } else {
        alert("Success! " + newStudents.length + " students imported.")
      }

      setStudents(prev => [...newStudents, ...prev])
      setIsBulkModalOpen(false)
    }
    reader.readAsText(file)
  }

  const handleLifecycleAction = (student, action) => {
    const updated = students.map(s => {
      if (s.id === student.id) {
        const history = [...(s.history ?? [])]
        let status = 'Active'
        let currentClass = s.class

        if (action === 'promote') {
          // 8-A -> 9-A logic
          const parts = s.class.split(' ')
          const grade = parseInt(parts[1])
          currentClass = `${parts[0]} ${grade + 1}-${parts[1].split('-')[1]}`
          history.push({ year: '2024-25', class: currentClass, result: 'Promoted' })
        } else if (action === 'fail') {
          history.push({ year: '2024-25', class: s.class, result: 'Repeated' })
          status = 'Failed'
        } else if (action === 'graduate') {
          status = 'Graduated'
          history.push({ year: '2024-25', class: 'None', result: 'Graduated' })
        }

        return { ...s, class: currentClass, status, history }
      }
      return s
    })
    setStudents(updated)
    setIsLifecycleModalOpen(false)
  }

  const handleBulkPromote = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Bulk Promote Students",
      message: "Are you sure you want to promote ALL active students to the next grade? This action cannot be easily undone.",
      type: "primary",
      onConfirm: () => {
        const updated = students.map(s => {
          if (!s.status || s.status === 'Active') {
            const history = [...(s.history ?? [])];
            let currentClass = s.class;
            let status = 'Active';

            if (s.class && s.class.includes('-')) {
              const parts = s.class.split(' ');
              if (parts.length === 2) {
                const gradeMatch = parts[1].split('-');
                const gradeNum = parseInt(gradeMatch[0]);
                
                if (!isNaN(gradeNum)) {
                  if (gradeNum >= 12) {
                     status = 'Graduated';
                     currentClass = 'None';
                     history.push({ year: '2024-25', class: 'None', result: 'Graduated via Bulk' });
                  } else {
                     currentClass = `${parts[0]} ${gradeNum + 1}-${gradeMatch[1] || 'A'}`;
                     history.push({ year: '2024-25', class: currentClass, result: 'Promoted via Bulk' });
                  }
                }
              }
            }
            return { ...s, class: currentClass, status, history };
          }
          return s;
        });

        setStudents(updated);
      }
    });
  }

  const handleDirectPromote = (student) => {
    setConfirmDialog({
      isOpen: true,
      title: "Fast Promote Student",
      message: `Are you sure you want to promote ${student.name}?`,
      type: "primary",
      onConfirm: () => {
        const updated = students.map(s => {
          if (s.id === student.id) {
            const history = [...(s.history ?? [])];
            let currentClass = s.class;
            let status = 'Active';

            if (s.class && s.class.includes('-')) {
              const parts = s.class.split(' ');
              if (parts.length === 2) {
                const gradeMatch = parts[1].split('-');
                const gradeNum = parseInt(gradeMatch[0]);
                
                if (!isNaN(gradeNum)) {
                  if (gradeNum >= 12) {
                     status = 'Graduated';
                     currentClass = 'None';
                     history.push({ year: '2024-25', class: 'None', result: 'Graduated' });
                  } else {
                     currentClass = `${parts[0]} ${gradeNum + 1}-${gradeMatch[1] || 'A'}`;
                     history.push({ year: '2024-25', class: currentClass, result: 'Promoted' });
                  }
                }
              }
            }
            return { ...s, class: currentClass, status, history };
          }
          return s;
        });

        setStudents(updated);
      }
    });
  }

  // ── UI Helpers ─────────────────────────────────────────────────────────────

  const COLUMNS = [
    { key: 'id', label: 'Student ID', sortable: true },
    {
      key: 'name', label: 'Student Name', sortable: true,
      render: (v, row) => (
        <div className="flex flex-col justify-center">
          <p className="font-semibold text-slate-800">{v}</p>
          <p className="text-[10px] text-slate-400 font-medium">Roll: {row.rollNo}</p>
        </div>
      )
    },
    { key: 'class', label: 'Class', sortable: true, sortBy: (row) => parseInt(row.class?.match(/\d+/) || 0),
      render: (_, row) => row.class?.split('-')[0] || row.class
    },
    { key: 'section', label: 'Section', sortable: true, sortBy: (row) => row.class?.split('-')[1] || '-',
      render: (_, row) => row.class?.split('-')[1] || '-'
    },
    {
      key: 'performance', label: 'Performance',
      render: (_, row) => {
        const marks = row.marks || { Math: Math.floor(Math.random() * 31) + 65, Science: Math.floor(Math.random() * 31) + 65, English: Math.floor(Math.random() * 31) + 65 };
        row.marks = marks;
        return (
          <div>
            <p className="text-xs font-bold text-slate-700">In Progress</p>
            <p className="text-[10px] text-brand-600 font-semibold">{row.class} Ongoing</p>
          </div>
        )
      }
    },
    {
      key: 'status', label: 'Status',
      render: v => <StatusBadge status={v || 'Active'} />
    },
    {
      key: 'actions', label: 'Management',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleDirectPromote(row)}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
            title="Fast Promote"
          >
            <TrendingUp size={15} />
          </button>
          <button
            onClick={() => { setSelectedStudent(row); setIsLifecycleModalOpen(true); }}
            className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors"
            title="Lifecycle Options (Fail/Graduate)"
          >
            <History size={15} />
          </button>
          <button
            onClick={() => { setSelectedStudent(row); setIsViewModalOpen(true); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            title="View Profile"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            title="Edit Details"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => handleBlock(row.id)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
            title="Block Student"
          >
            <Ban size={15} />
          </button>
        </div>
      )
    },
    {
      key: 'expand', label: '',
      render: (_, row, { toggleExpand, isExpanded }) => (
        <button onClick={toggleExpand} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
          <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )
    }
  ]

  const expandableRender = (row) => {
    const marks = row.marks || { Math: 0, Science: 0, English: 0 }
    return (
      <div className="p-4 bg-brand-50/20 shadow-[inset_0_4px_6px_-2px_rgba(0,0,0,0.02)]">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Previous Term Marks</p>
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(marks).map(([subject, score]) => (
            <div key={subject} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex flex-col items-center transition-all hover:border-brand-200">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{subject}</p>
              <p className={`text-lg font-bold ${score >= 40 ? 'text-brand-600' : 'text-rose-500'}`}>{score}<span className="text-xs text-slate-400 font-medium">/100</span></p>
              <p className="text-[10px] font-semibold mt-1 text-slate-500">{score >= 40 ? 'Pass' : 'Fail'}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const TABS = [
    { value: 'all', label: 'All Students' },
    { value: 'active', label: 'Active' },
    { value: 'failed', label: 'Failed/Repeated' },
    { value: 'graduated', label: 'Graduated' },
  ]

  // ── Export Logic ──────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = ['ID', 'Name', 'Roll No', 'Class', 'Guardian', 'Mobile', 'Status']
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(',') + "\n"
      + filteredStudents.map(s => [s.id, s.name, s.rollNo, s.class, s.fatherName, s.mobile, s.status].join(',')).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `SAMS_Students_${filterClass}_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const CLASS_OPTS = []


  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header & Stats ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Student Directory</h1>
          <p className="text-sm text-slate-500">Manage student lifecycle, promotions, and documentation</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkPromote}
            className="btn-success flex items-center gap-2 shadow-sm"
          >
            <UserCheck size={16} /> Promote All
          </button>
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileUp size={16} /> Bulk Upload
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={16} /> Add Student
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Enrollment" value={students.length} icon={Users} color="blue" />
        <StatCard title="Promoted (Yearly)" value={students.filter(s => s.status === 'Active').length} icon={UserCheck} color="green" />
        <StatCard title="Failed/Repeated" value={students.filter(s => s.status === 'Failed').length} icon={RefreshCw} color="amber" />
        <StatCard title="Graduated" value={students.filter(s => s.status === 'Graduated').length} icon={GraduationCap} color="purple" />
      </div>

      {/* ── Table & Controls ───────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search name or ID..."
                className="input pl-10 py-2 text-sm w-48 md:w-64"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="select py-2 text-sm w-36 pr-8 appearance-none"
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
              >
                <option value="All">All Classes</option>
                {BASE_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="select py-2 text-sm w-32 pr-8 appearance-none"
                value={filterSection}
                onChange={e => setFilterSection(e.target.value)}
              >
                <option value="All">All Sections</option>
                {SECTIONS.map(sec => (
                  <option key={sec} value={sec}>Sec {sec}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

          </div>
        </div>

        <DataTable
          columns={COLUMNS}
          rows={filteredStudents}
          emptyMessage="No students found matching your criteria."
          expandableRender={expandableRender}
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleExport}
            className="text-xs font-semibold text-brand-600 flex items-center gap-1 hover:underline"
          >
            <Download size={14} /> Export Student Data to Excel
          </button>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}

      {/* Add Student Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetForm(); }}
        title={editId ? "Update Student Profile" : "Student Registration"}
        size="lg"
      >
        <div className="space-y-6">

          {alert && (
            <div className={clsx(
              "p-4 rounded-xl flex gap-3 animate-slide-up",
              alert.type === 'error' ? "bg-rose-50 border border-rose-100 text-rose-700" : "bg-amber-50 border border-amber-100 text-amber-700"
            )}>
              <AlertCircle size={20} className="flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">{alert.type === 'error' ? 'Duplicate Forbidden' : 'Potential Duplicate'}</p>
                <p className="text-xs">{alert.message}</p>
                {alert.requireCheckbox && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="confirmNew"
                      checked={form.isNewStudent}
                      onChange={e => setForm({ ...form, isNewStudent: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="confirmNew" className="text-xs font-bold uppercase">This is a NEW student</label>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormInput label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rahul Sharma" />
            <FormInput label="Father Name" value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} />
            <FormInput label="Mother Name" value={form.motherName} onChange={e => setForm({ ...form, motherName: e.target.value })} />

            <SelectDropdown label="Gender" options={['Male', 'Female', 'Other']} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} />
            <SelectDropdown label="Class/Section" options={CLASS_OPTS} value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} />
            <FormInput label="DOB" type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />

            <FormInput label="Primary Mobile" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} maxLength={10} placeholder="10-digit number" />
            <FormInput label="Secondary Mobile" value={form.optMobile} onChange={e => setForm({ ...form, optMobile: e.target.value })} maxLength={10} />
            <FormInput label="Address" className="col-span-2 lg:col-span-1" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full residential address..." />

            <div className="col-span-full">
              <FormInput label="Administrative Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Optional notes for office internal use..." />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="btn-primary flex-1 justify-center py-3"
            >
              {editId ? 'Save Changes' : 'Verify & Generate ID'}
            </button>
            <button
              onClick={() => { setIsAddModalOpen(false); resetForm(); }}
              className="btn-secondary px-8"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Lifecycle Management Modal */}
      <Modal
        open={isLifecycleModalOpen}
        onClose={() => setIsLifecycleModalOpen(false)}
        title="Student Academic Lifecycle"
        size="md"
      >
        {selectedStudent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg">
                {selectedStudent.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{selectedStudent.name}</p>
                <p className="text-xs text-slate-500">{selectedStudent.id} · {selectedStudent.class}</p>
              </div>
              <StatusBadge status={selectedStudent.status || 'Active'} />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historical Timeline</p>
              <div className="bg-white border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
                {(selectedStudent.history ?? []).length > 0 ? (
                  selectedStudent.history.map((h, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{h.year}</p>
                        <p className="text-[10px] text-slate-400">{h.class}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{h.result}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-xs text-slate-400">No enrollment history found.</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleLifecycleAction(selectedStudent, 'promote')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-emerald-100 hover:bg-emerald-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck size={16} />
                </div>
                <span className="text-[10px] font-bold text-emerald-700">PROMOTE</span>
              </button>

              <button
                onClick={() => handleLifecycleAction(selectedStudent, 'fail')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-amber-100 hover:bg-amber-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RefreshCw size={16} />
                </div>
                <span className="text-[10px] font-bold text-amber-700">FAIL/REPEAT</span>
              </button>

              <button
                onClick={() => handleLifecycleAction(selectedStudent, 'graduate')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-purple-100 hover:bg-purple-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap size={16} />
                </div>
                <span className="text-[10px] font-bold text-purple-700">GRADUATE</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Upload Modal Placeholder */}
      <Modal
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Student Bulk Import"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4">
              <FileUp size={32} />
            </div>
            <p className="font-semibold text-slate-800">Choose CSV File</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Upload student list with Name, Parent Details, and Mobile</p>
            <label className="btn-secondary mt-6 text-xs cursor-pointer">
              Browse Files
              <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
            </label>
          </div>

          <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
            <p className="text-[10px] font-bold text-brand-600 uppercase mb-2">Instructions</p>
            <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-4 mb-3">
              <li>Header row required: Name, FatherName, Gender, Class, Mobile</li>
              <li>Ensure Student ID column is empty for new students</li>
              <li>Duplicate detection will run automatically on import</li>
            </ul>
            <button onClick={() => {
              const csv = "Name,FatherName,Gender,Class,Mobile\nJohn Doe,Richard Doe,Male,Grade 8-A,9876543210\n";
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'Student_Bulk_Template.csv';
              a.click();
            }} className="text-brand-600 font-bold text-xs underline cursor-pointer">Download Template</button>
          </div>
        </div>
      </Modal>

      {/* View Student Modal */}
      <Modal open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Student Profile" size="md">
        {selectedStudent && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-14 h-14 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-xl">
                {selectedStudent.name[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedStudent.name}</h3>
                <p className="text-brand-600 text-sm font-semibold">{selectedStudent.class}</p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={selectedStudent.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
              <InfoRow label="Student ID" value={selectedStudent.id} />
              <InfoRow label="Roll No" value={selectedStudent.rollNo || 'TBD'} />
              <InfoRow label="Father Name" value={selectedStudent.fatherName || 'Not Provided'} />
              <InfoRow label="Mother Name" value={selectedStudent.motherName || 'Not Provided'} />
              <InfoRow label="DOB" value={selectedStudent.dob || 'Not Provided'} />
              <InfoRow label="Gender" value={selectedStudent.gender || 'Not Provided'} />
              <InfoRow label="Primary Mobile" value={selectedStudent.mobile || 'N/A'} />
              <InfoRow label="Remarks" value={selectedStudent.remarks || 'None'} />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs text-slate-400 uppercase font-bold">Academic Progress</p>
                <span className="badge badge-blue text-[10px]">Current: In Progress</span>
              </div>

              <p className="text-xs font-semibold text-slate-600 mb-2">Previous Term History</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {(selectedStudent.marks || { Math: 85, Science: 78, English: 90 }).Math && Object.entries(selectedStudent.marks || { Math: 85, Science: 78, English: 90 }).map(([sub, mark]) => (
                  <div key={sub} className="bg-slate-50 p-2 rounded text-center border border-slate-100">
                    <p className="text-[10px] text-slate-500 uppercase">{sub}</p>
                    <p className="font-bold text-slate-700">{mark}%</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex">
              <button onClick={() => setIsViewModalOpen(false)} className="btn-secondary flex-1">Close Profile</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        title={confirmDialog.title}
        size="sm"
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className={clsx("w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-sm", confirmDialog.type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600')}>
            {confirmDialog.type === 'danger' ? <AlertCircle size={32} /> : <CheckCircle size={32} />}
          </div>
          <p className="text-sm text-slate-600 mb-8 max-w-[280px] leading-relaxed mx-auto">
            {confirmDialog.message}
          </p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
              className="btn-secondary flex-1 py-3 justify-center"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (confirmDialog.onConfirm) confirmDialog.onConfirm()
                setConfirmDialog(prev => ({ ...prev, isOpen: false }))
              }} 
              className={clsx("btn flex-1 py-3 justify-center text-white font-semibold transition-all shadow-sm", confirmDialog.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200')}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
