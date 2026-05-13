import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, Save, X, Award, Users, BookOpen, BarChart2 } from 'lucide-react'
import {
  StatCard, SectionHeader, FilterChips, StatusBadge, Modal, ProgressBar, DataTable
} from '../../components/ui/index.jsx'

// ── Initial seed data ─────────────────────────────────────────────────────────
const SEED = [
  { id:1,  student:'Aarav Sharma',   class:'Grade 8-A', subject:'Mathematics',   week:'Week 1', attendance:95, homework:90, marks:88, exam:85, status:'Excellent' },
  { id:2,  student:'Ananya Patel',   class:'Grade 8-A', subject:'Mathematics',   week:'Week 1', attendance:90, homework:85, marks:80, exam:78, status:'Good'      },
  { id:3,  student:'Arjun Mehta',    class:'Grade 8-A', subject:'Mathematics',   week:'Week 1', attendance:80, homework:70, marks:65, exam:60, status:'Average'   },
  { id:4,  student:'Bhavya Singh',   class:'Grade 8-A', subject:'Science',       week:'Week 1', attendance:98, homework:95, marks:92, exam:90, status:'Excellent' },
  { id:5,  student:'Chetan Joshi',   class:'Grade 7-B', subject:'Science',       week:'Week 1', attendance:75, homework:65, marks:60, exam:55, status:'Poor'      },
  { id:6,  student:'Deepa Nair',     class:'Grade 7-B', subject:'English',       week:'Week 1', attendance:88, homework:82, marks:79, exam:76, status:'Good'      },
  { id:7,  student:'Eshan Kumar',    class:'Grade 9-A', subject:'English',       week:'Week 2', attendance:92, homework:88, marks:84, exam:82, status:'Good'      },
  { id:8,  student:'Farida Bano',    class:'Grade 9-A', subject:'Mathematics',   week:'Week 2', attendance:85, homework:78, marks:74, exam:70, status:'Average'   },
  { id:9,  student:'Gaurav Rao',     class:'Grade 6-C', subject:'Hindi',         week:'Week 2', attendance:70, homework:60, marks:55, exam:50, status:'Poor'      },
  { id:10, student:'Harini Reddy',   class:'Grade 6-C', subject:'Social Studies',week:'Week 2', attendance:96, homework:93, marks:90, exam:88, status:'Excellent' },
  { id:11, student:'Ishaan Verma',   class:'Grade 8-A', subject:'Mathematics',   week:'Week 3', attendance:83, homework:77, marks:72, exam:68, status:'Average'   },
  { id:12, student:'Jahnavi Tiwari', class:'Grade 10-A',subject:'Social Studies',week:'Week 3', attendance:91, homework:86, marks:83, exam:80, status:'Good'      },
]

const CLASSES   = ['All','Grade 6-C','Grade 7-B','Grade 8-A','Grade 9-A','Grade 10-A']
const SUBJECTS  = ['All','Mathematics','Science','English','Hindi','Social Studies']
const WEEKS     = ['All','Week 1','Week 2','Week 3']
const STATUSES  = ['Excellent','Good','Average','Poor']

const EMPTY_FORM = { student:'', class:'Grade 8-A', subject:'Mathematics', week:'Week 1', attendance:'', homework:'', marks:'', exam:'', status:'Good' }

function computeStatus(att, hw, marks, exam) {
  const avg = (Number(att) + Number(hw) + Number(marks) + Number(exam)) / 4
  if (avg >= 90) return 'Excellent'
  if (avg >= 75) return 'Good'
  if (avg >= 55) return 'Average'
  return 'Poor'
}

function avgOf(rows, key) {
  if (!rows.length) return 0
  return Math.round(rows.reduce((s, r) => s + Number(r[key]), 0) / rows.length)
}

export default function StudentPerformance() {
  const [data,       setData]       = useState(SEED)
  const [filterCls,  setFilterCls]  = useState('All')
  const [filterSub,  setFilterSub]  = useState('All')
  const [filterWeek, setFilterWeek] = useState('All')
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editRow,    setEditRow]    = useState(null)   // null = add, object = edit
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [nextId,     setNextId]     = useState(SEED.length + 1)

  // ── Filtered rows ────────────────────────────────────────────────────────
  const rows = useMemo(() => data.filter(r =>
    (filterCls  === 'All' || r.class   === filterCls)  &&
    (filterSub  === 'All' || r.subject === filterSub)  &&
    (filterWeek === 'All' || r.week    === filterWeek)
  ), [data, filterCls, filterSub, filterWeek])

  // ── Summary stats ─────────────────────────────────────────────────────────
  const excellent = rows.filter(r => r.status === 'Excellent').length
  const poor      = rows.filter(r => r.status === 'Poor').length
  const avgAtt    = avgOf(rows, 'attendance')
  const avgMarks  = avgOf(rows, 'marks')

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const openAdd = () => { setEditRow(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (row) => { setEditRow(row); setForm({ ...row }); setModalOpen(true) }

  const handleSave = () => {
    const status = computeStatus(form.attendance, form.homework, form.marks, form.exam)
    const entry  = { ...form, status, attendance:Number(form.attendance), homework:Number(form.homework), marks:Number(form.marks), exam:Number(form.exam) }
    if (editRow) {
      setData(prev => prev.map(r => r.id === editRow.id ? { ...entry, id: editRow.id } : r))
    } else {
      setData(prev => [...prev, { ...entry, id: nextId }])
      setNextId(n => n + 1)
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this performance entry?')) {
      setData(prev => prev.filter(r => r.id !== id))
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────────
  const COLUMNS = [
    { key:'student',    label:'Student',    sortable:true  },
    { key:'class',      label:'Class',      sortable:true  },
    { key:'subject',    label:'Subject',    sortable:true  },
    { key:'week',       label:'Week',       sortable:true  },
    { key:'attendance', label:'Attendance', sortable:true,
      render: v => (
        <div className="flex items-center gap-2 min-w-[80px]">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${v>=90?'bg-emerald-500':v>=75?'bg-amber-400':'bg-rose-500'}`} style={{width:`${v}%`}}/>
          </div>
          <span className="text-xs font-semibold text-slate-700 w-8 text-right">{v}%</span>
        </div>
      )
    },
    { key:'homework',   label:'Homework %', sortable:true,
      render: v => <span className={`text-xs font-semibold ${v>=80?'text-emerald-600':v>=60?'text-amber-600':'text-rose-600'}`}>{v}%</span>
    },
    { key:'marks',      label:'Marks %',    sortable:true,
      render: v => <span className={`text-xs font-semibold ${v>=80?'text-emerald-600':v>=60?'text-amber-600':'text-rose-600'}`}>{v}%</span>
    },
    { key:'exam',       label:'Exam %',     sortable:true,
      render: v => <span className={`text-xs font-semibold ${v>=80?'text-emerald-600':v>=60?'text-amber-600':'text-rose-600'}`}>{v}%</span>
    },
    { key:'status',     label:'Status',
      render: v => <StatusBadge status={v} />
    },
    { key:'id', label:'Actions',
      render: (v, row) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors">
            <Edit2 size={13}/>
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors">
            <Trash2 size={13}/>
          </button>
        </div>
      )
    },
  ]

  const INPUT = 'text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300 w-full'
  const LABEL = 'text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block'

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Records"   value={rows.length}    icon={Users}    color="blue" />
        <StatCard title="Excellent"        value={excellent}      icon={Award}    color="green" trend={rows.length ? Math.round(excellent/rows.length*100) : 0} />
        <StatCard title="Need Attention"   value={poor}           icon={BarChart2} color="red"  trend={rows.length ? Math.round(poor/rows.length*100) : 0} />
        <StatCard title="Avg Attendance"   value={`${avgAtt}%`}  icon={BookOpen} color="teal"  trend={avgAtt} />
      </div>

      {/* Filters */}
      <div className="card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader title="Student Performance" subtitle={`${rows.length} records`} />
          <button onClick={openAdd} className="btn btn-primary btn-sm">
            <Plus size={14}/> Add Entry
          </button>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Class</p>
            <FilterChips options={CLASSES} value={filterCls} onChange={setFilterCls} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</p>
            <FilterChips options={SUBJECTS} value={filterSub} onChange={setFilterSub} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Week</p>
            <FilterChips options={WEEKS} value={filterWeek} onChange={setFilterWeek} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-6">
        <DataTable columns={COLUMNS} rows={rows} emptyMessage="No performance records match the selected filters." />
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRow ? 'Edit Performance Entry' : 'Add Performance Entry'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={LABEL}>Student Name</label>
            <input className={INPUT} placeholder="Full name" value={form.student} onChange={e => setForm(f => ({...f, student: e.target.value}))} />
          </div>
          <div>
            <label className={LABEL}>Class</label>
            <select className={INPUT} value={form.class} onChange={e => setForm(f => ({...f, class: e.target.value}))}>
              {CLASSES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Subject</label>
            <select className={INPUT} value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))}>
              {SUBJECTS.filter(s => s !== 'All').map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Week</label>
            <select className={INPUT} value={form.week} onChange={e => setForm(f => ({...f, week: e.target.value}))}>
              {WEEKS.filter(w => w !== 'All').map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Attendance %</label>
            <input className={INPUT} type="number" min="0" max="100" placeholder="0–100" value={form.attendance} onChange={e => setForm(f => ({...f, attendance: e.target.value}))} />
          </div>
          <div>
            <label className={LABEL}>Homework %</label>
            <input className={INPUT} type="number" min="0" max="100" placeholder="0–100" value={form.homework} onChange={e => setForm(f => ({...f, homework: e.target.value}))} />
          </div>
          <div>
            <label className={LABEL}>Marks %</label>
            <input className={INPUT} type="number" min="0" max="100" placeholder="0–100" value={form.marks} onChange={e => setForm(f => ({...f, marks: e.target.value}))} />
          </div>
          <div>
            <label className={LABEL}>Exam %</label>
            <input className={INPUT} type="number" min="0" max="100" placeholder="0–100" value={form.exam} onChange={e => setForm(f => ({...f, exam: e.target.value}))} />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Status is auto-computed from the average of all four fields.</p>
        <div className="flex gap-3 mt-5">
          <button onClick={handleSave} className="btn btn-primary flex-1 justify-center">
            <Save size={14}/> {editRow ? 'Save Changes' : 'Add Entry'}
          </button>
          <button onClick={() => setModalOpen(false)} className="btn btn-secondary px-5">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
