// ─────────────────────────────────────────────────────────────────────────────
// Admin Follow-ups
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { Bell, BookOpen, AlertTriangle, CheckCircle, AlertCircle, Eye, Plus, Send, Trash2, Edit2, Save } from 'lucide-react'
import { StatCard, SectionHeader, Tabs, StatusBadge, ProgressBar, Modal, FilterChips } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { BarChartWidget, DonutChart } from '../../components/charts/index.jsx'
import { HOMEWORK, SYLLABUS_ITEMS, OBSERVATIONS, TEACHER_PERFORMANCE, OBS_CHART, LEAVES, ALL_TEACHERS, STUDENTS, WEEKLY_SCHEDULE, MARKS_OVERVIEW } from '../../data/dummyData'

/* ── FOLLOW-UPS ──────────────────────────────────────────────────────────── */
export function AdminFollowUps() {
  const [tab, setTab] = useState('homework')
  const pendingHW  = HOMEWORK.filter(h => (h.submitted/h.total)*100 < 80)
  const pendingSyl = SYLLABUS_ITEMS.filter(s => !s.completed).slice(0,4)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Low Submission HW" value={pendingHW.length}  icon={AlertTriangle} color="amber" />
        <StatCard title="Pending Topics"    value={pendingSyl.length} icon={BookOpen}      color="red"   />
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <SectionHeader title="Follow-up Items" />
          <Tabs tabs={[{value:'homework',label:`Homework (${pendingHW.length})`},{value:'syllabus',label:`Syllabus (${pendingSyl.length})`}]}
            active={tab} onChange={setTab} />
        </div>

        {tab === 'homework' && (
          <div className="space-y-3">
            {pendingHW.map(hw => {
              const p = Math.round((hw.submitted/hw.total)*100)
              return (
                <div key={hw.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{hw.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{hw.class} · Due: {hw.due}</p>
                    </div>
                    <span className={`badge ${p>=70?'badge-amber':'badge-red'}`}>{p}%</span>
                  </div>
                  <ProgressBar value={hw.submitted} max={hw.total} color={p>=70?'amber':'red'} height="h-1.5" />
                  {hw.defaulters.length > 0 && (
                    <p className="text-xs text-rose-500 mt-2">{hw.defaulters.length} defaulters pending</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'syllabus' && (
          <div className="space-y-3">
            {pendingSyl.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{item.topic}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.chapter} · {item.class} · Planned: {item.plannedDate}</p>
                </div>
                <StatusBadge status="Pending" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── CLASSROOM OBSERVATION ───────────────────────────────────────────────── */
export function AdminObservation() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ teacher:'', criteria: {} })
  const [saved, setSaved] = useState(false)

  const CRITERIA = ['Content Mastery','Pedagogy','Student Engagement','Communication','Assessment']

  const handleSave = () => { setSaved(true); setShowForm(false) }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div />
        <button onClick={() => { setShowForm(v=>!v); setSaved(false) }} className="btn-primary btn">
          {showForm ? <><Eye size={14}/> View Records</> : <><Plus size={14}/> New Observation</>}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          <CheckCircle size={18}/> Observation saved successfully!
        </div>
      )}

      {!showForm ? (
        <>
          <div className="card p-6">
            <SectionHeader title="Observation Scores" subtitle="All teachers comparison" />
            <BarChartWidget data={OBS_CHART} dataKey="score" xKey="name" color="#0d9488" height={200} name="Score %" />
          </div>

          <div className="card p-6">
            <SectionHeader title="Observation Records" />
            <div className="space-y-4">
              {OBSERVATIONS.map(obs => {
                const p = Math.round((obs.score/obs.max)*100)
                return (
                  <div key={obs.id} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{obs.teacher}</p>
                        <p className="text-xs text-slate-400">{obs.date} · {obs.observedBy}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${p>=80?'text-emerald-600':p>=60?'text-amber-600':'text-rose-600'}`}>{p}%</p>
                        <p className="text-xs text-slate-400">{obs.score}/{obs.max}</p>
                      </div>
                    </div>
                    <ProgressBar value={obs.score} max={obs.max} color={p>=80?'green':p>=60?'amber':'red'} height="h-2" />
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="card p-6 max-w-xl">
          <SectionHeader title="New Observation Form" subtitle="Score each criterion out of 10" />
          <div className="space-y-4">
            <div>
              <label className="label">Teacher</label>
              <select className="select" value={form.teacher} onChange={e=>setForm(f=>({...f,teacher:e.target.value}))}>
                <option value="">Select teacher…</option>
                {ALL_TEACHERS.map(t=><option key={t.id}>{t.name}</option>)}
              </select>
            </div>
            {CRITERIA.map(c => (
              <div key={c} className="flex items-center gap-4">
                <label className="text-sm text-slate-700 flex-1 font-medium">{c}</label>
                <input type="number" min="0" max="10" step="0.5"
                  placeholder="–"
                  value={form.criteria[c] ?? ''}
                  onChange={e=>setForm(f=>({...f,criteria:{...f.criteria,[c]:e.target.value}}))}
                  className="w-20 text-center input py-2" />
                <span className="text-xs text-slate-400 w-5">/10</span>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="btn-primary btn flex-1 justify-center">
                <Save size={14}/> Save Observation
              </button>
              <button onClick={()=>setShowForm(false)} className="btn-secondary btn px-4">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── TEACHER PERFORMANCE ─────────────────────────────────────────────────── */
export function AdminTeacherPerformance() {
  const sorted = [...TEACHER_PERFORMANCE].sort((a,b) => b.overall - a.overall)

  const chartData = sorted.map(p => ({
    name: p.teacher.name.split(' ')[0],
    Overall: Math.round(p.overall),
    Syllabus: p.syllabus,
    LO: p.lo,
    Observation: p.observation,
  }))

  const WEIGHTS = [
    { label:'Syllabus Completion',    key:'syllabus',    w:'15%', color:'bg-brand-500'    },
    { label:'LO Achievement',         key:'lo',          w:'20%', color:'bg-emerald-500'  },
    { label:'Classroom Observation',  key:'observation', w:'30%', color:'bg-teal-500'     },
    { label:'Other Contributions',    key:'other',       w:'20%', color:'bg-amber-500'    },
    { label:'Language Contribution',  key:'language',    w:'15%', color:'bg-purple-500'   },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Weights legend */}
      <div className="card p-6">
        <SectionHeader title="Scoring Weights" subtitle="How the overall score is calculated" />
        <div className="grid sm:grid-cols-5 gap-3">
          {WEIGHTS.map(w => (
            <div key={w.key} className="text-center p-3 rounded-xl bg-slate-50">
              <div className={`w-2 h-2 rounded-full ${w.color} mx-auto mb-2`} />
              <p className="text-lg font-bold text-slate-800">{w.w}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{w.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="card p-6">
        <SectionHeader title="Overall Performance Scores" />
        <BarChartWidget data={sorted.map(p=>({name:p.teacher.name.split(' ')[0],pct:Math.round(p.overall)}))}
          dataKey="pct" xKey="name" color="#1a56db" height={200} name="Overall %" />
      </div>

      {/* Individual cards */}
      <div className="space-y-4">
        {sorted.map((p, i) => (
          <div key={p.teacher.id} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold
                  ${i===0?'bg-amber-100 text-amber-700':i===1?'bg-slate-200 text-slate-600':'bg-slate-100 text-slate-500'}`}>
                  #{i+1}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{p.teacher.name}</p>
                  <p className="text-xs text-slate-400">{p.teacher.subject}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${p.overall>=85?'text-emerald-600':p.overall>=70?'text-amber-600':'text-rose-600'}`}>
                  {p.overall.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400">Overall</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {WEIGHTS.map(w => (
                <div key={w.key} className="text-center">
                  <div className="h-16 bg-slate-100 rounded-lg overflow-hidden flex items-end mb-1">
                    <div className={`w-full ${w.color} rounded-lg`}
                      style={{ height: `${p[w.key]}%` }} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">{p[w.key]}</p>
                  <p className="text-[10px] text-slate-400">{w.w}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── USER MANAGEMENT ─────────────────────────────────────────────────────── */
export function AdminUserManagement() {
  const [tab, setTab] = useState('teachers')
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Teachers" value={ALL_TEACHERS.length} icon={Eye}  color="blue" />
        <StatCard title="Total Students" value={STUDENTS.length}     icon={Eye}  color="green" />
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Tabs tabs={[{value:'teachers',label:`Teachers (${ALL_TEACHERS.length})`},{value:'students',label:`Students (${STUDENTS.length})`}]}
            active={tab} onChange={setTab} />
          <button onClick={() => { setEditUser(null); setModalOpen(true) }} className="btn-primary btn btn-sm">
            <Plus size={14}/> Add User
          </button>
        </div>

        {tab === 'teachers' && (
          <div className="space-y-2">
            {ALL_TEACHERS.map(t => (
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
                  <button onClick={() => { setEditUser(t); setModalOpen(true) }}
                    className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors">
                    <Edit2 size={15}/>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'students' && (
          <DataTable
            columns={[
              { key:'name',   label:'Name',    sortable:true },
              { key:'rollNo', label:'Roll No.'               },
              { key:'class',  label:'Class',   sortable:true },
              { key:'email',  label:'Email'                  },
              { key:'id',     label:'Actions', render:()=>(
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors"><Edit2 size={13}/></button>
                  <button className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 transition-colors"><Trash2 size={13}/></button>
                </div>
              )},
            ]}
            rows={STUDENTS}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editUser ? 'Edit User' : 'Add New User'}>
        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" defaultValue={editUser?.name} placeholder="Enter full name…" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" defaultValue={editUser?.email} placeholder="Enter email…" />
          </div>
          {tab === 'teachers' && (
            <>
              <div>
                <label className="label">Subject</label>
                <input className="input" defaultValue={editUser?.subject} placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="label">Class Assigned</label>
                <input className="input" defaultValue={editUser?.classAssigned} placeholder="e.g. Grade 8-A" />
              </div>
            </>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalOpen(false)} className="btn-primary btn flex-1 justify-center">
              {editUser ? 'Save Changes' : 'Add User'}
            </button>
            <button onClick={() => setModalOpen(false)} className="btn-secondary btn px-4">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* ── TIMETABLE & MARKS ───────────────────────────────────────────────────── */
export function AdminTimetable() {
  const [activeDay, setActiveDay] = useState('Monday')
  const dayData = WEEKLY_SCHEDULE.find(d => d.day === activeDay)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Day tabs */}
      <div className="card p-1.5 flex gap-1">
        {WEEKLY_SCHEDULE.map(d => (
          <button key={d.day}
            onClick={() => setActiveDay(d.day)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              d.day === activeDay ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {d.day.slice(0,3)}
          </button>
        ))}
      </div>

      {/* Timetable */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="section-title">{activeDay} Schedule</h2>
          <p className="section-sub">School-wide timetable overview</p>
        </div>
        <DataTable
          columns={[
            { key:'no',      label:'Period' },
            { key:'time',    label:'Time'   },
            { key:'subject', label:'Subject'},
            { key:'class',   label:'Class'  },
            { key:'status',  label:'Status', render:(v) => <StatusBadge status={v} /> },
          ]}
          rows={dayData?.periods ?? []}
        />
      </div>

      {/* Marks overview */}
      <div className="card p-6">
        <SectionHeader title="Marks Overview" subtitle="Class-wise exam performance" />
        <DataTable
          columns={[
            { key:'class',   label:'Class',   sortable:true },
            { key:'subject', label:'Subject'               },
            { key:'exam',    label:'Exam'                  },
            { key:'avg',     label:'Avg Marks', sortable:true,
              render:(v,row) => (
                <span className={`font-bold ${row.pct>=80?'text-emerald-600':row.pct>=70?'text-amber-600':'text-rose-600'}`}>{v}</span>
              )
            },
          ]}
          rows={MARKS_OVERVIEW}
        />
      </div>
    </div>
  )
}

/* ── LEAVE APPROVAL ──────────────────────────────────────────────────────── */
export function AdminLeave() {
  const [leaves, setLeaves] = useState(LEAVES)
  const [filter, setFilter] = useState('Pending')

  const filtered = filter === 'All' ? leaves : leaves.filter(l => l.status === filter)

  const updateStatus = (id, status) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Pending"  value={leaves.filter(l=>l.status==='Pending').length}  icon={AlertTriangle} color="amber" />
        <StatCard title="Approved" value={leaves.filter(l=>l.status==='Approved').length} icon={CheckCircle}   color="green" />
        <StatCard title="Rejected" value={leaves.filter(l=>l.status==='Rejected').length} icon={AlertCircle}   color="red"   />
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <SectionHeader title="Leave Requests" subtitle={`${filtered.length} records`} />
          <FilterChips options={['All','Pending','Approved','Rejected']} value={filter} onChange={setFilter} />
        </div>

        <div className="space-y-3">
          {filtered.map(leave => (
            <div key={leave.id} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{leave.teacher}</p>
                    <span className="badge-gray badge">{leave.type} Leave</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{leave.from} – {leave.to} · Applied: {leave.applied}</p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-md">{leave.reason}</p>
                </div>
                <StatusBadge status={leave.status} />
              </div>

              {leave.status === 'Pending' && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => updateStatus(leave.id, 'Approved')}
                    className="btn-success btn btn-sm flex-1 justify-center"
                  >
                    <CheckCircle size={13}/> Approve
                  </button>
                  <button
                    onClick={() => updateStatus(leave.id, 'Rejected')}
                    className="btn-danger btn btn-sm flex-1 justify-center"
                  >
                    <AlertCircle size={13}/> Reject
                  </button>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">No {filter.toLowerCase()} leave requests.</div>
          )}
        </div>
      </div>
    </div>
  )
}
