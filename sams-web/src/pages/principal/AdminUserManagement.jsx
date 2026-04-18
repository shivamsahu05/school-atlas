import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Bell, BookOpen, AlertTriangle, CheckCircle, AlertCircle, Eye, Plus, Send, Trash2,
  Edit2, Save, XCircle, Download, Calendar, IndianRupee, MessageCircle, Clock, BarChart2,
  ChevronDown, GraduationCap, LayoutGrid, Users, RotateCcw, Search, ChevronRight,
  ChevronLeft, List, Zap, UserPlus
} from 'lucide-react'
import {
  StatCard, SectionHeader, Tabs, StatusBadge, ProgressBar,
  Modal, FilterChips, DataTable, FormInput, SelectDropdown
} from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { HOMEWORK, WEEKLY_HOMEWORK, SYLLABUS_ITEMS, WEEKLY_SYLLABUS, OBSERVATIONS as INIT_OBS, TEACHER_PERFORMANCE, OBS_CHART, LEAVES as INIT_LEAVES, ALL_TEACHERS as INIT_TEACHERS, STUDENTS as INIT_STUDENTS, WEEKLY_SCHEDULE, MARKS_OVERVIEW } from '../../data/dummyData'
import { ALL_CLASSES, DEPARTMENTS, SUBJECTS, PERFORMANCE_WEIGHTS, OBSERVATION_CRITERIA } from '../../data/constants'
import clsx from 'clsx'

export default function AdminUserManagement() {
  const [tab, setTab] = useState('teachers')
  const [teachers, setTeachers] = useState(INIT_TEACHERS)
  const [students, setStudents] = useState(INIT_STUDENTS)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', subject: '', classAssigned: '', rollNo: '', class: '' })

  const handleOpenAdd = () => {
    setEditUser(null)
    setForm({ name: '', email: '', subject: '', classAssigned: '', rollNo: '', class: '' })
    setModalOpen(true)
  }

  const handleOpenEdit = (user) => {
    setEditUser(user)
    setForm({ ...user })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name || !form.email) return
    if (tab === 'teachers') {
      if (editUser) {
        setTeachers(prev => prev.map(t => t.id === editUser.id ? { ...t, ...form } : t))
      } else {
        setTeachers(prev => [{ ...form, id: Date.now() }, ...prev])
      }
    } else {
      if (editUser) {
        setStudents(prev => prev.map(s => s.id === editUser.id ? { ...s, ...form } : s))
      } else {
        setStudents(prev => [{ ...form, id: Date.now() }, ...prev])
      }
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this user?')) {
      if (tab === 'teachers') setTeachers(prev => prev.filter(t => t.id !== id))
      else setStudents(prev => prev.filter(s => s.id !== id))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Total Teachers" value={teachers.length} icon={Eye} color="blue" />
        <StatCard title="Total Students" value={students.length} icon={Eye} color="green" />
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Tabs tabs={[{ value: 'teachers', label: `Teachers (${teachers.length})` }, { value: 'students', label: `Students (${students.length})` }]}
            active={tab} onChange={setTab} />
          <button onClick={handleOpenAdd} className="btn-primary btn btn-sm">
            <Plus size={14} /> Add User
          </button>
        </div>

        {tab === 'teachers' && (
          <div className="space-y-2">
            {teachers.map(t => (
              <div key={t.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-600 font-bold text-sm">{t.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.subject} · {t.classAssigned}</p>
                  <p className="text-xs text-brand-600">{t.email}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenEdit(t)}
                    className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'students' && (
          <DataTable
            columns={[
              { key: 'name', label: 'Name', sortable: true },
              { key: 'rollNo', label: 'Roll No.' },
              { key: 'class', label: 'Class', sortable: true },
              { key: 'email', label: 'Email' },
              {
                key: 'id', label: 'Actions', render: (id, row) => (
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenEdit(row)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors"><Trash2 size={13} /></button>
                  </div>
                )
              },
            ]}
            rows={students}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editUser ? 'Edit User' : 'Add New User'}>
        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter full name⚠¦" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Enter email⚠¦" />
          </div>
          {tab === 'teachers' ? (
            <>
              <div>
                <label className="label">Subject</label>
                <input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="label">Class Assigned</label>
                <input className="input" value={form.classAssigned} onChange={e => setForm(f => ({ ...f, classAssigned: e.target.value }))} placeholder="e.g. Grade 8-A" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Roll No.</label>
                <input className="input" value={form.rollNo} onChange={e => setForm(f => ({ ...f, rollNo: e.target.value }))} placeholder="e.g. 24" />
              </div>
              <div>
                <label className="label">Class</label>
                <input className="input" value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} placeholder="e.g. Grade 10-B" />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={handleSave} className="btn-primary btn flex-1 justify-center">
              {editUser ? 'Save Changes' : 'Add User'}
            </button>
            <button onClick={() => setModalOpen(false)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}