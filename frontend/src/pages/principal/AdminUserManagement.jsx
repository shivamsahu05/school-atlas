import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Loader2, AlertTriangle, Edit2, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge, Modal, Tabs } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { teachersApi, studentsApi, usersApi } from '../../api'

const TABS = [
  { value:'teachers', label:'Teachers' },
  { value:'students', label:'Students' },
  { value:'users',    label:'System Users' },
]

export default function AdminUserManagement() {
  const [tab,         setTab]         = useState('teachers')
  const [teachers,    setTeachers]    = useState([])
  const [students,    setStudents]    = useState([])
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [search,      setSearch]      = useState('')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [form,        setForm]        = useState({ name:'', email:'', phone:'', role:'teacher', password:'' })

  const fetchTab = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      if (tab === 'teachers') {
        const res = await teachersApi.getAll({ search: search || undefined })
        setTeachers(Array.isArray(res.data) ? res.data : (res.data?.items || res.items || []))
      } else if (tab === 'students') {
        const res = await studentsApi.getAll({ search: search || undefined })
        setStudents(Array.isArray(res.data) ? res.data : (res.data?.items || res.items || []))
      } else {
        const res = await usersApi.getAll({ search: search || undefined })
        setUsers(Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : (res?.data?.items || res?.items || []))
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [tab, search])

  useEffect(() => { fetchTab() }, [fetchTab])

  const handleSubmitUser = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      if (editTarget) {
        await usersApi.update(editTarget.id, { name: form.name, email: form.email, phone: form.phone })
      } else {
        await usersApi.create(form)
      }
      setModalOpen(false)
      setEditTarget(null)
      setForm({ name:'', email:'', phone:'', role:'teacher', password:'' })
      fetchTab()
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleTeacher = async (id) => {
    try {
      await teachersApi.toggleStatus(id)
      fetchTab()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status.')
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await usersApi.delete(id)
      fetchTab()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    }
  }

  const teacherCols = [
    { key:'name',          label:'Name',          sortable:true },
    { key:'email',         label:'Email',         sortable:true },
    { key:'mobile',        label:'Mobile',        sortable:false },
    { key:'subject',       label:'Subject',       sortable:true },
    { key:'experience',    label:'Experience',    sortable:false },
    { key:'status',        label:'Status',        sortable:true, render: v => <StatusBadge status={v||'active'}/> },
    { key:'actions',       label:'',              sortable:false,
      render: (_,r) => (
        <div className="flex gap-2">
          <button onClick={() => handleToggleTeacher(r.id)}
            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">
            Toggle
          </button>
        </div>
      )
    },
  ]

  const studentCols = [
    { key:'name',        label:'Name',   sortable:true },
    { key:'roll_no',     label:'Roll',   sortable:true },
    { key:'class',       label:'Class',  sortable:true, render:(_,r)=>`${r.class?.class_name||''}${r.class?.section?'-'+r.class.section:''}` },
    { key:'email',       label:'Email',  sortable:false },
    { key:'mobile',      label:'Mobile', sortable:false },
    { key:'gender',      label:'Gender', sortable:true },
    { key:'status',      label:'Status', sortable:true, render:v=><StatusBadge status={v}/> },
  ]

  const userCols = [
    { key:'name',       label:'Name',       sortable:true },
    { key:'email',      label:'Email',      sortable:true },
    { key:'role',       label:'Role',       sortable:true, render:v=><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v==='admin'?'bg-purple-100 text-purple-700':'bg-brand-100 text-brand-700'}`}>{v}</span> },
    { key:'phone',      label:'Phone',      sortable:false },
    { key:'status',     label:'Status',     sortable:true, render:v=><StatusBadge status={v}/> },
    { key:'actions',    label:'',           sortable:false,
      render:(_,r)=>(
        <div className="flex gap-2">
          <button onClick={()=>{ setEditTarget(r); setForm({name:r.name,email:r.email,phone:r.phone||'',role:r.role,password:''}); setModalOpen(true) }}
            className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600">
            <Edit2 size={12}/>
          </button>
          <button onClick={()=>handleDeleteUser(r.id)}
            className="text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600">
            <Trash2 size={12}/>
          </button>
        </div>
      )
    },
  ]

  const currentRows = tab==='teachers' ? teachers : tab==='students' ? students : users
  const currentCols = tab==='teachers' ? teacherCols : tab==='students' ? studentCols : userCols

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Teachers" value={teachers.length} icon={Users} color="blue"/>
        <StatCard title="Students" value={students.length} icon={Users} color="green"/>
        <StatCard title="Users"    value={users.length}    icon={Users} color="purple"/>
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <Tabs tabs={TABS} active={tab} onChange={t => { setTab(t); setSearch('') }}/>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
              <Search size={14} className="text-slate-400"/>
              <input
                className="text-sm outline-none w-40"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {tab === 'users' && (
              <button onClick={() => { setEditTarget(null); setModalOpen(true) }}
                className="btn-primary btn btn-sm">
                <Plus size={14}/> Add User
              </button>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-rose-500 mb-3">{error}</p>}

        {loading
          ? <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-brand-500"/></div>
          : <DataTable columns={currentCols} rows={currentRows} emptyMessage={`No ${tab} found.`}/>
        }
      </div>

      {/* Add/Edit User Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(null) }}
        title={editTarget ? 'Edit User' : 'Add System User'}>
        <form onSubmit={handleSubmitUser} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
          </div>
          {!editTarget && (
            <>
              <div>
                <label className="label">Role</label>
                <select className="select" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="label">Password *</label>
                <input className="input" type="password" value={form.password}
                  onChange={e=>setForm(f=>({...f,password:e.target.value}))} required={!editTarget}/>
              </div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary btn flex-1 justify-center disabled:opacity-60">
              {submitting?<Loader2 size={14} className="animate-spin mr-2"/>:null}
              {editTarget ? 'Save Changes' : 'Create User'}
            </button>
            <button type="button" onClick={()=>setModalOpen(false)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
