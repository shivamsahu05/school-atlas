import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SectionHeader } from '../ui';
import { 
  TrendingUp, Clock, AlertCircle, PieChart as PieIcon, 
  Loader2, PlusCircle, Check, Filter, Search
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { scheduleApi, syllabusApi } from '../../api';
import clsx from 'clsx';

const COLORS = ['#119e6fff', '#ef4444']; // Emerald-500 (Green) and Red-500 (Red)
const normalize = (value = '') => String(value || '').trim().toLowerCase();

export default function IntelligenceInsights({ isAllView, filterTeacherId }) {
  const [loading, setLoading] = useState(true);
  const [syllabusData, setSyllabusData] = useState([]);
  
  // Filters
  const [assignments, setAssignments] = useState([]);
  const [allViewAssignments, setAllViewAssignments] = useState([]);
  const [selClassId, setSelClassId] = useState('All');
  const [selSectionId, setSelSectionId] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');

  const fetchAssignments = useCallback(async () => {
    if (isAllView) return; // Don't fetch teacher assignments in admin view
    try {
      const res = await scheduleApi.getMyAssignments();
      const raw = res?.data?.assignments || [];
      const grouped = [];
      raw.forEach(a => {
        let cls = grouped.find(c => c.classId === a.classId);
        if (!cls) { cls = { classId: a.classId, className: a.className, sections: [] }; grouped.push(cls); }
        let sec = cls.sections.find(s => s.sectionId === a.sectionId);
        if (!sec) { sec = { sectionId: a.sectionId, sectionName: a.sectionName, subjects: [] }; cls.sections.push(sec); }
        if (!sec.subjects.find(s => s.subjectId === a.subjectId)) { sec.subjects.push({ subjectId: a.subjectId, subjectName: a.subjectName }); }
      });
      setAssignments(grouped);
    } catch (err) { console.error(err); }
  }, [isAllView]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all syllabus data. We do this for both Teacher and Admin.
      // Admin gets all, Teacher gets theirs (handled by API endpoint)
      const res = await syllabusApi.getPlan(isAllView ? { class_id: null, section_id: null, subject_id: null, month: null } : {});
      setSyllabusData(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) {
      console.error("Insights Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchData();
  }, [fetchAssignments]);

  useEffect(() => {
    const handleSync = () => fetchData();
    window.addEventListener('syllabus-updated', handleSync);
    window.addEventListener('dashboard-refresh', handleSync);
    return () => {
      window.removeEventListener('syllabus-updated', handleSync);
      window.removeEventListener('dashboard-refresh', handleSync);
    };
  }, []);

  useEffect(() => {
    if (!isAllView) return;
    if (!syllabusData || syllabusData.length === 0) {
      setAllViewAssignments([]);
      return;
    }

    const sourceData = (filterTeacherId && filterTeacherId !== 'All')
      ? syllabusData.filter(r => Number(r.teacher_id) === Number(filterTeacherId))
      : syllabusData;

    const grouped = [];
    sourceData.forEach(a => {
      if (!a.class_id) return;
      let cls = grouped.find(c => c.classId === Number(a.class_id));
      if (!cls) {
        const className = a.class || a.class_number || String(a.class_id);
        cls = { classId: Number(a.class_id), className, sections: [] };
        grouped.push(cls);
      }
      if (!a.section_id) return;
      let sec = cls.sections.find(s => s.sectionId === Number(a.section_id));
      if (!sec) {
        sec = { sectionId: Number(a.section_id), sectionName: String(a.section || '').trim(), subjects: [] };
        cls.sections.push(sec);
      }
      if (a.subject_id && !sec.subjects.find(s => s.subjectId === Number(a.subject_id))) {
        sec.subjects.push({ subjectId: Number(a.subject_id), subjectName: a.subject_name || a.subject || String(a.subject_id) });
      }
    });
    grouped.sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }));
    setAllViewAssignments(grouped);
    setSelClassId('All');
    setSelSectionId('All');
    setSelectedSubject('All');
  }, [filterTeacherId, syllabusData, isAllView]);

  const effectiveAssignments = isAllView ? allViewAssignments : assignments;

  const shouldShowSection = useMemo(() => {
    if (!isAllView) return true;
    if (selClassId === 'All' || selectedSubject === 'All') return false;
    const filtered = syllabusData.filter(item => 
      Number(item.class_id) === Number(selClassId) && 
      Number(item.subject_id) === Number(selectedSubject)
    );
    const uniqueTeachers = new Set(filtered.map(item => item.teacher_id).filter(id => id));
    return uniqueTeachers.size > 1;
  }, [isAllView, selClassId, selectedSubject, syllabusData]);

  const filteredStats = useMemo(() => {
    const selectedClassData = effectiveAssignments.find(c => String(c.classId) === String(selClassId));
    const selClassName = selectedClassData?.className || (selClassId === 'All' ? 'All' : '');
    const selectedSectionData = selectedClassData?.sections.find(s => String(s.sectionId) === String(selSectionId));
    const selSectionName = selectedSectionData?.sectionName || (selSectionId === 'All' ? 'All' : '');
    const selectedSubjectData = selectedSectionData?.subjects.find(s => String(s.subjectId) === String(selectedSubject));
    const selSubjectName = selectedSubjectData?.subjectName || (selectedSubject === 'All' ? 'All' : '');

    const filtered = syllabusData.filter(item => {
      const itemClass = item.class || item.class_number;
      const itemSection = item.section;
      const itemSubject = item.subject || item.subject_name;
      
      const classMatch = selClassId === "All" || normalize(itemClass).includes(normalize(selClassName)) || Number(item.class_id) === Number(selClassId);
      const sectionMatch = selSectionId === "All" || normalize(itemSection).includes(normalize(selSectionName)) || Number(item.section_id) === Number(selSectionId);
      const subjectMatch = selectedSubject === "All" || normalize(itemSubject).includes(normalize(selSubjectName)) || Number(item.subject_id) === Number(selectedSubject);
      const teacherMatch = !isAllView || !filterTeacherId || filterTeacherId === 'All' || Number(item.teacher_id) === Number(filterTeacherId);
      
      return classMatch && sectionMatch && subjectMatch && teacherMatch;
    });

    let totalExtra = 0;
    let totalBase = 0;
    let totalCompleted = 0;

    filtered.forEach(item => {
      const extra = Number(item.periods_planned || 0);
      const base = Number(item.periods || 0);
      
      totalExtra += extra;
      totalBase += base;
      if (String(item.status || '').toLowerCase() === 'completed') {
        totalCompleted += base;
      }
    });

    const totalPending = totalBase - totalCompleted;
    const completionRate = totalBase > 0 ? Math.round((totalCompleted / totalBase) * 100) : (filtered.length > 0 && filtered.every(f => normalize(f.status) === 'completed') ? 100 : 0);

    return {
      totalExtra,
      completionRate,
      chartData: [
        { name: 'Completed', value: totalCompleted },
        { name: 'Pending', value: totalPending }
      ],
      hasData: filtered.length > 0
    };
  }, [syllabusData, selClassId, selSectionId, selectedSubject, effectiveAssignments, filterTeacherId, isAllView]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-bold text-[11px] uppercase tracking-widest text-slate-400">Fetching Academic Metadata...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* SAMS ERP Filter Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-wrap gap-5 items-end shadow-sm">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1 flex items-center gap-1.5">
            Class Level
          </label>
          <select value={selClassId} onChange={(e) => { setSelClassId(e.target.value === 'All' ? 'All' : Number(e.target.value)); setSelSectionId('All'); setSelectedSubject('All'); }} className="w-full border border-slate-200 rounded-md px-3 py-2.5 bg-white text-xs font-semibold outline-none focus:border-blue-500 transition-colors cursor-pointer">
            <option value="All">All Classes</option>
            {effectiveAssignments.map(c => {
              const displayName = c.className?.startsWith('Class') ? c.className : `Class ${c.className}`;
              return <option key={c.classId} value={c.classId}>{displayName}</option>;
            })}
          </select>
        </div>
        {(isAllView && shouldShowSection) && (
          <div className="flex-1 min-w-[150px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Section</label>
            <select value={selSectionId} onChange={(e) => { setSelSectionId(e.target.value === 'All' ? 'All' : Number(e.target.value)); setSelectedSubject('All'); }} disabled={selClassId === 'All' && !isAllView} className="w-full border border-slate-200 rounded-md px-3 py-2.5 bg-white text-xs font-semibold outline-none focus:border-blue-500 disabled:bg-slate-50 transition-colors cursor-pointer">
              <option value="All">All Sections</option>
              {(effectiveAssignments.find(c => String(c.classId) === String(selClassId))?.sections || []).map(s => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)}
            </select>
          </div>
        )}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Subject Area</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={selClassId === 'All'} className="w-full border border-slate-200 rounded-md px-3 py-2.5 bg-white text-xs font-semibold outline-none focus:border-blue-500 disabled:bg-slate-50 transition-colors cursor-pointer">
            <option value="All">All Subjects</option>
            {(isAllView && selSectionId !== 'All'
              ? effectiveAssignments.find(c => String(c.classId) === String(selClassId))?.sections.find(s => String(s.sectionId) === String(selSectionId))?.subjects || []
              : (effectiveAssignments.find(c => String(c.classId) === String(selClassId))?.sections || []).flatMap(sec => sec.subjects).filter((v, i, a) => a.findIndex(t => (t.subjectId === v.subjectId)) === i)
            ).map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
          </select>
        </div>
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Overall Health Pie Chart (The Circle) */}
        <div className="bg-white p-6 md:p-10 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center justify-center relative group transition-all duration-300 hover:shadow-xl hover:shadow-emerald-50">
           <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
             <div className="flex items-center gap-4">
              <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-100">
                <PieIcon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Overall Coverage Health</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {filteredStats.chartData[0].value} of {filteredStats.chartData[0].value + filteredStats.chartData[1].value} periods successfully completed
                </p>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 text-center">
                <p className="text-xl font-black text-slate-800 leading-none mb-1">{filteredStats.chartData[0].value + filteredStats.chartData[1].value}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Periods</p>
              </div>
              <div className="bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100 text-center">
                <p className="text-xl font-black text-emerald-600 leading-none mb-1">{filteredStats.chartData[0].value}</p>
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Completed</p>
              </div>
              <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 text-center">
                <p className="text-xl font-black text-amber-600 leading-none mb-1">{filteredStats.chartData[1].value}</p>
                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Pending</p>
              </div>
            </div>
          </div>

          <div className="w-full h-[350px] relative flex items-center justify-center">
            {filteredStats.hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredStats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={115}
                    paddingAngle={10}
                    dataKey="value"
                    animationDuration={1500}
                    animationBegin={0}
                  >
                    {filteredStats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '25px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-slate-200 py-20">
                <Search size={64} strokeWidth={1} />
                <p className="text-[11px] font-black uppercase tracking-[0.3em]">No Data for Selection</p>
              </div>
            )}
            
            {filteredStats.hasData && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-18px]">
                <span className="text-5xl md:text-6xl font-black text-slate-800 leading-none tracking-tighter transition-all group-hover:scale-110">{filteredStats.completionRate}%</span>
                <span className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Syllabus Covered</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
