import { useState, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, Shield, Ban, CheckCircle, Eye,
  Mail, Phone, GraduationCap, Briefcase, IndianRupee,
  Clock, Edit2, Trash2, Calendar, Search, Filter, Save, Download, Star, TrendingUp, Lock, FileUp, Loader2, AlertTriangle, X
} from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge, Modal } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { teachersApi } from '../../api'

export default function AdminTeachers() {
  const [teachers,     setTeachers]     = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [search,       setSearch]       = useState('')
  const [addModal,     setAddModal]     = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [viewTarget,   setViewTarget]   = useState(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [form, setForm] = useState({
    name:'', email:'', password:'', phone:'', mobile:'',
    dob:'', qualification:'', experience:'', salary:'', subject:''
  })

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
      experience: t.experience || '', salary: t.salary || '', subject: t.subject || ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
      }
      setForm({ name:'', email:'', password:'', phone:'', mobile:'', dob:'', qualification:'', experience:'', salary:'', subject:'' })
      fetchTeachers()
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

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

  const active   = teachers.filter(t => t.status === 'active').length
  const blocked  = teachers.filter(t => t.status === 'blocked').length

  const columns = [
    { key:'name',          label:'Name',          sortable:true },
    { key:'email',         label:'Email',         sortable:true },
    { key:'mobile',        label:'Mobile',        sortable:false },
    { key:'subject',       label:'Subject',       sortable:true },
    { key:'qualification', label:'Qualification', sortable:false },
    { key:'experience',    label:'Experience',    sortable:false },
    { key:'status',        label:'Status',        sortable:true, render: v => <StatusBadge status={v || 'active'}/> },
    { key:'_actions',      label:'',              sortable:false,
      render: (_, r) => (
        <div className="flex gap-1.5">
          <button onClick={() => setViewTarget(r)}
            className="p-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100">
            <Eye size={13}/>
          </button>
          <button onClick={() => openEdit(r)}
            className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100">
            <Edit2 size={13}/>
          </button>
          <button onClick={() => handleToggle(r)}
            className={`p-1.5 rounded-lg ${r.status==='active'
              ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
            {r.status === 'active' ? <Ban size={13}/> : <CheckCircle size={13}/>}
          </button>
          <button onClick={() => handleDelete(r.id)}
            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100">
            <Trash2 size={13}/>
          </button>
        </div>
      )
    },
  ]

  const renderFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Full Name *</label>
          <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
        <div><label className="label">Email *</label>
          <input className="input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Password {editTarget?'(leave blank to keep)':' *'}</label>
          <input className="input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required={!editTarget}/></div>
        <div><label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Mobile</label>
          <input className="input" value={form.mobile} onChange={e=>setForm(f=>({...f,mobile:e.target.value}))}/></div>
        <div><label className="label">Date of Birth</label>
          <input className="input" type="date" value={form.dob} onChange={e=>setForm(f=>({...f,dob:e.target.value}))}/></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Subject</label>
          <input className="input" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="e.g. Mathematics"/></div>
        <div><label className="label">Experience</label>
          <input className="input" value={form.experience} onChange={e=>setForm(f=>({...f,experience:e.target.value}))} placeholder="e.g. 5 years"/></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Qualification</label>
          <input className="input" value={form.qualification} onChange={e=>setForm(f=>({...f,qualification:e.target.value}))} placeholder="e.g. M.Sc, B.Ed"/></div>
        <div><label className="label">Salary</label>
          <input className="input" value={form.salary} onChange={e=>setForm(f=>({...f,salary:e.target.value}))} placeholder="e.g. 45000"/></div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Staff" value={teachers.length} icon={Users}        color="blue"  />
        <StatCard title="Active"      value={active}          icon={CheckCircle}  color="green" />
        <StatCard title="Blocked"     value={blocked}         icon={Ban}          color="red"   />
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <SectionHeader title="Teacher Directory" subtitle={`${teachers.length} staff members`}/>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
              <Search size={14} className="text-slate-400"/>
              <input className="text-sm outline-none w-36" placeholder="Search…"
                value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <button onClick={() => teachersApi.exportExcel().then(r => {
              const url = URL.createObjectURL(r.data)
              Object.assign(document.createElement('a'), {href:url, download:'teachers.xlsx'}).click()
            }).catch(() => alert('Export failed.'))}
              className="btn-secondary btn btn-sm gap-1.5">
              <Download size={13}/> Export
            </button>
            <button onClick={() => { setEditTarget(null); setAddModal(true) }} className="btn-primary btn btn-sm gap-1.5">
              <UserPlus size={14}/> Add Teacher
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-rose-500 mb-3">{error}</p>}
        {loading
          ? <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin text-brand-500"/></div>
          : <DataTable columns={columns} rows={teachers} emptyMessage="No teachers found."/>
        }
      </div>

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Teacher" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary btn flex-1 justify-center disabled:opacity-60">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2"/> : null} Create Teacher
            </button>
            <button type="button" onClick={() => setAddModal(false)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Teacher" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary btn flex-1 justify-center disabled:opacity-60">
              {submitting ? <Loader2 size={14} className="animate-spin mr-2"/> : null} Save Changes
            </button>
            <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title="Teacher Details">
        {viewTarget && (
          <div className="space-y-3">
            {[
              ['Name',          viewTarget.name],
              ['Email',         viewTarget.email],
              ['Phone',         viewTarget.phone || '—'],
              ['Mobile',        viewTarget.mobile || '—'],
              ['Subject',       viewTarget.subject || '—'],
              ['Qualification', viewTarget.qualification || '—'],
              ['Experience',    viewTarget.experience || '—'],
              ['Salary',        viewTarget.salary ? `₹${viewTarget.salary}` : '—'],
              ['Date of Birth', viewTarget.dob || '—'],
              ['Status',        viewTarget.status || 'active'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-4 py-2 border-b border-slate-50">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-32 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-slate-800">{value}</span>
              </div>
            ))}
            <div className="flex gap-3 pt-4">
              <button onClick={() => { setViewTarget(null); openEdit(viewTarget) }}
                className="btn-secondary btn gap-1.5"><Edit2 size={14}/> Edit</button>
              <button onClick={() => setViewTarget(null)} className="btn-primary btn flex-1 justify-center">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
