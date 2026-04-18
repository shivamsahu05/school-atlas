import { useEffect, useState, useMemo } from 'react'
import { AlertTriangle, Users, Calendar, Download, ChevronDown, ChevronUp, UserX, Plus, Award, CheckCircle } from 'lucide-react'
import { StatCard, SectionHeader, FilterChips, DataTable, Modal, FormInput, SelectDropdown } from '../../components/ui/index.jsx'
import { ProgressBar } from '../../components/ui/index.jsx'
import { STUDENTS, OBSERVATIONS } from '../../data/dummyData'
import { teacherLoApi, classesApi, subjectApi } from '../../services/schoolApi'
import clsx from 'clsx'

const WEEKLY_ASSIGNMENTS = [
  {
    id: 'W1',
    week: 'Week 1 (1–7)',
    month: 'April',
    assignment: 'Exercise 3.1 – Q1 to Q10',
    subject: 'Mathematics',
    class: 'Grade 8-A',
    dueDate: '2024-04-07',
    totalStudents: 12,
    defaulters: ['S03', 'S06', 'S09', 'S12'],
  },
  {
    id: 'W2',
    week: 'Week 2 (8–14)',
    month: 'April',
    assignment: 'Chapter 4 Practice Problems',
    subject: 'Mathematics',
    class: 'Grade 8-A',
    dueDate: '2024-04-14',
    totalStudents: 12,
    defaulters: ['S03', 'S06'],
  },
  {
    id: 'W3',
    week: 'Week 3 (15–21)',
    month: 'April',
    assignment: 'Triangle Worksheet',
    subject: 'Mathematics',
    class: 'Grade 8-A',
    dueDate: '2024-04-21',
    totalStudents: 12,
    defaulters: ['S03', 'S06', 'S09', 'S05', 'S08', 'S11', 'S01'],
  },
  {
    id: 'W4',
    week: 'Week 4 (22–28)',
    month: 'April',
    assignment: 'Review & Practice Set',
    subject: 'Mathematics',
    class: 'Grade 8-A',
    dueDate: '2024-04-28',
    totalStudents: 12,
    defaulters: [],
  },
  {
    id: 'W5',
    week: 'Week 1 (1–7)',
    month: 'May',
    assignment: 'Number System Exercises',
    subject: 'Mathematics',
    class: 'Grade 8-A',
    dueDate: '2024-05-07',
    totalStudents: 12,
    defaulters: ['S03', 'S09', 'S12'],
  },
  {
    id: 'W6',
    week: 'Week 2 (8–14)',
    month: 'May',
    assignment: 'Fractions & Decimals HW',
    subject: 'Mathematics',
    class: 'Grade 8-A',
    dueDate: '2024-05-14',
    totalStudents: 12,
    defaulters: ['S06', 'S09'],
  },
  {
    id: 'W7',
    week: 'Week 3 (15–21)',
    month: 'May',
    assignment: 'Algebraic Expressions Set',
    subject: 'Mathematics',
    class: 'Grade 8-A',
    dueDate: '2024-05-21',
    totalStudents: 12,
    defaulters: ['S03', 'S06', 'S09', 'S05'],
  },
]

function downloadCSV(data) {
  const header = 'Week,Month,Assignment,Due Date,Defaulter Name,Roll No,Mobile'
  const rows = []
  data.forEach(w => {
    w.defaulters.forEach(sid => {
      const s = STUDENTS.find(st => st.id === sid)
      rows.push(`"${w.week}","${w.month}","${w.assignment}","${w.dueDate}","${s?.name || '-'}","${s?.rollNo || '-'}","${s?.mobile || '-'}"`)
    })
  })
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'weekly-defaulters.csv' })
  a.click()
}

export default function TeacherLO() {
  const [expandedWeek, setExpandedWeek] = useState(null)
  const [filterMonth, setFilterMonth] = useState('All')
  const [filterClass, setFilterClass] = useState('8')
  const [filterSection, setFilterSection] = useState('A')
  const [filterSubject, setFilterSubject] = useState('Mathematics')

  const BASE_CLASSES = ['8', '9', '10']
  const SECTIONS_MAP = { '8': ['A', 'B', 'C'], '9': ['A', 'B'], '10': ['A'] }
  const SUBJECTS = ['Mathematics', 'Science', 'Computer']
  const SELECT = 'text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300'

  const months = ['All', ...new Set(WEEKLY_ASSIGNMENTS.map(w => w.month))]

  const filtered = useMemo(() => {
    if (filterMonth === 'All') return WEEKLY_ASSIGNMENTS
    return WEEKLY_ASSIGNMENTS.filter(w => w.month === filterMonth)
  }, [filterMonth])

  const [loEntries, setLoEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [classesList, setClassesList] = useState([])
  const [subjectsList, setSubjectsList] = useState([])
  
  const [form, setForm] = useState({
    class_id: '', subject_id: '', month: 'April', week: 'Week 1 (1–7)', topic: '', score: '', status: 'Meeting', remarks: ''
  })

  useEffect(() => {
    fetchData()
    loadFilters()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await teacherLoApi.get()
      setLoEntries(res.data.items || [])
    } catch (err) {
      console.error('Failed to fetch LO entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFilters = async () => {
    try {
      const [cRes, sRes] = await Promise.all([classesApi.getAll(), classesApi.getSubjects()])
      setClassesList(cRes.data.items || [])
      setSubjectsList(sRes.data.items || [])
    } catch (err) {
      console.error('Failed to load filters:', err)
    }
  }

  const handleSubmit = async () => {
    if (!form.class_id || !form.subject_id || !form.topic || !form.score) return
    try {
      await teacherLoApi.submitSelf(form)
      setShowModal(false)
      fetchData()
    } catch (err) {
      alert('Failed to submit assessment')
    }
  }

  const teacherLO = useMemo(() => {
    if (loEntries.length === 0) return { score: 0, pScore: 0, max: 100, count: 0 }
    const tSum = loEntries.reduce((a, b) => a + Number(b.teacher_score || 0), 0)
    const pSum = loEntries.reduce((a, b) => a + Number(b.principal_score || 0), 0)
    const pCount = loEntries.filter(e => e.principal_score != null).length
    
    return {
      score: Math.round(tSum / loEntries.length),
      pScore: pCount > 0 ? Math.round(pSum / pCount) : 0,
      max: 100,
      count: loEntries.length,
      pCount
    }
  }, [loEntries])
  const filteredKPI = useMemo(() => {
    const totalDefaulters = filtered.reduce((a, w) => a + w.defaulters.length, 0)
    const totalAssignments = filtered.length
    const perfectWeeks = filtered.filter(w => w.defaulters.length === 0).length
    const worstWeek = filtered.reduce((worst, w) => w.defaulters.length > (worst?.defaulters?.length || 0) ? w : worst, null)
    return { totalDefaulters, totalAssignments, perfectWeeks, worstWeek }
  }, [filtered])

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Teacher LO Score Comparison */}
      <div className="card p-6 overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <SectionHeader title="Learning Outcome Analytics" subtitle="Comparison of Self-Assessment vs Principal's Award" />
          <button onClick={() => setShowModal(true)} className="btn-primary btn btn-sm gap-2">
            <Plus size={16} /> Record Self Assessment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          {/* Vertical Divider */}
          <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-slate-100" />

          {/* Teacher's Self Assessment */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className={clsx(
                "w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 shadow-sm transition-all",
                teacherLO.score >= 80 ? "border-emerald-400 bg-emerald-50" :
                teacherLO.score >= 60 ? "border-brand-400 bg-brand-50" :
                "border-rose-400 bg-rose-50"
              )}>
                <span className="text-2xl font-black text-slate-800">{teacherLO.score}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Self</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">My Assessment</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-700 mb-1">Teacher's View</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">Your self-recorded performance metrics across classes.</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-bold rounded-md">
                  {teacherLO.count} ENTRIES
                </span>
              </div>
            </div>
          </div>

          {/* Principal's Award */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className={clsx(
                "w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 shadow-sm transition-all",
                teacherLO.pScore >= 80 ? "border-emerald-400 bg-emerald-50" :
                teacherLO.pScore >= 60 ? "border-amber-400 bg-amber-50" :
                "border-slate-200 bg-slate-50"
              )}>
                <span className="text-2xl font-black text-slate-800">{teacherLO.pScore || '--'}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Admin</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin's Award</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-700 mb-1">Principal's View</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">Official learning outcome scores as awarded by the administration.</p>
              <div className="flex items-center gap-2">
                <span className={clsx(
                  "px-2 py-0.5 text-[10px] font-bold rounded-md",
                  teacherLO.pCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                )}>
                  {teacherLO.pCount > 0 ? `${teacherLO.pCount} REVIEWED` : 'AWAITING REVIEW'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class / Section / Subject Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-slate-500">Viewing:</span>
        <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterSection(SECTIONS_MAP[e.target.value]?.[0] || 'A') }} className={SELECT}>
          {BASE_CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className={SELECT}>
          {(SECTIONS_MAP[filterClass] || []).map(s => <option key={s} value={s}>Section {s}</option>)}
        </select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className={SELECT}>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Weeks" value={filteredKPI.totalAssignments} icon={Calendar} color="blue" />
        <StatCard title="Total Defaulters" value={filteredKPI.totalDefaulters} icon={UserX} color="amber" />
        <StatCard title="Perfect Weeks" value={filteredKPI.perfectWeeks} icon={Users} color="green" />
        <StatCard title="Most Defaults" value={filteredKPI.worstWeek?.defaulters?.length || 0} icon={AlertTriangle} color="red"
          subtitle={filteredKPI.worstWeek ? filteredKPI.worstWeek.week : '-'} />
      </div>

      {/* Weekly Defaulter List */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <SectionHeader
            title="Weekly Assignment Defaulters"
            subtitle="Students who did not submit their assignments"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <FilterChips
              options={months}
              value={filterMonth}
              onChange={setFilterMonth}
            />
            <button onClick={() => downloadCSV(filtered)} className="btn-secondary btn btn-sm gap-1.5">
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No assignments found for the selected filter.</p>
          ) : filtered.map(w => {
            const isOpen = expandedWeek === w.id
            const defaulterCount = w.defaulters.length
            const submissionPct = Math.round(((w.totalStudents - defaulterCount) / w.totalStudents) * 100)
            const barColor = submissionPct >= 90 ? 'bg-emerald-500' : submissionPct >= 70 ? 'bg-amber-500' : 'bg-rose-500'
            const textColor = submissionPct >= 90 ? 'text-emerald-600' : submissionPct >= 70 ? 'text-amber-600' : 'text-rose-600'

            return (
              <div key={w.id} className="border border-slate-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedWeek(isOpen ? null : w.id)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    defaulterCount === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  )}>
                    {defaulterCount === 0 ? <Users size={18} /> : <UserX size={18} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-slate-800 text-sm">{w.month} · {w.week}</p>
                      {defaulterCount === 0 && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">ALL SUBMITTED ✓</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{w.assignment}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Due: {w.dueDate} · {w.subject} · {w.class}</p>

                    {/* Progress bar */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={clsx("h-full rounded-full transition-all", barColor)} style={{ width: `${submissionPct}%` }} />
                      </div>
                      <span className={clsx("text-xs font-bold", textColor)}>{submissionPct}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {defaulterCount > 0 && (
                      <span className="px-2 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg">
                        {defaulterCount} missing
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>

                {/* Expanded: defaulter details */}
                {isOpen && defaulterCount > 0 && (
                  <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="pt-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Students who did not submit ({defaulterCount})
                      </p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {w.defaulters.map(sid => {
                          const student = STUDENTS.find(s => s.id === sid)
                          return (
                            <div key={sid} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-rose-100">
                              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {student?.name?.[0] || '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{student?.name || 'Unknown'}</p>
                                <p className="text-[10px] text-slate-400">Roll: {student?.rollNo || '-'} · {student?.mobile || '-'}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {isOpen && defaulterCount === 0 && (
                  <div className="px-4 pb-4 border-t border-slate-100 bg-emerald-50/30">
                    <p className="pt-3 text-sm text-emerald-600 font-medium text-center">
                      🎉 All students submitted this assignment on time!
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Frequent Defaulters Table */}
      <FrequentDefaulters data={filtered} />

      {/* Classroom Observations (from Principal) */}
      <ClassroomObservations />

      {/* Record Self Assessment Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Self Assessment" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectDropdown
              label="Class"
              options={classesList.map(c => ({ value: c.id, label: `${c.class_name}-${c.section}` }))}
              value={form.class_id}
              onChange={e => setForm({ ...form, class_id: e.target.value })}
            />
            <SelectDropdown
              label="Subject"
              options={subjectsList.map(s => ({ value: s.id, label: s.name }))}
              value={form.subject_id}
              onChange={e => setForm({ ...form, subject_id: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectDropdown
              label="Month"
              options={['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March']}
              value={form.month}
              onChange={e => setForm({ ...form, month: e.target.value })}
            />
            <SelectDropdown
              label="Week"
              options={['Week 1 (1–7)', 'Week 2 (8–14)', 'Week 3 (15–21)', 'Week 4 (22–28)', 'Week 5 (29–31)']}
              value={form.week}
              onChange={e => setForm({ ...form, week: e.target.value })}
            />
          </div>
          <FormInput
            label="Topic / Unit"
            placeholder="e.g. Linear Equations"
            value={form.topic}
            onChange={e => setForm({ ...form, topic: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <FormInput
              label="My Score (0-100)"
              type="number"
              placeholder="e.g. 85"
              value={form.score}
              onChange={e => setForm({ ...form, score: e.target.value })}
            />
            <div className="flex gap-2 mb-1">
              {['Approaching', 'Meeting', 'Exceeding'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setForm({ ...form, status: opt })}
                  className={clsx(
                    "flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold transition-all",
                    form.status === opt ? "bg-brand-50 border-brand-400 text-brand-700" : "bg-white border-slate-200 text-slate-400"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <FormInput
            label="Remarks / Reflection"
            placeholder="How was the class engagement?"
            value={form.remarks}
            onChange={e => setForm({ ...form, remarks: e.target.value })}
          />
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowModal(false)} className="btn-secondary btn px-6">Cancel</button>
            <button onClick={handleSubmit} className="btn-primary btn px-8 gap-2">
              <CheckCircle size={16} /> Submit Assessment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function FrequentDefaulters({ data }) {
  const counts = {}
  data.forEach(w => {
    w.defaulters.forEach(sid => {
      counts[sid] = (counts[sid] || 0) + 1
    })
  })

  const rows = Object.entries(counts)
    .map(([sid, count]) => {
      const student = STUDENTS.find(s => s.id === sid)
      return {
        id: sid,
        name: student?.name || 'Unknown',
        rollNo: student?.rollNo || '-',
        mobile: student?.mobile || '-',
        missedCount: count,
        totalWeeks: data.length,
        missedPct: Math.round((count / data.length) * 100),
      }
    })
    .sort((a, b) => b.missedCount - a.missedCount)

  if (rows.length === 0) return null

  const columns = [
    { key: 'rollNo', label: 'Roll No.', sortable: true },
    { key: 'name', label: 'Student Name', sortable: true },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'missedCount', label: 'Weeks Missed', sortable: true,
      render: (v, row) => (
        <span className={clsx(
          "font-bold",
          v >= 4 ? 'text-rose-600' : v >= 2 ? 'text-amber-600' : 'text-slate-600'
        )}>
          {v} / {row.totalWeeks}
        </span>
      )
    },
    {
      key: 'missedPct', label: 'Default Rate', sortable: true,
      render: (v) => (
        <span className={clsx(
          "px-2 py-0.5 rounded-full text-[10px] font-bold",
          v >= 50 ? 'bg-rose-100 text-rose-700' : v >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
        )}>
          {v}%
        </span>
      )
    },
  ]

  return (
    <div className="card p-6">
      <SectionHeader
        title="Frequent Defaulters"
        subtitle="Students who repeatedly miss assignments — ranked by default rate"
      />
      <DataTable columns={columns} rows={rows} />
    </div>
  )
}

function ClassroomObservations() {
  const myObs = (OBSERVATIONS ?? []).filter(o => o?.teacher === 'Priya Sharma')

  return (
    <div className="card p-6">
      <SectionHeader title="Classroom Observations" subtitle="Recorded by Principal" />
      <div className="space-y-4">
        {myObs.map(obs => {
          const p = Math.round((obs.score / obs.max) * 100)
          return (
            <div key={obs.id} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{obs.date}</p>
                  <p className="text-xs text-slate-400">Observed by: {obs.observedBy}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-600">{p}%</p>
                  <p className="text-xs text-slate-400">{obs.score}/{obs.max}</p>
                </div>
              </div>
              <div className="space-y-2">
                {obs.criteria.map(c => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-36 flex-shrink-0">{c.name}</span>
                    <div className="flex-1">
                      <ProgressBar value={c.score} max={10} color="teal" showLabel={false} height="h-1.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 w-10 text-right">{c.score}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {myObs.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">No observations recorded yet.</p>
        )}
      </div>
    </div>
  )
}