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

export default function AdminTimetable() {
  const [activeDay, setActiveDay] = useState('All')
  const [filters, setFilters] = useState({ class: 'All', section: 'All' })
  const [schedule, setSchedule] = useState(WEEKLY_SCHEDULE)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [form, setForm] = useState({ subject: '', classPrefix: '', section: '', teacherId: '', time: '' })
  const [addForm, setAddForm] = useState({ day: 'Monday', periodNo: 7, subject: '', classPrefix: 'Grade 8', section: 'A', time: '2:00–2:45', topic: '' })
  const [marksFilter, setMarksFilter] = useState({ class: 'All', section: 'All' })

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const PERIOD_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]

  // --- Computed Options ---
  const classOptions = useMemo(() => {
    const grades = new Set()
    ALL_CLASSES.forEach(c => {
      if (c === 'All') return
      grades.add(c.split('-')[0].trim())
    })
    return ['All', ...Array.from(grades).sort()]
  }, [])

  const sectionOptions = useMemo(() => {
    const sections = new Set()
    ALL_CLASSES.forEach(c => {
      if (c === 'All') return
      if (c.includes('-')) sections.add(c.split('-')[1].trim())
    })
    return ['All', ...Array.from(sections).sort()]
  }, [])

  const filteredSchedule = useMemo(() => {
    return schedule.map(dayObj => {
      const filteredPeriods = dayObj.periods.filter(p => {
        if (filters.class !== 'All') {
          if (!p.class.startsWith(filters.class)) return false
        }
        if (filters.section !== 'All') {
          if (!p.class.endsWith(`-${filters.section}`)) return false
        }
        return true
      })
      return { ...dayObj, periods: filteredPeriods }
    }).filter(dayObj => activeDay === 'All' || dayObj.day === activeDay)
  }, [schedule, filters, activeDay])

  const handleEdit = (period, day) => {
    setSelectedPeriod({ ...period, day })
    const parts = (period.class || '').split('-')
    setForm({ ...period, classPrefix: parts[0]?.trim() || '', section: parts[1]?.trim() || '' })
    setIsEditModalOpen(true)
  }

  const handleSave = () => {
    const mergedForm = { ...form, class: `${form.classPrefix}-${form.section}` }
    const updatedSchedule = schedule.map(d => {
      if (d.day === selectedPeriod.day) {
        const updatedPeriods = d.periods.map(p =>
          p.id === selectedPeriod.id ? { ...p, ...mergedForm } : p
        )
        return { ...d, periods: updatedPeriods }
      }
      return d
    })
    setSchedule(updatedSchedule)
    setIsEditModalOpen(false)
  }

  // Helper to get period data for grid
  const getPeriodData = (day, periodNo) => {
    const dayObj = filteredSchedule.find(d => d.day === day)
    return dayObj?.periods.find(p => p.periodNo === periodNo)
  }

  // Add Extra Period handler
  const handleAddPeriod = () => {
    if (!addForm.subject || !addForm.classPrefix) {
      alert('Please fill in Subject and Class.')
      return
    }
    const updatedSchedule = schedule.map(d => {
      if (d.day === addForm.day) {
        const newPeriod = {
          id: `P_NEW_${Date.now()}`,
          periodNo: addForm.periodNo,
          time: addForm.time,
          subject: addForm.subject,
          class: `${addForm.classPrefix}-${addForm.section}`,
          topic: addForm.topic || 'General Lecture',
          status: 'pending'
        }
        return { ...d, periods: [...d.periods, newPeriod] }
      }
      return d
    })
    setSchedule(updatedSchedule)
    setIsAddModalOpen(false)
    setAddForm({ day: 'Monday', periodNo: 7, subject: '', classPrefix: 'Grade 8', section: 'A', time: '2:00–2:45', topic: '' })
  }

  // Filtered marks
  const filteredMarks = useMemo(() => {
    return MARKS_OVERVIEW.filter(m => {
      if (marksFilter.class !== 'All') {
        if (!m.class.startsWith(marksFilter.class)) return false
      }
      if (marksFilter.section !== 'All') {
        if (!m.class.endsWith(`-${marksFilter.section}`)) return false
      }
      return true
    })
  }, [marksFilter])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">School Timetable</h2>
            <p className="text-xs text-slate-400 font-medium">Master schedule & period allocations</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setFilters({ class: 'All', section: 'All' })
                setActiveDay('All')
              }}
              className="p-2.5 text-slate-400 hover:text-brand-600 rounded-xl hover:bg-brand-50 transition-all border border-slate-100"
              title="Reset View"
            >
              <RotateCcw size={16} />
            </button>
            <div className="h-8 w-px bg-slate-100 mx-1" />
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary py-2.5 px-5 text-xs flex items-center gap-2"
            >
              <Plus size={14} /> Add Extra Period
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Class Filter */}
          <div className="relative group">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Select Class</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-500 transition-colors pointer-events-none">
                <GraduationCap size={16} />
              </div>
              <select 
                value={filters.class}
                onChange={e => setFilters({ ...filters, class: e.target.value })}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all"
              >
                {classOptions.map(opt => <option key={opt} value={opt}>{opt === 'All' ? 'All Grades' : opt}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          {/* Section Filter */}
          <div className="relative group">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Select Section</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-500 transition-colors pointer-events-none">
                <LayoutGrid size={16} />
              </div>
              <select 
                value={filters.section}
                onChange={e => setFilters({ ...filters, section: e.target.value })}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all"
              >
                {sectionOptions.map(opt => <option key={opt} value={opt}>{opt === 'All' ? 'All Sections' : `Section ${opt}`}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          {/* Day Filter */}
          <div className="relative group">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Specific Day</label>
            <div className="relative">
               <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-500 transition-colors pointer-events-none">
                <Calendar size={16} />
              </div>
              <select 
                value={activeDay}
                onChange={e => setActiveDay(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all"
              >
                <option value="All">Weekly Overview</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
               <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-full scrollbar-thin scrollbar-thumb-slate-100">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-left border-b border-r border-slate-100 min-w-[120px]">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Day / Period</span>
                  </div>
                </th>
                {PERIOD_SLOTS.map(p => (
                  <th key={p} className="p-4 border-b border-slate-100 min-w-[160px]">
                    <span className="text-[11px] font-bold text-slate-500">P{p}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.filter(d => activeDay === 'All' || d === activeDay).map(day => (
                <tr key={day} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="p-4 border-b border-r border-slate-100 bg-slate-50/20">
                    <span className="text-xs font-bold text-slate-700">{day}</span>
                  </td>
                  {PERIOD_SLOTS.map(pNo => {
                    const period = getPeriodData(day, pNo)
                    if (!period) return <td key={pNo} className="p-4 border-b border-slate-100 text-center"><span className="text-slate-200">⚠⬝⚠⬝</span></td>
                    
                    return (
                      <td key={pNo} className="p-2 border-b border-slate-100 align-top">
                        <div 
                          onClick={() => handleEdit(period, day)}
                          className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group/card h-full flex flex-col justify-between gap-3 min-h-[110px]"
                        >
                          <div>
                            <div className="flex items-start justify-between">
                              <p className="text-xs font-bold text-slate-800 leading-tight group-hover/card:text-brand-600 transition-colors">{period.subject}</p>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                               <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase">{period.class}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed italic">{period.topic || 'General Lecture'}</p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                             <div className="flex items-center gap-1">
                                <Users size={10} className="text-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400">24</span>
                             </div>
                             <span className={clsx(
                               "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                               period.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               period.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                               "bg-brand-50 text-brand-600 border-brand-100"
                             )}>
                               {period.status === 'completed' ? 'Completed' : period.status === 'pending' ? 'Pending' : 'In Progress'}
                             </span>
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

       {/* Marks overview Section */}
       <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <SectionHeader title="Marks Overview" subtitle="Class-wise exam performance" />
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><GraduationCap size={14} /></div>
                <select 
                  value={marksFilter.class}
                  onChange={e => setMarksFilter({ ...marksFilter, class: e.target.value })}
                  className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all"
                >
                  {classOptions.map(opt => <option key={opt} value={opt}>{opt === 'All' ? 'All Classes' : opt}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
              </div>
            </div>
            <div className="relative group">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><LayoutGrid size={14} /></div>
                <select 
                  value={marksFilter.section}
                  onChange={e => setMarksFilter({ ...marksFilter, section: e.target.value })}
                  className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-all"
                >
                  {sectionOptions.map(opt => <option key={opt} value={opt}>{opt === 'All' ? 'All Sections' : `Sec ${opt}`}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
              </div>
            </div>
          </div>
        </div>
        <DataTable
          columns={[
            { 
              key: 'class', label: 'Class', sortable: true,
              render: (v) => {
                const parts = v.split('-')
                return <span className="font-bold text-slate-700 text-xs">{parts[0]}</span>
              }
            },
            { 
              key: 'class', label: 'Section',
              render: (v) => {
                const parts = v.split('-')
                return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 border border-brand-100">{parts[1] || '–'}</span>
              }
            },
            { key: 'subject', label: 'Subject' },
            { key: 'exam', label: 'Exam' },
            {
              key: 'avg', label: 'Avg %', sortable: true,
              render: (v, row) => (
                <span className={`font-bold ${row.pct >= 80 ? 'text-emerald-600' : row.pct >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>{v}</span>
              )
            },
          ]}
          rows={filteredMarks}
        />
      </div>

      {/* Modal for Editing Period */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Class Period" size="md">
        <div className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
              {selectedPeriod?.periodNo}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedPeriod?.day} Schedule</p>
              <p className="font-bold text-slate-800">{selectedPeriod?.time}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectDropdown label="Class" options={classOptions.filter(c => c !== 'All')} value={form.classPrefix} onChange={e => setForm({ ...form, classPrefix: e.target.value })} />
            <SelectDropdown label="Section" options={sectionOptions.filter(c => c !== 'All')} value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} />
            <SelectDropdown label="Subject" options={SUBJECTS} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <div className="col-span-2">
              <SelectDropdown label="Assigned Teacher" options={[{ value: '', label: 'Choose teacher...' }, ...INIT_TEACHERS.map(t => ({ value: t.name, label: t.name }))]} value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="btn-primary flex-1 justify-center py-3"><Save size={16} /> Update Schedule</button>
            <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary px-8">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Add Extra Period Modal */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Extra Period" size="md">
        <div className="space-y-5">
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex gap-3">
            <Plus size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 leading-relaxed">
              Add a new period slot to an existing day. This will appear in the schedule for the selected day.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectDropdown label="Day" options={DAYS} value={addForm.day} onChange={e => setAddForm({ ...addForm, day: e.target.value })} />
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Period No.</label>
              <input type="number" min="1" max="10" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10" value={addForm.periodNo} onChange={e => setAddForm({ ...addForm, periodNo: parseInt(e.target.value) || 1 })} />
            </div>
            <SelectDropdown label="Class" options={classOptions.filter(c => c !== 'All')} value={addForm.classPrefix} onChange={e => setAddForm({ ...addForm, classPrefix: e.target.value })} />
            <SelectDropdown label="Section" options={sectionOptions.filter(c => c !== 'All').map(s => `Section ${s}`)} value={`Section ${addForm.section}`} onChange={e => setAddForm({ ...addForm, section: e.target.value.replace('Section ', '') })} />
            <SelectDropdown label="Subject" options={SUBJECTS} value={addForm.subject} onChange={e => setAddForm({ ...addForm, subject: e.target.value })} />
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1.5 block">Topic / Chapter</label>
              <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/10" placeholder="e.g. Chapter 5 Review" value={addForm.topic} onChange={e => setAddForm({ ...addForm, topic: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleAddPeriod} className="btn-primary flex-1 justify-center py-3"><Plus size={16} /> Add Period</button>
            <button onClick={() => setIsAddModalOpen(false)} className="btn-secondary px-8">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


//