import { useState, useEffect, useCallback, useMemo } from 'react'
import { BookOpen, CheckCircle, Clock, Plus, Download, Upload, Table, Loader2, AlertTriangle, Filter, Search, Calendar, ChevronRight } from 'lucide-react'
import { StatCard, SectionHeader, FilterChips, StatusBadge, Modal, ProgressBar } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { syllabusApi, scheduleApi } from '../../api'

const ACADEMIC_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March']
const ACADEMIC_WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']

const normalize = (val) => String(val || '').trim().toLowerCase()

export default function TeacherSyllabus() {
  const currentMonthName = useMemo(() => new Date().toLocaleString('default', { month: 'long' }), []);
  const currentWeekName = useMemo(() => {
    const day = new Date().getDate();
    return `Week ${Math.min(Math.ceil(day / 7), 5)}`;
  }, []);

  const [items, setItems] = useState([])
  const [assignments, setAssignments] = useState({ classes: [], subjects: [] })
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, completionPct: 0 })
  const [error, setError] = useState(null)
  const [dataLoading, setDataLoading] = useState(false)
  
  // Advanced Filters
  const [filterCls, setFilterCls] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedWeek, setSelectedWeek] = useState('')

  // Date formatting helper to prevent "Invalid Date"
  const formatDate = (date) => {
    if (!date) return "-"
    const d = new Date(date)
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString('en-GB')
  }
  
  // Fetch assignments for dropdowns
  useEffect(() => {
    scheduleApi.getMyAssignments().then(res => {
      setAssignments(res?.data || { assignments: [] })
    }).catch(console.error)
  }, [])

  // Derived assignment lists
  const availableClasses = Array.isArray(assignments.assignments) 
    ? [...new Set(assignments.assignments.map(a => a.className))].sort((a,b) => a-b)
    : [];


  const fetchSyllabus = useCallback(async (showFullLoader = false) => {
    try {
      if (showFullLoader) setLoading(true)
      setDataLoading(true)
      setError(null)

      // Fetch all for current class (or all classes) to enable instant client-side filtering
      const res = await syllabusApi.getPlan({
        class: filterCls || undefined
      })

      const data = Array.isArray(res) ? res : (res?.data || [])
      setItems(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load syllabus plan')
    } finally {
      setLoading(false)
      setDataLoading(false)
    }
  }, [filterCls])

  useEffect(() => {
    fetchSyllabus(items.length === 0)
  }, [fetchSyllabus])

  // SYNC LISTENER
  useEffect(() => {
    const handleSync = () => fetchSyllabus();
    window.addEventListener('syllabus-updated', handleSync);
    return () => window.removeEventListener('syllabus-updated', handleSync);
  }, [fetchSyllabus]);

  // Intelligence: Filtering and Stats Calculation
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchMonth  = !selectedMonth  || normalize(item.month) === normalize(selectedMonth)
      const matchWeek   = !selectedWeek   || normalize(item.week).includes(selectedWeek.replace('Week ', ''))
      const matchStatus = filterStatus === 'All' || normalize(item.status) === normalize(filterStatus)
      const itemCls = String(item.class || item.className || '').trim().replace(/^Class\s+/i, '');
      const selCls = String(filterCls || '').trim().replace(/^Class\s+/i, '');
      const matchCls = !filterCls || itemCls === selCls;
      
      return matchMonth && matchWeek && matchStatus && matchCls
    })
  }, [items, selectedMonth, selectedWeek, filterStatus, filterCls])

  const displayStats = useMemo(() => {
    const total = filteredItems.length
    const completed = filteredItems.filter(i => normalize(i.status) === 'completed').length
    const pending = total - completed
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, pending, pct }
  }, [filteredItems])

  // Intelligence: Week-wise Completion Data
  const weeklyTrendData = useMemo(() => {
    const monthFiltered = items.filter(r => !selectedMonth || normalize(r.month) === normalize(selectedMonth))
    
    return ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((w, idx) => {
      const weekItems = monthFiltered.filter(r => normalize(r.week).includes(String(idx + 1)))
      if (weekItems.length === 0) return { name: `W${idx + 1}`, value: 0 }
      
      const totalScore = weekItems.reduce((acc, r) => {
        if (normalize(r.status) === 'completed') return acc + 100
        
        const lvl = normalize(r.class_understanding_level)
        if (lvl.includes('exceed')) return acc + 95
        if (lvl.includes('meet'))   return acc + 60
        if (lvl.includes('approach')) return acc + 25
        return acc
      }, 0)

      const avgPct = Math.round(totalScore / weekItems.length)
      return { name: `W${idx + 1}`, value: avgPct }
    })
  }, [items, selectedMonth])

  const handleExport = async () => {
    try {
      const res = await syllabusApi.exportPlan({
        class: filterCls || undefined,
        status: filterStatus === 'All' ? undefined : filterStatus.toLowerCase()
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'syllabus_plan.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Export failed')
    }
  }

  const columns = [
    {
      key: 'serial',
      label: '#',
      render: (_, __, meta) => <span className="text-xs font-bold text-slate-400">{meta.rowIndex + 1}</span>
    },
    {
      key: 'week', label: 'Week', sortable: true,
      render: (v, r) => (
        <div className="flex flex-col gap-1.5">
          <span className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit border border-brand-100">
            {r.month ? `${r.month} • ` : ''}{v}
          </span>
          <span className="text-[9px] text-slate-400 font-bold px-1 uppercase tracking-widest">
            {formatDate(r.planned_start_date)} — {formatDate(r.planned_end_date)}
          </span>
        </div>
      )
    },
    {
      key: 'periods', label: 'Total Periods', sortable: true,
      render: (v) => <span className="font-black text-brand-600">{v || 0}</span>
    },
    {
      key: 'topic', label: 'Chapter & Topic', sortable: true,
      render: (v, r) => <span className="font-semibold text-slate-700 text-xs">{v || r.chapter_topic || "Untitled Topic"}</span>
    },
    {
      key: 'details', label: 'Class / Subject',
      render: (_, r) => (
        <div className="text-[10px] text-slate-600">
          <span className="font-bold text-brand-600">Class {r.class || r.className} - {r.section || r.sectionName}</span>
          <span className="mx-1">•</span>
          <span className="capitalize">{(r.subject || r.subjectName)?.toLowerCase()}</span>
        </div>
      )
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (v) => {
        const isComp = normalize(v) === 'completed';
        return (
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isComp ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {isComp ? '✅ Done' : '⏳ Pending'}
          </span>
        );
      }
    },
    {
      key: 'updated_at', label: 'Last Updated', sortable: true,
      render: (v) => <span className="text-[10px] text-slate-400">{formatDate(v)}</span>
    }
  ]

  if (loading && items.length === 0) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-6 animate-fade-in py-2 sm:py-4 px-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Syllabus Planner</h1>
          <p className="text-slate-500 text-sm font-medium">Monthly and Weekly syllabus management</p>
        </div>
        <div className="flex flex-wrap gap-2">
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <BookOpen size={48} className="text-brand-600" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Topics</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">{displayStats.total}</h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: displayStats.total > 0 ? '100%' : '0%' }}></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle size={48} className="text-emerald-600" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Completed</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-1">{displayStats.completed}</h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${displayStats.pct}%` }}></div>
            </div>
            <span className="text-xs font-black text-emerald-600">{displayStats.pct}%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock size={48} className="text-amber-600" />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Pending</p>
          <h3 className="text-3xl font-black text-amber-600 mt-1">{displayStats.pending}</h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${displayStats.total > 0 ? (100 - displayStats.pct) : 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Section: Week-wise Completion */}
      <div className="bg-white p-6 sm:p-10 rounded-[40px] border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-50/50">
        <SectionHeader 
          title="Week-wise Completion" 
          subtitle="Progress overview for selected month"
        />
        <div className="mt-8 h-[250px]">
          <BarChartWidget 
            data={weeklyTrendData} 
            dataKey="value" 
            xKey="name" 
            color="#2563eb" 
            height={250} 
            name="Completion %"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Streamlined Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-500 mr-2">
            <Filter size={16} className="text-brand-600" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-700">Filters</span>
          </div>
          
          <select 
            value={filterCls} 
            onChange={e => setFilterCls(e.target.value)}
            className="text-xs font-bold border border-slate-200 bg-white shadow-sm rounded-xl px-4 py-2 text-slate-700 outline-none min-w-[140px] focus:ring-2 focus:ring-brand-100 transition-all"
          >
            <option value="">All Classes</option>
            {availableClasses.map(cls => {
              const displayName = cls?.toString().startsWith('Class') ? cls : `Class ${cls}`;
              return <option key={cls} value={cls}>{displayName}</option>;
            })}
          </select>

          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold border border-slate-200 bg-white shadow-sm rounded-xl px-4 py-2 text-slate-700 outline-none min-w-[140px] focus:ring-2 focus:ring-brand-100 transition-all"
          >
            <option value="">All Months</option>
            {ACADEMIC_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select 
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="text-xs font-bold border border-slate-200 bg-white shadow-sm rounded-xl px-4 py-2 text-slate-700 outline-none min-w-[140px] focus:ring-2 focus:ring-brand-100 transition-all"
          >
            <option value="">All Weeks</option>
            {ACADEMIC_WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />

          <FilterChips 
            options={['All', 'Completed', 'Pending']} 
            value={filterStatus} 
            onChange={setFilterStatus} 
          />

          <button 
            onClick={() => {
              setFilterCls('');
              setFilterStatus('All');
              setSelectedMonth('');
              setSelectedWeek('');
            }}
            className="ml-auto p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
            title="Clear all filters"
          >
            <Search size={14} /> Reset
          </button>
        </div>

        <div className="relative">
          {dataLoading && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-brand-500" />
            </div>
          )}
          
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    {columns.map(col => (
                      <th key={col.key} className="px-3 py-3 sm:px-6 sm:py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.map((row, idx) => {
                    const isCurrent = normalize(row.month) === normalize(currentMonthName) && normalize(row.week).includes(normalize(currentWeekName));
                    const isCompleted = normalize(row.status) === 'completed';
                    
                    let rowClass = "hover:bg-slate-50/50 transition-colors group border-l-[3px] border-l-transparent";
                    if (isCompleted) {
                      rowClass = "bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors group border-l-[3px] border-l-emerald-500";
                    } else if (isCurrent) {
                      rowClass = "bg-amber-50/40 hover:bg-amber-100/60 transition-colors group border-l-[3px] border-l-amber-500";
                    }

                    return (
                    <tr key={row.id || idx} className={rowClass}>
                      {columns.map(col => (
                        <td key={col.key} className="px-3 py-2 sm:px-6 sm:py-4">
                          {col.render ? col.render(row[col.key], row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-slate-300" />
              </div>
              <h3 className="text-slate-800 font-bold">No syllabus data found</h3>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your filters (Class, Month, Week, or Status).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
