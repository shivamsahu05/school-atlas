<<<<<<< HEAD
import { useState, useEffect } from 'react'
import { BookOpen, CheckCircle, Clock, AlertCircle, FileUp, Plus, Download, Save } from 'lucide-react'
import { StatCard, SectionHeader, SelectDropdown, StatusBadge, ProgressBar, DataTable, Modal, FormInput } from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { SCHOOL_SYLLABUS } from '../../data/dummyData'
import { syllabusApi } from '../../services/schoolApi'
import { ALL_CLASSES as GLOBAL_CLASSES, SUBJECTS as GLOBAL_SUBJECTS } from '../../data/constants'

const ALL_CLASSES = GLOBAL_CLASSES.filter(c => c !== 'All')
const BASE_CLASSES = [...new Set(ALL_CLASSES.map(c => c.split('-')[0]))]
const SECTIONS = ['A', 'B', 'C', 'D']
const ALL_SUBJECTS = [...GLOBAL_SUBJECTS]

export default function AdminSyllabus() {
  const [loading, setLoading] = useState(false)
  const [cls, setCls] = useState('All')
  const [sec, setSec] = useState('All')
  const [sub, setSub] = useState('All')
  const [mon, setMon] = useState('All')
  const [syllabusData, setSyllabusData] = useState(SCHOOL_SYLLABUS)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // Form state
  const [form, setForm] = useState({
    class: '',
    section: '',
    subject: '',
    chapter: '',
    topic: '',
    plannedDate: ''
  })

  const filterClasses = ['All', ...BASE_CLASSES]
  const filterSections = ['All', ...SECTIONS]
  const filterSubjects = ['All', ...ALL_SUBJECTS]
  const filterMonths = ['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // Calculate teacher-wise completion data
  const teacherChartData = syllabusData.reduce((acc, row) => {
    if (!acc[row.teacher]) {
      acc[row.teacher] = { 
        name: row.teacher.split(' ')[0] + '.', 
        sum: 0, 
        count: 0 
      }
    }
    acc[row.teacher].sum += row.pct
    acc[row.teacher].count += 1
    return acc
  }, {})

  const chartData = Object.values(teacherChartData).map(t => ({
    name: t.name,
    pct: Math.round(t.sum / t.count)
  }))

  const handleSaveSyllabus = async () => {
    if (!form.class || !form.subject || !form.topic) {
      alert("Class, Subject and Topic are required.")
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        class: `${form.class}-${form.section}`,
        completed: false
      }
      delete payload.section
      await syllabusApi.create(payload)
      alert("Syllabus topic added successfully!")
      setIsAddModalOpen(false)
      resetForm()
      // Refresh data here if needed
    } catch (error) {
      alert("Failed to save syllabus: " + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target.result
      const rows = text.split('\n').map(r => r.trim()).filter(r => r)
      
      let imported = 0
      let errors = []
      setLoading(true)

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',')
        if (cols.length < 2) continue
        const [cls, sub, chapter, topic, date] = cols

        if (!cls || !sub || !topic) {
          errors.push(`Row ${i + 1}: Missing required fields (Class, Subject, topic).`)
          continue
        }

        try {
          await syllabusApi.create({
            class: cls,
            subject: sub,
            chapter: chapter || '',
            topic: topic,
            plannedDate: date || '',
            completed: false
          })
          imported++
        } catch (error) {
          errors.push(`Row ${i + 1}: Failed to import.`)
        }
      }

      if (errors.length) {
        alert(`Errors found:\n${errors.join('\n')}\n\nSuccessfully imported ${imported} topics.`)
      } else {
        alert(`Success! ${imported} syllabus topics imported.`)
      }
      setLoading(false)
      setIsBulkModalOpen(false)
      // Refresh data here if needed
    }
    reader.readAsText(file)
  }

  const resetForm = () => {
    setForm({ class: '', section: '', subject: '', chapter: '', topic: '', plannedDate: '' })
  }

  const filtered = syllabusData.filter(row => {
    const classMatch = cls === 'All' || row.class.startsWith(cls)
    const sectionMatch = sec === 'All' || row.class.endsWith(`-${sec}`)
    const subjectMatch = sub === 'All' || row.subject === sub
    const monthMatch = mon === 'All' || row.month === mon
    return classMatch && sectionMatch && subjectMatch && monthMatch
  })

  const avgPct = Math.round(filtered.reduce((a, r) => a + r.pct, 0) / (filtered.length || 1))

  const columns = [
    { 
      key: 'teacher', 
      label: 'Teacher', 
      sortable: true 
    },
    { 
      key: 'subject', 
      label: 'Subject', 
      sortable: true 
    },
    { 
      key: 'class', 
      label: 'Class', 
      sortable: true, 
      sortBy: (row) => parseInt(row.class.match(/\d+/) || 0),
      render: (v) => v.split('-')[0].replace('Grade ', '')
    },
    { 
      key: 'section', 
      label: 'Section', 
      sortable: true, 
      sortBy: (row) => row.class.split('-')[1] || '-',
      render: (_, row) => row.class.split('-')[1] || '-'
    },
    { 
      key: 'week', 
      label: 'Teaching Pace', 
      sortable: true, 
      sortBy: (row) => row.currentWeek,
      render: (_, row) => {
        const diff = row.expectedWeek - row.currentWeek
        const status = diff === 0 ? 'On Track' : diff > 0 ? `${diff} wk${diff > 1 ? 's' : ''} behind` : `${Math.abs(diff)} wk${Math.abs(diff) > 1 ? 's' : ''} ahead`
        const color = diff === 0 ? 'emerald' : diff > 0 ? 'rose' : 'blue'
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[11px] font-bold text-slate-700">
              Week {row.currentWeek} 
              <span className="text-[10px] text-slate-400 font-normal"> / {row.expectedWeek}</span>
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-${color}-50 text-${color}-600 border border-${color}-200`}>
              {status}
            </span>
          </div>
        )
      }
    },
    { 
      key: 'pct', 
      label: 'Completion %', 
      sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-3 min-w-[120px]">
          <ProgressBar value={v} max={100} color="auto" showLabel={false} height="h-1.5" />
          <span className={`text-xs font-bold w-10 ${
            v >= 75 ? 'text-emerald-600' : 
            v >= 50 ? 'text-amber-600' : 
            'text-rose-600'
          }`}>
            {v}%
          </span>
=======
import { useState } from 'react'
import { BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { StatCard, SectionHeader, FilterChips, StatusBadge, ProgressBar } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { SCHOOL_SYLLABUS } from '../../data/dummyData'

const ALL_CLASSES   = ['All','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10']
const ALL_SUBJECTS  = ['All','Mathematics','Science','English','Hindi','Social Studies']

const CHART_DATA = [
  { name:'Priya S.',  pct:58 },{ name:'Anjali M.', pct:63 },{ name:'Ramesh P.', pct:60 },
  { name:'Sunita J.', pct:80 },{ name:'Vikram S.',  pct:40 },
]

export default function AdminSyllabus() {
  const [cls, setCls]  = useState('All')
  const [sub, setSub]  = useState('All')

  const filtered = SCHOOL_SYLLABUS.filter(row =>
    (cls === 'All' || row.class.startsWith(cls)) &&
    (sub === 'All' || row.subject === sub)
  )

  const avgPct = Math.round(filtered.reduce((a,r) => a + r.pct, 0) / (filtered.length || 1))

  const columns = [
    { key:'teacher', label:'Teacher',  sortable:true },
    { key:'subject', label:'Subject',  sortable:true },
    { key:'class',   label:'Class',    sortable:true },
    { key:'done',    label:'Done'                    },
    { key:'pct',     label:'Completion %', sortable:true,
      render:(v, row) => (
        <div className="flex items-center gap-3 min-w-[100px]">
          <ProgressBar value={v} max={100} color="auto" showLabel={false} height="h-1.5" />
          <span className={`text-xs font-bold w-8 ${v>=75?'text-emerald-600':v>=50?'text-amber-600':'text-rose-600'}`}>{v}%</span>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
        </div>
      ),
    },
  ]

<<<<<<< HEAD
  // Calculate stats
  const onTrackCount = syllabusData.filter(r => r.pct >= 75).length
  const atRiskCount = syllabusData.filter(r => r.pct < 50).length
  const inProgressCount = syllabusData.filter(r => r.pct >= 50 && r.pct < 75).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-slate-800">Syllabus Tracking</h1>
            <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold border border-brand-200 flex items-center gap-1.5 shadow-sm">
              <Clock size={12} />
              Current: Week 5
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Monitor completion status and manage academic content</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsBulkModalOpen(true)} 
            className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-slate-600"
          >
            <FileUp size={16} /> Bulk Upload
          </button>
          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 shadow-lg"
          >
            <Plus size={16} /> Define Syllabus
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="School Avg" 
          value={`${avgPct}%`} 
          icon={BookOpen} 
          color="blue" 
          trend={avgPct} 
        />
        <StatCard 
          title="On Track" 
          value={onTrackCount} 
          icon={CheckCircle} 
          color="green" 
        />
        <StatCard 
          title="At Risk" 
          value={atRiskCount} 
          icon={AlertCircle} 
          color="red" 
        />
        <StatCard 
          title="In Progress" 
          value={inProgressCount} 
          icon={Clock} 
          color="amber" 
        />
=======
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="School Avg"  value={`${avgPct}%`}                             icon={BookOpen}     color="blue"   trend={avgPct} />
        <StatCard title="On Track"    value={SCHOOL_SYLLABUS.filter(r=>r.pct>=75).length} icon={CheckCircle} color="green" />
        <StatCard title="At Risk"     value={SCHOOL_SYLLABUS.filter(r=>r.pct<50).length}  icon={AlertCircle} color="red"   />
        <StatCard title="In Progress" value={SCHOOL_SYLLABUS.filter(r=>r.pct>=50&&r.pct<75).length} icon={Clock} color="amber" />
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
      </div>

      {/* Chart */}
      <div className="card p-6">
        <SectionHeader title="Teacher-wise Completion" subtitle="Average across all classes" />
<<<<<<< HEAD
        <BarChartWidget 
          data={chartData} 
          dataKey="pct" 
          xKey="name" 
          color="#1a56db" 
          height={200} 
          name="Completion %" 
        />
=======
        <BarChartWidget data={CHART_DATA} dataKey="pct" xKey="name" color="#1a56db" height={200} name="Completion %" />
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
      </div>

      {/* Filters + Table */}
      <div className="card p-6">
        <SectionHeader title="Syllabus Records" subtitle={`${filtered.length} records`} />

<<<<<<< HEAD
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <SelectDropdown 
            label="Class" 
            options={filterClasses} 
            value={cls} 
            onChange={(e) => setCls(e.target.value)} 
          />
          <SelectDropdown 
            label="Section" 
            options={filterSections} 
            value={sec} 
            onChange={(e) => setSec(e.target.value)} 
          />
          <SelectDropdown 
            label="Subject" 
            options={filterSubjects} 
            value={sub} 
            onChange={(e) => setSub(e.target.value)} 
          />
          <SelectDropdown 
            label="Month" 
            options={filterMonths} 
            value={mon} 
            onChange={(e) => setMon(e.target.value)} 
          />
        </div>

        <DataTable 
          columns={columns} 
          rows={filtered} 
          emptyMessage="No records match the selected filters." 
        />
      </div>

      {/* Define Syllabus Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Define Syllabus Topic"
        size="md"
      >
        <div className="space-y-5 p-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectDropdown 
              label="Class *" 
              options={BASE_CLASSES} 
              value={form.class} 
              onChange={e => setForm({ ...form, class: e.target.value })} 
            />
            <SelectDropdown 
              label="Section *" 
              options={SECTIONS} 
              value={form.section} 
              onChange={e => setForm({ ...form, section: e.target.value })} 
            />
            <SelectDropdown 
              label="Subject *" 
              options={ALL_SUBJECTS} 
              value={form.subject} 
              onChange={e => setForm({ ...form, subject: e.target.value })} 
            />
          </div>
          <FormInput 
            label="Chapter Name" 
            placeholder="e.g. Chapter 4: Photosynthesis" 
            value={form.chapter} 
            onChange={e => setForm({ ...form, chapter: e.target.value })} 
          />
          <FormInput 
            label="Topic Title *" 
            placeholder="e.g. Dark Reaction Mechanism" 
            value={form.topic} 
            onChange={e => setForm({ ...form, topic: e.target.value })} 
          />
          <FormInput 
            label="Planned Completion Date" 
            type="date" 
            value={form.plannedDate} 
            onChange={e => setForm({ ...form, plannedDate: e.target.value })} 
          />

          <div className="pt-4 flex gap-3">
            <button
              onClick={handleSaveSyllabus}
              disabled={loading}
              className="btn-primary flex-1 py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} /> {loading ? 'Saving...' : 'Save Topic'}
            </button>
            <button 
              onClick={() => setIsAddModalOpen(false)} 
              className="btn-secondary px-6" 
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Syllabus Import"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <FileUp size={32} />
            </div>
            <p className="font-semibold text-slate-800">Choose CSV File</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Upload topic list with Class, Subject, Chapter, Topic, Date
            </p>
            <label className="btn-secondary mt-6 text-xs cursor-pointer px-4 py-2 flex items-center gap-2">
              <Plus size={14} /> Browse Files
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleBulkUpload} 
              />
            </label>
          </div>

          <div className="bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
            <p className="text-[10px] font-bold text-brand-600 uppercase mb-2 tracking-wider">
              Instructions
            </p>
            <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-4 mb-3">
              <li>Header row required: Class, Subject, Chapter, Topic, Date</li>
              <li>Date format: YYYY-MM-DD</li>
              <li>Subject must match existing school departments</li>
            </ul>
            <button 
              onClick={() => {
                const csv = "Class,Subject,Chapter,Topic,Date\nGrade 8-A,Science,Chapter 4,Dark Reaction,2024-04-20\nGrade 9-A,Mathematics,Chapter 5,Quadratic Formula,2024-04-22\n"
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'SAMS_Syllabus_Template.csv'
                a.click()
              }} 
              className="text-brand-600 font-bold text-xs underline cursor-pointer flex items-center gap-1 hover:text-brand-700"
            >
              <Download size={14} /> Download CSV Template
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
=======
        <div className="space-y-3 mb-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filter by Class</p>
            <FilterChips options={ALL_CLASSES} value={cls} onChange={setCls} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filter by Subject</p>
            <FilterChips options={ALL_SUBJECTS} value={sub} onChange={setSub} />
          </div>
        </div>

        <DataTable columns={columns} rows={filtered} emptyMessage="No records match the selected filters." />
      </div>
    </div>
  )
}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
