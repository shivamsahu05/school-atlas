import { useState, useEffect, useCallback } from 'react'
import { User, Phone, Mail, BookOpen, Shield, AlertTriangle, Save, Loader2, Edit2 } from 'lucide-react'
import { SectionHeader, StatusBadge } from '../../components/ui/index.jsx'
import { profileApi, dashboardApi } from '../../api'

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-50 last:border-0">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value || <span className="text-slate-300">—</span>}</span>
    </div>
  )
}

export default function TeacherProfile() {
  const [profile,     setProfile]     = useState(null)
  const [permissions, setPermissions] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [editing,     setEditing]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)
  const [form,        setForm]        = useState({ mobile:'', dob:'', qualification:'', experience:'' })

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [me, dash] = await Promise.all([
        profileApi.getMe(),
        dashboardApi.getTeacherDashboard().catch(() => ({ data: {} })),
      ])
      setProfile(me)
      setForm({
        mobile:        me.mobile        || '',
        dob:           me.dob           || '',
        qualification: me.qualification || '',
        experience:    me.experience    || '',
      })
      setPermissions(dash.data?.permissions   || [])
      setAssignments(dash.data?.assignments   || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await profileApi.update(form)
      setEditing(false)
      fetchProfile()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500"/></div>
  if (error)   return (
    <div className="card p-8 text-center">
      <AlertTriangle size={28} className="text-rose-500 mx-auto mb-3"/>
      <p className="text-slate-600">{error}</p>
      <button onClick={fetchProfile} className="btn-primary btn mt-4">Retry</button>
    </div>
  )

  const p = profile || {}

  const expiring = permissions.filter(pm => pm.daysLeft >= 0 && pm.daysLeft <= 14)
  const expired  = permissions.filter(pm => pm.daysLeft < 0)
  const active   = permissions.filter(pm => pm.daysLeft > 14)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Avatar card */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-2xl font-black text-white">{(p.name||'T')[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800">{p.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{p.subject || 'Teacher'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {assignments.map((a, i) => (
                <span key={i} className="text-[11px] font-semibold bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full">
                  {a.class_name}-{a.section} · {a.subject}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="btn-secondary btn btn-sm gap-1.5 flex-shrink-0"
          >
            <Edit2 size={13}/> {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Personal info — view or edit */}
      <div className="card p-6">
        <SectionHeader title="Personal Information" subtitle={editing ? 'Edit your details below' : 'Contact admin to change name / email / role'} />

        {editing ? (
          <form onSubmit={handleSave} className="mt-4 space-y-4 max-w-lg">
            <div>
              <label className="label">Mobile</label>
              <input className="input" placeholder="+91 XXXXX XXXXX" value={form.mobile}
                onChange={e => setForm(f=>({...f,mobile:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input className="input" type="date" value={form.dob}
                onChange={e => setForm(f=>({...f,dob:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Qualification</label>
              <input className="input" placeholder="e.g. M.Sc. Mathematics, B.Ed." value={form.qualification}
                onChange={e => setForm(f=>({...f,qualification:e.target.value}))}/>
            </div>
            <div>
              <label className="label">Experience</label>
              <input className="input" placeholder="e.g. 8 years" value={form.experience}
                onChange={e => setForm(f=>({...f,experience:e.target.value}))}/>
            </div>
            <button type="submit" disabled={saving} className="btn-primary btn gap-1.5 disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div className="mt-4">
            <InfoRow label="Name"          value={p.name}          />
            <InfoRow label="Email"         value={p.email}         />
            <InfoRow label="Phone"         value={p.phone}         />
            <InfoRow label="Mobile"        value={p.mobile}        />
            <InfoRow label="Date of Birth" value={p.dob}           />
            <InfoRow label="Qualification" value={p.qualification} />
            <InfoRow label="Experience"    value={p.experience}    />
            <InfoRow label="Role"          value={p.role}          />
          </div>
        )}
      </div>

      {/* Permissions */}
      <div className="card p-6">
        <SectionHeader
          title="My Permissions"
          subtitle={`${active.length} active · ${expiring.length} expiring · ${expired.length} expired`}
        />

        {expiring.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 my-4">
            <AlertTriangle size={15} className="text-amber-500"/>
            <span className="text-sm text-amber-700 font-medium">
              {expiring.length} permission{expiring.length>1?'s':''} expiring within 14 days — contact admin.
            </span>
          </div>
        )}

        {permissions.length === 0
          ? <p className="text-center text-sm text-slate-400 py-8">No permissions configured.</p>
          : (
            <div className="mt-4 space-y-2">
              {permissions.map(pm => {
                const isExpired  = pm.daysLeft < 0
                const isExpiring = pm.daysLeft >= 0 && pm.daysLeft <= 14
                return (
                  <div key={pm.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                      isExpired  ? 'bg-rose-50 border-rose-200' :
                      isExpiring ? 'bg-amber-50 border-amber-200' :
                                   'bg-white border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Shield size={15} className={isExpired?'text-rose-500':isExpiring?'text-amber-500':'text-emerald-500'}/>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{pm.action}</p>
                        <p className="text-xs text-slate-400">{pm.class} · {pm.subject}</p>
                        <p className="text-[10px] text-slate-300 mt-0.5">{pm.from} → {pm.to}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      {isExpired
                        ? <span className="text-[11px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">Expired</span>
                        : isExpiring
                        ? <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">{pm.daysLeft}d</span>
                        : <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  )
}
