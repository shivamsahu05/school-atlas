import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Brain, TrendingUp, Download, Plus, Loader2, AlertTriangle, 
  Calendar, Users, ChevronDown, ChevronRight, CheckCircle2, 
  Clock, Award, BarChart3, Filter, Search, UserMinus, Trophy
} from 'lucide-react'
import { StatCard, SectionHeader, Modal } from '../../components/ui/index.jsx'
import { loApi, intelligenceApi } from '../../api'
import clsx from 'clsx'
import { toast } from 'react-hot-toast'

export default function TeacherLO() {
  const [data, setData] = useState(null)
  const [loIntel, setLoIntel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  
  // UI State
  const [expandedWeeks, setExpandedWeeks] = useState({}) // weekId -> boolean
  
  // Filter timeline by selected month chip
  const [activeMonth, setActiveMonth] = useState('All')
  const ACADEMIC_MONTHS = useMemo(() => ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'], [])

  const filteredMonths = useMemo(() => {
    const timeline = data?.timeline || {};
    if (activeMonth === 'All') return Object.keys(timeline).sort((a,b) => ACADEMIC_MONTHS.indexOf(a) - ACADEMIC_MONTHS.indexOf(b));
    return [activeMonth].filter(m => timeline[m]);
  }, [data, activeMonth, ACADEMIC_MONTHS])

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const [res, intelRes] = await Promise.all([
        loApi.getTeacherAnalytics({
          class_id: selectedClass || undefined,
          section_id: selectedSection || undefined,
          subject_id: selectedSubject || undefined
        }),
        intelligenceApi.getLOIntelligence().catch(() => ({ data: null }))
      ])

      if (res.success) {
        setData(res.data)
        setLoIntel(intelRes?.data)
      } else {
        setError(res.message || 'Failed to fetch analytics')
      }
    } catch (err) {
      console.error("Fetch Error:", err)
      setError(err.response?.data?.message || 'Failed to load academic intelligence data')
    } finally {
      setLoading(false)
    }
  }, [selectedClass, selectedSection, selectedSubject])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const toggleWeek = (id) => {
    setExpandedWeeks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Helper for status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Perfect': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
      case 'Partial': return 'text-amber-600 bg-amber-50 border-amber-100'
      case 'Critical': return 'text-rose-600 bg-rose-50 border-rose-100'
      default: return 'text-slate-600 bg-slate-50 border-slate-100'
    }
  }

  const getProgressColor = (pct) => {
    if (pct === 100) return 'bg-emerald-500'
    if (pct >= 75) return 'bg-brand-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
          <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-600 animate-pulse" size={24} />
        </div>
        <p className="text-slate-500 font-bold animate-pulse tracking-widest text-xs uppercase">Initializing Intelligence Engine...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-12 text-center max-w-md mx-auto mt-20">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Sync Failed</h3>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <button onClick={fetchAnalytics} className="btn-primary w-full justify-center py-3">Retry Sync</button>
      </div>
    )
  }

  const { stats, timeline = {}, rankings, observations, meta } = data || {}

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-4 lg:p-8 bg-slate-50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#0d225c] tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-100">
              <BarChart3 size={28} />
            </div>
            Academic Intelligence
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 pl-16">Real-time learning outcomes & assignment tracking</p>
        </div>

        {/* Compact Global Header Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-[1.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center px-4 py-2 border-r border-slate-100">
              <Filter size={14} className="text-brand-600 mr-2" />
              <select 
                className="text-[11px] font-black text-slate-700 bg-transparent outline-none cursor-pointer uppercase tracking-wider"
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); }}
              >
                <option value="">Select Class</option>
                {[...new Set(meta?.assigned?.map(a => a.class_id))].map(id => {
                  const name = meta.assigned.find(a => a.class_id === id).class_name;
                  return <option key={id} value={id}>Class {name}</option>
                })}
              </select>
            </div>

            <div className="flex items-center px-4 py-2">
              <Brain size={14} className="text-brand-600 mr-2" />
              <select 
                className="text-[11px] font-black text-slate-700 bg-transparent outline-none cursor-pointer uppercase tracking-wider"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Select Subject</option>
                {[...new Set(meta?.assigned?.map(a => a.subject_id))].map(id => {
                  const name = meta.assigned.find(a => a.subject_id === id).subject_name;
                  return <option key={id} value={id}>{name}</option>
                })}
              </select>
            </div>
          </div>

          {(selectedClass || selectedSubject || selectedSection) && (
            <button 
              onClick={() => { setSelectedClass(''); setSelectedSection(''); setSelectedSubject(''); setActiveMonth('All'); }}
              className="px-4 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center gap-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* MAIN TWO-COLUMN INTELLIGENCE HUB */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: WEEKLY ASSIGNMENT DEFAULTERS (2/3 Width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SectionHeader title="Weekly Assignment Defaulters" subtitle="Identifying students with missing submissions" />
            <div className="flex items-center gap-2">
               <button className="btn bg-white border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                 <Download size={14} className="text-brand-600" /> Export
               </button>
            </div>
          </div>

          {/* Compact Section & Month Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 pb-2">
            {/* Section Switcher Pill */}
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
               <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 flex items-center gap-2">
                 <Users size={12} className="text-brand-600" /> Section
               </div>
               <select 
                className="bg-transparent text-[10px] font-black text-brand-700 outline-none px-3 cursor-pointer uppercase"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
               >
                 <option value="">All</option>
                 {(() => {
                    const assigned = meta?.assigned || [];
                    const filtered = assigned.filter(a => !selectedClass || String(a.class_id) === String(selectedClass));
                    return [...new Set(filtered.map(a => a.section_id))].map(sid => {
                      const sname = filtered.find(a => a.section_id === sid).section_name;
                      return <option key={sid} value={sid}>{sname}</option>;
                    });
                  })()}
               </select>
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1" />

            {['All', ...ACADEMIC_MONTHS.filter(m => timeline[m]), ...(timeline['Unplanned'] ? ['Unplanned'] : [])].map(m => (
              <button
                key={m}
                onClick={() => setActiveMonth(m)}
                className={clsx(
                  "px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeMonth === m 
                    ? "bg-[#0d225c] text-white shadow-lg shadow-blue-100" 
                    : "bg-white text-slate-400 border border-slate-200 hover:border-brand-200 hover:text-brand-600"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          
          {filteredMonths.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-slate-200">
              <Search size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold tracking-tight">No assignment data found for the selected month.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredMonths.map(month => (
                <div key={month} className="space-y-4">
                  {timeline[month].map((week) => (
                    <div key={week.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-lg uppercase tracking-widest">
                              {month} · {week.week}
                            </span>
                            {week.submissionPct === 100 && (
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle2 size={12} /> ALL SUBMITTED ✓
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-xl font-black text-slate-800 leading-tight group-hover:text-brand-600 transition-colors">
                              {week.topic}
                            </h4>
                            {week.understanding_level && week.understanding_level !== '-' && week.understanding_level !== 'awaiting status' && (
                              <span className={clsx(
                                "text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest",
                                week.understanding_level?.toLowerCase().includes('exceed') ? "bg-emerald-100 text-emerald-700" :
                                week.understanding_level?.toLowerCase().includes('approach') ? "bg-amber-100 text-amber-700" :
                                "bg-blue-100 text-blue-700"
                              )}>
                                {week.understanding_level}
                              </span>
                            )}
                          </div>
                          {week.learning_outcome && (
                            <p className="text-sm font-medium text-slate-600 italic border-l-2 border-slate-200 pl-3 py-0.5">
                              "{week.learning_outcome}"
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Calendar size={12} /> Class: {week.class_name}</span>
                            <span>•</span>
                            <span className="text-brand-600">{week.subject || 'Academic'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right space-y-1.5">
                            <div className="flex items-baseline justify-end gap-1.5">
                              <span className="text-2xl font-black text-slate-800 tracking-tighter">{week.submissionPct}%</span>
                              {week.missingCount > 0 && <span className="text-xs font-black text-rose-500 uppercase">{week.missingCount} missing</span>}
                            </div>
                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={clsx("h-full transition-all duration-1000", getProgressColor(week.submissionPct))} 
                                style={{ width: `${week.submissionPct}%` }} 
                              />
                            </div>
                          </div>

                          <button 
                            onClick={() => toggleWeek(week.id)}
                            className={clsx(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                              expandedWeeks[week.id] ? "bg-brand-600 text-white shadow-lg shadow-brand-200" : "bg-slate-50 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                            )}
                          >
                            {expandedWeeks[week.id] ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                          </button>
                        </div>
                      </div>

                      {/* STUDENT DRILLDOWN */}
                      {expandedWeeks[week.id] && (
                        <div className="bg-slate-50/50 border-t border-slate-100 p-6 md:p-8 animate-in slide-in-from-top-4 duration-500">
                          <h5 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <Users size={16} className="text-rose-500" />
                            Missing Submissions ({week.missingCount})
                          </h5>
                          
                          {week.missingStudents.length === 0 ? (
                            <div className="bg-emerald-50 text-emerald-700 p-8 rounded-[1.5rem] border border-dashed border-emerald-200 text-center">
                              <p className="text-sm font-black uppercase">100% Completion Achievement!</p>
                              <p className="text-[10px] font-bold opacity-70 mt-1">Excellent! All students have completed their work for this topic.</p>
                            </div>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                              {week.missingStudents.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-brand-200 transition-all">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-sm font-black text-slate-400">
                                      {s.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-800 tracking-tight">{s.name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Roll: {s.roll_no} • {s.contact || 'No Contact'}
                                      </p>
                                    </div>
                                  </div>
                                  <span className={clsx(
                                    "text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest",
                                    s.reason?.includes('Homework') ? "text-amber-600 bg-amber-50" :
                                    s.reason?.includes('Notebook') ? "text-rose-600 bg-rose-50" :
                                    "text-slate-600 bg-slate-50"
                                  )}>
                                    {s.reason || 'Pending'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PRINCIPAL OBSERVATIONS (1/3 Width) */}
        <div className="space-y-6">
          <SectionHeader title="Principal Observations" subtitle="Admin evaluation results" />
          <div className="space-y-4">
            {observations?.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-10 text-center border border-slate-100 shadow-sm">
                <Award size={48} className="text-slate-100 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No evaluation records</p>
              </div>
            ) : (
              observations?.map((obs) => (
                <div key={obs.id} className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Evaluation Date</p>
                        <h5 className="text-sm font-black text-slate-800">{new Date(obs.date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</h5>
                      </div>
                      <div className={clsx(
                        "w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg",
                        obs.pct >= 80 ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-brand-600 text-white shadow-blue-200"
                      )}>
                        {obs.pct}%
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(obs.breakdown).map(([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{key}</span>
                            <span className="text-xs font-black text-slate-800">{val}/10</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={clsx("h-full transition-all duration-1000", obs.pct >= 80 ? "bg-emerald-500" : "bg-brand-500")} style={{ width: `${(val / 10) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
            <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-4">
               ℹ️ Data is read-only. Awarded by Admin.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
