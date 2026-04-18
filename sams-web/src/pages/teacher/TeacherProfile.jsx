import { User, Phone, Mail, BookOpen, Calendar, Shield, AlertTriangle, Award } from 'lucide-react'
import { SectionHeader, StatusBadge } from '../../components/ui/index.jsx'
import { TEACHER_PROFILE, PERMISSIONS, TEACHER_PERFORMANCE, ALL_TEACHERS } from '../../data/dummyData'

// Reuse InfoRow pattern from existing codebase
function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-slate-50 last:border-0">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 font-medium">{value}</span>
    </div>
  )
}

export default function TeacherProfile() {
  const p    = TEACHER_PROFILE
  const perf = TEACHER_PERFORMANCE.find(t => t.teacher.id === p.id)
  const list = PERMISSIONS ?? []
  const active   = list.filter(pm => (pm?.daysLeft ?? 0) > 0)
  const expiring = list.filter(pm => (pm?.daysLeft ?? 0) > 0 && (pm?.daysLeft ?? 0) <= 14)
  const expired  = list.filter(pm => (pm?.daysLeft ?? 0) <= 0)

  const METRICS = [
    { label:'Syllabus',    value:perf?.syllabus ?? 0,    color:'brand'   },
    { label:'LO Score',    value:perf?.lo ?? 0,          color:'emerald' },
    { label:'Observation', value:perf?.observation ?? 0, color:'teal'    },
    { label:'Overall',     value:perf?.overall?.toFixed(1) ?? 0, color:'amber' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Profile Card ─────────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-2xl font-bold text-white">{(p?.name ?? '?')[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800">{p?.name ?? 'Teacher'}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{p?.department ?? 'Department'} Teacher</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {(p?.classes ?? []).map(c => (
                <span key={c} className="text-[11px] font-semibold bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full">{c}</span>
              ))}
              {(p?.subjects ?? []).map(s => (
                <span key={s} className="text-[11px] font-semibold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
          <div className="hidden sm:block text-right flex-shrink-0">
            <p className="text-xs text-slate-400">Employee Code</p>
            <p className="text-sm font-bold text-slate-700 mt-0.5">{p?.employeeCode ?? '-'}</p>
          </div>
        </div>
      </div>

      {/* ── Personal Details ─────────────────────────────────────────────── */}
      <div className="card p-6">
        <SectionHeader title="Personal Information" subtitle="View-only — contact admin to update" />
        <div className="mt-4">
          <InfoRow label="Full Name"     value={p?.name ?? '-'} />
          <InfoRow label="Employee ID"   value={p?.id ?? '-'} />
          <InfoRow label="Mobile"        value={p?.mobile ?? '-'} />
          <InfoRow label="Email"         value={p?.email ?? '-'} />
          <InfoRow label="Department"    value={p?.department ?? '-'} />
          <InfoRow label="Qualification" value={p?.qualification ?? '-'} />
          <InfoRow label="Experience"    value={p?.experience ?? '-'} />
          <InfoRow label="Joined On"     value={p?.joinDate ?? '-'} />
        </div>
      </div>

      {/* ── Performance Snapshot ─────────────────────────────────────────── */}
      {perf && (
        <div className="card p-6">
          <SectionHeader title="Performance Snapshot" subtitle="Current academic year" />
          <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {METRICS.map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-4 bg-${color}-50 border border-${color}-100 text-center`}>
                <p className={`text-2xl font-bold text-${color}-600`}>{value}%</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
                {/* mini bar */}
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full bg-${color}-500`}
                    style={{ width: `${Math.min(parseFloat(value), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Permissions ──────────────────────────────────────────────────── */}
      <div className="card p-6">
        <SectionHeader
          title="My Permissions"
          subtitle={`${active.length} active · ${expiring.length} expiring soon · ${expired.length} expired`}
        />

        {expiring.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 my-4">
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
            <span className="text-sm text-amber-700 font-medium">
              {expiring.length} permission{expiring.length > 1 ? 's' : ''} expiring within 14 days — contact admin to renew.
            </span>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {list.map(pm => {
            const isExpired  = (pm?.daysLeft ?? 0) <= 0
            const isExpiring = (pm?.daysLeft ?? 0) > 0 && (pm?.daysLeft ?? 0) <= 14
            return (
              <div
                key={pm?.id || Math.random()}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  isExpired  ? 'bg-rose-50 border-rose-200' :
                  isExpiring ? 'bg-amber-50 border-amber-200' :
                               'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield size={15} className={isExpired ? 'text-rose-500' : isExpiring ? 'text-amber-500' : 'text-emerald-500'} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{pm?.action ?? 'Access'}</p>
                    <p className="text-xs text-slate-400">{pm?.class ?? '-'} · {pm?.subject ?? '-'}</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">{pm?.from ?? '-'} → {pm?.to ?? '-'}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  {isExpired
                    ? <span className="text-[11px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">Expired</span>
                    : isExpiring
                    ? <span className="text-[11px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">{pm?.daysLeft}d left</span>
                    : <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
