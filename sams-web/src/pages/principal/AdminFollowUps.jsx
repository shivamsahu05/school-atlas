import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Bell, BookOpen, AlertTriangle, CheckCircle, AlertCircle, Eye, Plus, Send, Trash2,
  Edit2, Save, XCircle, Download, Calendar, IndianRupee, MessageCircle, Clock, BarChart2,
  ChevronDown, GraduationCap, LayoutGrid, Users, RotateCcw, Search, ChevronRight,
  ChevronLeft, List, Zap, UserPlus, ClipboardList
} from 'lucide-react'
import {
  StatCard, SectionHeader, Tabs, StatusBadge, ProgressBar,
  Modal, FilterChips, DataTable, FormInput, SelectDropdown
} from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { HOMEWORK, WEEKLY_HOMEWORK, WEEKLY_NOTEBOOK, SYLLABUS_ITEMS, WEEKLY_SYLLABUS, OBSERVATIONS as INIT_OBS, TEACHER_PERFORMANCE, OBS_CHART, LEAVES as INIT_LEAVES, ALL_TEACHERS as INIT_TEACHERS, STUDENTS as INIT_STUDENTS, WEEKLY_SCHEDULE, MARKS_OVERVIEW } from '../../data/dummyData'
import { ALL_CLASSES, DEPARTMENTS, SUBJECTS, PERFORMANCE_WEIGHTS, OBSERVATION_CRITERIA } from '../../data/constants'
import clsx from 'clsx'

export default function AdminFollowUps() {
  const [tab, setTab] = useState('homework')
  const [selectedHW, setSelectedHW] = useState(null)
  
  const [hwFilters, setHwFilters] = useState({ month: 'All', week: 'All', class: 'All', section: 'All', subject: 'All' })
  const [nbFilters, setNbFilters] = useState({ month: 'All', week: 'All', class: 'All', section: 'All', subject: 'All' })
  
  const resetFilters = () => {
    const defaultFilters = { month: 'All', week: 'All', class: 'All', section: 'All', subject: 'All' }
    if (tab === 'homework') setHwFilters(defaultFilters)
    else setNbFilters(defaultFilters)
  }

  const pendingHWList = useMemo(() => {
    return WEEKLY_HOMEWORK.filter(hw => {
      const classMatch = hwFilters.class === 'All' || hw.class.startsWith(hwFilters.class);
      const sectionMatch = hwFilters.section === 'All' || hw.class.endsWith(`-${hwFilters.section}`);
      const subjectMatch = hwFilters.subject === 'All' || hw.subject === hwFilters.subject;
      const monthMatch = hwFilters.month === 'All' || hw.month === hwFilters.month;
      const weekMatch = hwFilters.week === 'All' || hw.week === hwFilters.week;
      return hw.defaulters.length > 0 && classMatch && sectionMatch && subjectMatch && monthMatch && weekMatch;
    });
  }, [hwFilters])

  const pendingNBList = useMemo(() => {
    return WEEKLY_NOTEBOOK.filter(nb => {
      const classMatch = nbFilters.class === 'All' || nb.class.startsWith(nbFilters.class);
      const sectionMatch = nbFilters.section === 'All' || nb.class.endsWith(`-${nbFilters.section}`);
      const subjectMatch = nbFilters.subject === 'All' || nb.subject === nbFilters.subject;
      const monthMatch = nbFilters.month === 'All' || nb.month === nbFilters.month;
      const weekMatch = nbFilters.week === 'All' || nb.week === nbFilters.week;
      return nb.defaulters.length > 0 && classMatch && sectionMatch && subjectMatch && monthMatch && weekMatch;
    });
  }, [nbFilters])

  const flattenedDefaulters = useMemo(() => {
    const list = tab === 'homework' ? pendingHWList : pendingNBList
    const filters = tab === 'homework' ? hwFilters : nbFilters
    
    let ds = [];
    list.forEach(item => {
      item.defaulters.forEach(name => {
        const studentInfo = INIT_STUDENTS.find(s => s.name === name) || {};
        ds.push({
          id: `${item.id}-${name}`,
          name,
          itemId: item.id,
          month: item.month,
          week: item.week,
          subject: item.subject,
          className: item.class,
          teacher: item.teacher,
          ...studentInfo
        });
      });
    });
    return ds;
  }, [pendingHWList, pendingNBList, tab, hwFilters, nbFilters]);

  const totalHWDefaulters = useMemo(() => {
    let count = 0;
    WEEKLY_HOMEWORK.forEach(hw => {
      count += hw.defaulters.length;
    });
    return count;
  }, []);

  const totalNBDefaulters = useMemo(() => {
    let count = 0;
    WEEKLY_NOTEBOOK.forEach(nb => {
      count += nb.defaulters.length;
    });
    return count;
  }, []);

  const pendingSyl = WEEKLY_SYLLABUS.filter(s => s.pct < 100).slice(0, 4)

  const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March']
  const WEEKS = ['1', '2', '3', '4']
  const SECTIONS = ['A', 'B', 'C', 'D']

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Low Submission HW" value={pendingHWList.length} icon={AlertTriangle} color="amber" />
        <StatCard title="Pending Notebooks" value={pendingNBList.length} icon={ClipboardList} color="teal" />
        <StatCard title="Syllabus Lags" value={pendingSyl.length} icon={BookOpen} color="red" />
      </div>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <SectionHeader title="Follow-up Items" />
          <Tabs tabs={[
            { value: 'homework', label: `Homework (${totalHWDefaulters})` }, 
            { value: 'notebook', label: `Notebooks (${totalNBDefaulters})` },
            { value: 'syllabus', label: `Syllabus (${pendingSyl.length})` }
          ]}
            active={tab} onChange={setTab} />
        </div>

        {(tab === 'homework' || tab === 'notebook') && (
          <div className="space-y-4">
            {/* Filtering Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <SelectDropdown
                label="Class"
                options={['All', ...new Set(ALL_CLASSES.filter(c => c !== 'All').map(c => c.split('-')[0]))]} 
                value={tab === 'homework' ? hwFilters.class : nbFilters.class}
                onChange={(e) => {
                  const val = e.target.value
                  if (tab === 'homework') setHwFilters(f => ({ ...f, class: val }))
                  else setNbFilters(f => ({ ...f, class: val }))
                }}
              />
               <SelectDropdown
                label="Section"
                options={['All', ...SECTIONS]}
                value={tab === 'homework' ? hwFilters.section : nbFilters.section}
                onChange={(e) => {
                  const val = e.target.value
                  if (tab === 'homework') setHwFilters(f => ({ ...f, section: val }))
                  else setNbFilters(f => ({ ...f, section: val }))
                }}
              />
              <SelectDropdown
                label="Subject"
                options={['All', ...SUBJECTS]}
                value={tab === 'homework' ? hwFilters.subject : nbFilters.subject}
                onChange={(e) => {
                  const val = e.target.value
                  if (tab === 'homework') setHwFilters(f => ({ ...f, subject: val }))
                  else setNbFilters(f => ({ ...f, subject: val }))
                }}
              />
              <SelectDropdown
                label="Month"
                options={MONTHS}
                value={tab === 'homework' ? hwFilters.month : nbFilters.month}
                onChange={(e) => {
                  const val = e.target.value
                  if (tab === 'homework') setHwFilters(f => ({ ...f, month: val }))
                  else setNbFilters(f => ({ ...f, month: val }))
                }}
              />
              <SelectDropdown
                label="Week"
                options={['All', ...WEEKS]}
                value={tab === 'homework' ? hwFilters.week : nbFilters.week}
                onChange={(e) => {
                  const val = e.target.value
                  if (tab === 'homework') setHwFilters(f => ({ ...f, week: val }))
                  else setNbFilters(f => ({ ...f, week: val }))
                }}
              />
              <div className="flex items-end">
                <button 
                  onClick={resetFilters}
                  className="w-full py-2 px-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold hover:bg-slate-50 hover:text-brand-600 transition-all flex items-center justify-center gap-1.5 shadow-sm h-[38px]"
                >
                  <RotateCcw size={14} />
                  Reset Filters
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {flattenedDefaulters.length > 0 ? flattenedDefaulters.map((student, idx) => (
                <div key={student.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors bg-white shadow-sm overflow-hidden relative">
                  <div className={clsx(
                    "absolute top-0 left-0 w-1 h-full",
                    tab === 'homework' ? "bg-amber-400" : "bg-teal-400"
                  )} />
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0",
                    tab === 'homework' ? "bg-amber-50 text-amber-600" : "bg-teal-50 text-teal-600"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-800">{student.name}</h4>
                        <div className="text-[11px] text-slate-500 mt-1 flex gap-3 flex-wrap">
                          <span><strong className="text-slate-400">Roll No:</strong> {student.rollNo || 'N/A'}</span>
                          <span><strong className="text-slate-400">Email:</strong> {student.email || 'N/A'}</span>
                          <span><strong className="text-slate-400">Mobile:</strong> {student.mobile || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status="Pending" />
                        <Link 
                          to={`/admin/completion-report?class=${student.className.split('-')[0].replace('Grade ', '')}&subject=${student.subject}`}
                          className="text-[10px] font-bold text-brand-600 hover:text-brand-700 underline"
                        >
                          View Full History
                        </Link>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100/60 flex items-center gap-2 flex-wrap text-sm">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">{student.month} W{student.week}</span>
                      <span className="text-[11px] text-slate-500">{student.className}</span>
                      <span className="text-[11px] text-slate-300">&bull;</span>
                      <span className="text-[11px] font-medium text-slate-700">{student.subject}</span>
                      <span className="text-[11px] text-slate-300">&bull;</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{tab === 'homework' ? 'Homework Issue' : 'Notebook Check'}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-slate-400 text-sm">No {tab} defaulters found for this filter.</div>
              )}
            </div>
          </div>
        )}

        {tab === 'syllabus' && (
          <div className="space-y-3">
            {pendingSyl.length > 0 ? pendingSyl.map(item => (
              <div key={item.id || item.week + item.teacher + item.class} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">Week {item.week} · {item.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Teacher: {item.teacher} · {item.class} · {item.completed}/{item.total} Topics ({item.pct}%)</p>
                </div>
                <StatusBadge status="Pending" />
              </div>
            )) : (
              <div className="py-12 text-center text-slate-400 text-sm">No pending syllabus weekly items.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}