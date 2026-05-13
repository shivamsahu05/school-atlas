import { useState, useEffect, useCallback } from 'react'
import { 
  Users, CheckCircle, BookOpen, Clock, Download, Search, 
  Filter, FileText, AlertCircle, MoreHorizontal, ArrowUpRight, Loader2
} from 'lucide-react'
import { StatCard, SectionHeader, ProgressBar } from '../../components/ui/index.jsx'
import { reportsApi, academicApi, classesApi } from '../../api'

export default function CompletionReport() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    summary: { totalStudents: 0, homeworkComplete: 0, notebookChecked: 0, bothComplete: 0, overallCompletion: 0 },
    incompleteStudents: [],
    detailedData: []
  })
  
  const [filters, setFilters] = useState({
    class_id: '',
    section_id: '',
    subject_id: '',
    week: '',
    search: ''
  })

  const [meta, setMeta] = useState({
    classes: [],
    sections: [],
    subjects: []
  })

  const fetchMetadata = useCallback(async () => {
    try {
      const [clsRes, subRes] = await Promise.all([
        academicApi.getClasses(),
        classesApi.getSubjects()
      ])
      setMeta(prev => ({
        ...prev,
        classes: clsRes.data || [],
        subjects: subRes.data || []
      }))
    } catch (e) { console.error("Metadata Load Failed", e) }
  }, [])

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true)
      const res = await reportsApi.getCompletionReport(filters)
      if (res.success) {
        setData(res)
      }
    } catch (e) { console.error("Report Load Failed", e) }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchMetadata() }, [fetchMetadata])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport()
    }, 500) // Debounce search/filter changes
    return () => clearTimeout(timer)
  }, [fetchReport])

  const handleExport = async () => {
    try {
      const blob = await reportsApi.exportCompletionReport(filters)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `completion-report-${new Date().toISOString().slice(0,10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (e) { alert("Export failed") }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Complete': case 'Checked': case 'Verified':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">Done</span>
      case 'Incomplete':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wider">Incomplete</span>
      case 'Pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wider">Pending</span>
      case 'Not Verified':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-100 uppercase tracking-wider">Not Verified</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100 uppercase tracking-wider">{status}</span>
    }
  }

  const { summary, incompleteStudents, detailedData } = data

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
      
      {loading && (
        <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Completion Report</h1>
          <p className="text-sm text-slate-500 font-medium">Homework & Notebook Completion Tracking Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Quick Search..." 
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none w-64 transition-all"
            />
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={summary.totalStudents} icon={Users} color="blue" trend={100} trendLabel="Population" />
        <StatCard title="Homework Complete" value={summary.homeworkComplete} icon={FileText} color="teal" trend={summary.totalStudents > 0 ? Math.round((summary.homeworkComplete/summary.totalStudents)*100) : 0} />
        <StatCard title="Notebook Checked" value={summary.notebookChecked} icon={CheckCircle} color="green" trend={summary.totalStudents > 0 ? Math.round((summary.notebookChecked/summary.totalStudents)*100) : 0} />
        <StatCard title="Both Complete" value={summary.bothComplete} icon={ArrowUpRight} color="brand" trend={summary.overallCompletion} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Progress & Incomplete Panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Progress Widget */}
          <div className="card p-6 bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 shadow-lg shadow-brand-200">
            <SectionHeader title="Overall Progress" subtitle="Both tasks completed" light />
            <div className="mt-6 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-3xl font-black">{summary.overallCompletion}%</div>
                <div className="text-[10px] font-bold text-brand-100 uppercase tracking-widest">{summary.bothComplete} / {summary.totalStudents} Students</div>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-brand-500/30 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin-slow" style={{ clipPath: `conic-gradient(white ${summary.overallCompletion}%, transparent 0)` }}></div>
                <CheckCircle size={24} className="text-white" />
              </div>
            </div>
            <div className="mt-6">
              <ProgressBar value={summary.overallCompletion} max={100} color="white" height="h-2" showLabel={false} />
            </div>
          </div>

          {/* Incomplete Work List */}
          <div className="card p-6 border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader title="Incomplete Work" subtitle={`${incompleteStudents.length} students need attention`} />
              <div className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full">ACTION REQUIRED</div>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {incompleteStudents.length > 0 ? incompleteStudents.map((s, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-700 text-sm group-hover:text-brand-600 transition-colors">{s.studentName} <span className="text-slate-400 font-medium">({s.class})</span></span>
                    <AlertCircle size={14} className="text-amber-500" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.issues.map((issue, idx) => (
                      <span key={idx} className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${issue.includes('Homework') ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <CheckCircle size={32} className="mb-2 text-emerald-500" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All work verified!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Table Section */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filter Bar */}
          <div className="card p-3 bg-slate-50/50 border-slate-200 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
              <Filter size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filters</span>
            </div>
            <select 
              value={filters.class_id}
              onChange={e => setFilters(f => ({ ...f, class_id: e.target.value }))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/20 w-32 shadow-sm"
            >
              <option value="">All Classes</option>
              {meta.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              value={filters.subject_id}
              onChange={e => setFilters(f => ({ ...f, subject_id: e.target.value }))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/20 w-32 shadow-sm"
            >
              <option value="">All Subjects</option>
              {meta.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select 
              value={filters.week}
              onChange={e => setFilters(f => ({ ...f, week: e.target.value }))}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/20 w-32 shadow-sm"
            >
              <option value="">Current Week</option>
              <option value="week 1">Week 1</option>
              <option value="week 2">Week 2</option>
              <option value="week 3">Week 3</option>
              <option value="week 4">Week 4</option>
            </select>
          </div>

          {/* Main Table */}
          <div className="card overflow-hidden border-slate-200 shadow-sm min-h-[500px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Name</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Class</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Homework</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Notebook</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Verification</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailedData.length > 0 ? detailedData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">{row.name[0]}</div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{row.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">ID #{row.student_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">{row.class}-{row.section}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-bold text-slate-600">{row.subject}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getStatusBadge(row.homeworkStatus)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getStatusBadge(row.notebookStatus)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getStatusBadge(row.verificationStatus)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[10px] font-bold text-slate-400">{row.lastUpdated}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No records found matching filters</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {detailedData.length} records</span>
              <button className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all">
                <MoreHorizontal size={16} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
