import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { 
  Clock, Users, Save, Loader2, Edit2, BookOpen, Check, X, Search, XCircle, ChevronDown, Book, ClipboardCheck, TrendingUp, BarChart3, Calendar, Filter, Trash2
} from 'lucide-react';
import { scheduleApi, syllabusApi } from '../../api';

const normalize = (value = '') => String(value || '').trim().toLowerCase();
const safeDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB");
};

export default function WeeklySyllabusPlan({ isAllView = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [selClassId, setSelClassId] = useState('');
  const [selSectionId, setSelSectionId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterWeek, setFilterWeek] = useState('All');

  const [syllabusMetadata, setSyllabusMetadata] = useState({ months: [], syllabus: [] });
  const [syllabusData, setSyllabusData] = useState([]); 
  const [weeklyData, setWeeklyData] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const [studentDataMap, setStudentDataMap] = useState({});

  const init = useCallback(async () => {
    try {
      const res = await scheduleApi.getMyAssignments();
      const raw = res?.data?.assignments || [];
      const grouped = [];
      raw.forEach(a => {
        let cls = grouped.find(c => c.classId === a.classId);
        if (!cls) { cls = { classId: a.classId, className: a.className, sections: [] }; grouped.push(cls); }
        let sec = cls.sections.find(s => s.sectionId === a.sectionId);
        if (!sec) { sec = { sectionId: a.sectionId, sectionName: String(a.sectionName || '').trim(), subjects: [] }; cls.sections.push(sec); }
        if (!sec.subjects.find(s => s.subjectId === a.subjectId)) { sec.subjects.push({ subjectId: a.subjectId, subjectName: a.subjectName }); }
      });
      setAssignments(grouped);

      const qClassId = searchParams.get('classId');
      const qSectionId = searchParams.get('sectionId');
      const qSubjectId = searchParams.get('subjectId');
      const qWeek = searchParams.get('week');
      const qSyllabusId = searchParams.get('syllabusId');
      const qAutoEdit = searchParams.get('autoEdit');

      if (qClassId && qSectionId && qSubjectId) {
        setSelClassId(Number(qClassId));
        setSelSectionId(Number(qSectionId));
        setSelectedSubject(String(qSubjectId));
        if (qWeek) setFilterWeek(qWeek);
        if (qAutoEdit === 'true') setEditingId(Number(qSyllabusId));
      } else if (!isAllView && grouped.length > 0) {
        setSelClassId('');
        setSelSectionId('');
        setSelectedSubject('');
      } else if (isAllView) {
        setSelClassId('All');
        setSelSectionId('All');
        setSelectedSubject('All');
        setFilterMonth('All');
        setFilterWeek('All');
      }
    } catch (err) { console.error(err); }
  }, [searchParams, isAllView]);

  useEffect(() => { init() }, [init]);

  useEffect(() => {
    if (selClassId && selSectionId && selectedSubject && selClassId !== 'All' && selSectionId !== 'All' && selectedSubject !== 'All') {
      syllabusApi.getMetadata({ class_id: selClassId, section_id: selSectionId, subject_id: selectedSubject }).then(res => {
        const meta = res?.data || { months: [], syllabus: [] };
        setSyllabusMetadata(meta);
        if (!isAllView && meta.months?.length > 0 && filterMonth === 'All') {
          const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
          setFilterMonth(meta.months.includes(currentMonthName) ? currentMonthName : meta.months[0]);
        }
      });
    }
  }, [selClassId, selSectionId, selectedSubject, isAllView]);

  const loadPlan = async () => {
    if (!isAllView && (!selClassId || !selSectionId || !selectedSubject)) return;
    setLoading(true); setError(null);
    try {
      const params = { 
        class_id: selClassId === 'All' ? null : selClassId, 
        section_id: selSectionId === 'All' ? null : selSectionId, 
        subject_id: selectedSubject === 'All' ? null : selectedSubject, 
        month: filterMonth === 'All' ? null : filterMonth 
      };
      const res = await syllabusApi.getPlan(params);
      setSyllabusData(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) { setError(err.message); setSyllabusData([]); } finally { setLoading(false); }
  };

  useEffect(() => { loadPlan() }, [selClassId, selSectionId, selectedSubject, filterMonth, isAllView]);

  useEffect(() => {
    const handleSync = () => loadPlan();
    window.addEventListener('syllabus-updated', handleSync);
    return () => window.removeEventListener('syllabus-updated', handleSync);
  }, [loadPlan]);

  useEffect(() => {
    if (!syllabusData) return;
    const selectedClassData = assignments.find(c => String(c.classId) === String(selClassId));
    const selClassName = selectedClassData?.className || (selClassId === 'All' ? 'All' : 'All');
    const selectedSectionData = selectedClassData?.sections.find(s => String(s.sectionId) === String(selSectionId));
    const selSectionName = selectedSectionData?.sectionName || (selSectionId === 'All' ? 'All' : '');
    const selectedSubjectData = selectedSectionData?.subjects.find(s => String(s.subjectId) === String(selectedSubject));
    const selSubjectName = selectedSubjectData?.subjectName || (selectedSubject === 'All' ? 'All' : '');

    const formatted = syllabusData.filter(item => {
      // Use IDs for precise matching
      const classMatch = selClassId === "All" || Number(item.class_id) === Number(selClassId);
      const sectionMatch = selSectionId === "All" || Number(item.section_id) === Number(selSectionId);
      const subjectMatch = selectedSubject === "All" || Number(item.subject_id) === Number(selectedSubject);
      
      // Month and Week matching (using normalize helper)
      const monthMatch = filterMonth === "All" || normalize(item.month) === normalize(filterMonth);
      const weekMatch = filterWeek === "All" || normalize(item.week) === normalize(filterWeek);
      
      return classMatch && sectionMatch && subjectMatch && monthMatch && weekMatch;
    }).map(row => {
      const rawStatus = normalize(row.status);
      let status = 'pending';
      if (rawStatus === 'completed') status = 'completed';
      else if (rawStatus === 'in_progress' || rawStatus === 'in progress') status = 'in progress';
      else if (rawStatus === 'not started' || rawStatus === 'not_started') status = 'not started';
      else status = 'pending';

      return {
        ...row,
        topic: row.topic || row.chapter_topic || 'Untitled Topic',
        status,
        db_periods: Number(row.periods || 0),
        periods_to_add: Number(row.periods_planned || 0),
        learningOutcome: row.learning_outcome || '',
        homeworkChecked: row.homework_checked || 'No',
        notebookChecked: row.notebook_checked || 'No',
        class_understanding_level: row.class_understanding_level || '',
        is_completed: Number(row.is_completed || 0),
        subject_name: row.subjectName || row.subject_name || row.subject // Fallback
      };
    });
    setWeeklyData(formatted);
  }, [syllabusData, selClassId, selSectionId, selectedSubject, filterMonth, filterWeek, assignments, isAllView]);

  const handleFieldChange = (id, field, value) => {
    setWeeklyData(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (field === 'status') {
        const val = normalize(value);
        return { ...r, status: val, class_understanding_level: val === 'completed' ? r.class_understanding_level : null };
      }
      return { ...r, [field]: value };
    }));
  };

  const handleSaveRow = async (r) => {
    try {
      if (r.status === 'completed' && !r.class_understanding_level) {
        alert(`❌ Select learning status for: ${r.topic}`);
        return;
      }
      setLoading(true);
      
      const payload = [{
        syllabus_id: r.id,
        class_number: r.class,
        section: r.section,
        subject_id: r.subject_id,
        month: r.month,
        week: r.week,
        topic: r.topic,
        periods_planned: Number(r.periods_to_add || 0),
        status: r.status,
        learning_outcome: r.learningOutcome,
        notebook_checked: r.notebookChecked,
        homework_checked: r.homeworkChecked,
        class_understanding_level: r.class_understanding_level,
        is_completed: r.status === 'completed' ? 1 : 0,
        students_status: studentDataMap[r.id] ? studentDataMap[r.id].map(s => ({
          student_id: s.id,
          homework_status: s.homework_done ? 'COMPLETED' : 'PENDING',
          homework: !!s.homework_done,
          notebook: !!s.notebook_done,
          lo_status: 'Meeting'
        })) : undefined
      }];

      await scheduleApi.saveMicroSchedule(payload);
      await loadPlan();
      setEditingId(null);
      setStudentDataMap(prev => {
        const next = { ...prev };
        delete next[r.id];
        return next;
      });
      alert("✅ Row Saved Successfully");
      ['syllabus-updated', 'lo-updated', 'insights-refresh', 'analytics-refresh', 'dashboard-refresh'].forEach(e => window.dispatchEvent(new Event(e)));
    } catch (e) { alert("❌ Save Failed: " + (e.response?.data?.message || e.message)); }
    finally { setLoading(false); }
  };

  const handleDelete = async (row) => {
    const confirmMsg = `Are you sure you want to delete this topic?\n\nClass: ${row.class} - Section: ${row.section}\nWeek: ${row.week}\nTopic: ${row.topic}`;
    if (window.confirm(confirmMsg)) {
      try {
        setLoading(true);
        await syllabusApi.delete(row.id);
        alert("✅ Deleted Successfully");
        await loadPlan();
      } catch (err) {
        alert("❌ Delete Failed: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);
      const incomplete = weeklyData.find(r => r.status === 'completed' && !r.class_understanding_level);
      if (incomplete) { alert(`❌ Select learning status for: ${incomplete.topic}`); setLoading(false); return; }
      
      const payload = weeklyData.map(r => ({
        syllabus_id: r.id,
        class_number: r.class,
        section: r.section,
        subject_id: r.subject_id,
        month: r.month,
        week: r.week,
        topic: r.topic,
        periods_planned: Number(r.periods_to_add || 0),
        status: r.status,
        learning_outcome: r.learningOutcome,
        notebook_checked: r.notebookChecked,
        homework_checked: r.homeworkChecked,
        class_understanding_level: r.class_understanding_level,
        is_completed: r.status === 'completed' ? 1 : 0,
        students_status: studentDataMap[r.id] ? studentDataMap[r.id].map(s => ({
          student_id: s.id,
          homework_status: s.homework_done ? 'COMPLETED' : 'PENDING',
          homework: !!s.homework_done,
          notebook: !!s.notebook_done,
          lo_status: 'Meeting'
        })) : undefined
      }));

      await scheduleApi.saveMicroSchedule(payload);
      await loadPlan();
      setEditingId(null);
      setStudentDataMap({});
      alert("✅ All Changes Saved Successfully");
      ['syllabus-updated', 'lo-updated', 'insights-refresh', 'analytics-refresh', 'dashboard-refresh'].forEach(e => window.dispatchEvent(new Event(e)));
    } catch (e) { alert("❌ Save Failed: " + (e.response?.data?.message || e.message)); }
    finally { setLoading(false); }
  };

  const openStudentManager = async (topic) => {
    setSelectedTopic(topic); 
    setIsModalOpen(true); 
    
    if (studentDataMap[topic.id]) {
      setStudentList(studentDataMap[topic.id]);
      return;
    }

    setModalLoading(true);
    try {
      const targetClassId = topic.class_id || selClassId;
      const targetSectionId = topic.section_id || selSectionId;
      const res = await scheduleApi.getItemStudents(topic.id, targetClassId, targetSectionId);
      
      setStudentList((res || []).map(s => ({
        ...s,
        notebook_done: s.notebook !== undefined ? Number(s.notebook) : 0,
        homework_done: s.done !== undefined ? Number(s.done) : 0
      })));
    } catch (err) { alert('Failed to load students'); } finally { setModalLoading(false); }
  };

  const saveStudentProgress = () => {
    if (!selectedTopic) return;
    setStudentDataMap(prev => ({
      ...prev,
      [selectedTopic.id]: studentList
    }));
    setIsModalOpen(false);
  };

  const toggleStudentStatus = (studentId, field) => {
    if (isAllView) return;
    setStudentList(prev => prev.map(s => s.id === studentId ? { ...s, [field]: s[field] ? 0 : 1 } : s));
  };

  const progressStats = useMemo(() => {
    if (!weeklyData || weeklyData.length === 0) return { percent: 0, completed: 0, total: 0 };
    const total = weeklyData.reduce((acc, r) => acc + (r.db_periods || 0), 0);
    const completed = weeklyData.reduce((acc, r) => acc + (r.status === 'completed' ? (r.db_periods || 0) : 0), 0);
    
    if (total === 0 && weeklyData.length > 0) {
      const totalTopics = weeklyData.length;
      const completedTopics = weeklyData.filter(r => r.status === 'completed').length;
      return { 
        percent: Math.round((completedTopics / totalTopics) * 100), 
        completed: completedTopics, 
        total: totalTopics,
        unit: 'topics'
      };
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { percent, completed, total, unit: 'periods' };
  }, [weeklyData]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-wrap gap-5 items-end shadow-sm">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Class Level</label>
          <select value={selClassId} onChange={(e) => { setSelClassId(e.target.value === 'All' ? 'All' : Number(e.target.value)); setSelSectionId('All'); setSelectedSubject('All'); }} className="w-full border border-slate-200 rounded-md px-3 py-2.5 bg-white text-xs font-semibold outline-none focus:border-blue-500 transition-colors cursor-pointer">
            {isAllView && <option value="All">All Classes</option>}
            {!isAllView && <option value="">Select class…</option>}
            {assignments.map(c => <option key={c.classId} value={c.classId}>Class {c.className}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Section</label>
          <select value={selSectionId} onChange={(e) => { setSelSectionId(e.target.value === 'All' ? 'All' : Number(e.target.value)); setSelectedSubject('All'); }} disabled={!isAllView && !selClassId} className="w-full border border-slate-200 rounded-md px-3 py-2.5 bg-white text-xs font-semibold outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors cursor-pointer">
            {isAllView && <option value="All">All Sections</option>}
            {!isAllView && <option value="">Select section…</option>}
            {(assignments.find(c => String(c.classId) === String(selClassId))?.sections || [])
              .filter(s => s.sectionName && s.sectionName.trim() !== '')
              .map(s => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Subject Area</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!isAllView && !selSectionId} className="w-full border border-slate-200 rounded-md px-3 py-2.5 bg-white text-xs font-semibold outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 transition-colors cursor-pointer">
            {isAllView && <option value="All">All Subjects</option>}
            {!isAllView && <option value="">Select subject…</option>}
            {(assignments.find(c => String(c.classId) === String(selClassId))?.sections.find(s => String(s.sectionId) === String(selSectionId))?.subjects || []).map(s => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Month</label>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2.5 bg-white text-xs font-semibold outline-none focus:border-blue-500 transition-colors cursor-pointer">
            <option value="All">All Months</option>
            {syllabusMetadata.months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Week</label>
          <select value={filterWeek} onChange={(e) => setFilterWeek(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2.5 bg-white text-xs font-semibold outline-none focus:border-blue-500 transition-colors cursor-pointer">
            <option value="All">All Weeks</option>
            <option value="week 1">Week 1</option>
            <option value="week 2">Week 2</option>
            <option value="week 3">Week 3</option>
            <option value="week 4">Week 4</option>
            <option value="week 5">Week 5</option>
          </select>
        </div>
      </div>

      {isAllView && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shadow-sm border border-blue-100">
                  <BarChart3 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Overall Weekly Complete Syllabus Coverage</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {weeklyData.length === 0 ? "No data selected for this week" : (
                      <span className="flex items-center gap-1">
                        <Check size={10} className="text-emerald-500" />
                        {progressStats.completed} of {progressStats.total} {progressStats.unit} successfully completed
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2 text-right">
              <span className="text-3xl font-black text-blue-600 tracking-tighter">{progressStats.percent}%</span>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter leading-none">Total</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Completion</span>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="h-3 w-full bg-slate-100 rounded-full border border-slate-200 overflow-hidden shadow-inner">
              <div 
                className={clsx(
                  "absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_15px_rgba(37,99,235,0.3)]",
                  progressStats.percent === 100 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-blue-600"
                )}
                style={{ width: `${progressStats.percent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 px-1">
              {[0, 25, 50, 75, 100].map(m => (
                <span key={m} className="text-[9px] font-bold text-slate-300">{m}%</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Syncing Academic Database...</span>
          </div>
        ) : (!selClassId || !selSectionId || !selectedSubject) && !isAllView ? (
          <div className="py-32 text-center space-y-4">
            <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mx-auto text-blue-200 border border-blue-100/50 shadow-sm">
              <Filter size={40} className="animate-pulse" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Initialization Required</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Please select a Class, Section and Subject from the filters above to view and manage your academic schedule.</p>
            </div>
          </div>
        ) : weeklyData.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 border border-slate-100 shadow-inner">
              <BookOpen size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">No micro schedules found</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjust filters to broaden your search results</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto scroller-sm scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse min-w-[1700px] table-fixed">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-48">Timeline / Week</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-72">Chapter/Topic</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-24 text-center">Periods</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-40">Status</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-32 text-center">Add Periods</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-48">Learning Status</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-80">Learning Outcome</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-36 text-center">Notebook Checked</th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-32 text-center">Homework</th>
                  {!isAllView && <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-44 text-center">Student Tracker</th>}
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-500 uppercase w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {weeklyData.map((row) => {
                  const isAlreadyComp = row.is_completed === 1;
                  const isViewOnly = (isAlreadyComp && editingId !== row.id) || isAllView;
                  const isEffectiveComp = isAlreadyComp && editingId !== row.id;

                  return (
                    <tr key={row.id} className={clsx(
                      "transition-all duration-300 border-l-[6px]", 
                      isEffectiveComp 
                        ? "bg-indigo-50/40 border-indigo-500/80 grayscale-[0.1]" 
                        : "bg-white border-transparent hover:bg-slate-50/30"
                    )}>
                      <td className="px-5 py-5 align-top">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">{row.month}</span>
                          <span className="text-sm font-bold text-slate-800 tracking-tight">{row.week}</span>
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap mt-0.5">
                            {safeDate(row.planned_start_date)} — {safeDate(row.planned_end_date)}
                          </span>
                          <span className="text-[9px] font-bold text-blue-600 uppercase mt-1">
                            {row.class && !row.class.toLowerCase().includes('class') ? `Class ${row.class}` : row.class} — {row.section}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-5 align-top">
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed break-words pr-4">{row.topic}</p>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{row.subject_name}</span>
                      </td>
                      <td className="px-5 py-5 align-top text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-sm font-bold text-slate-800">{row.db_periods}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Total</span>
                        </div>
                      </td>
                      <td className="px-5 py-5 align-top">
                        {isAllView ? (
                          <div className={clsx(
                            "inline-flex px-3 py-1.5 rounded-md text-[10px] font-bold uppercase border", 
                            row.status === 'completed' ? "bg-blue-50 border-blue-200 text-blue-600" : 
                            (row.status === 'in_progress' || row.status === 'in progress') ? "bg-amber-50 border-amber-200 text-amber-600" : 
                            row.status === 'not started' ? "bg-slate-100 border-slate-200 text-slate-500" :
                            "bg-slate-50 border-slate-200 text-slate-400"
                          )}>
                            {row.status}
                          </div>
                        ) : (
                          <select 
                            value={row.status} 
                            disabled={isViewOnly} 
                            onChange={(e) => handleFieldChange(row.id, 'status', e.target.value)} 
                            className={clsx(
                              "w-full text-[10px] font-bold uppercase rounded-md px-3 py-2 border outline-none appearance-none cursor-pointer transition-all", 
                              row.status === 'completed' ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm" : 
                              row.status === 'in progress' ? "bg-amber-50 border-amber-300 text-amber-700" : 
                              row.status === 'not started' ? "bg-slate-50 border-slate-300 text-slate-600" :
                              "bg-white border-slate-300 text-slate-500"
                            )}
                          >
                            <option value="not started">Not Started</option>
                            <option value="pending">Pending</option>
                            <option value="in progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-5 align-top text-center">
                        {isAllView ? (
                          <span className="text-xs font-bold text-slate-700">{row.periods_to_add}</span>
                        ) : (
                          <input type="number" value={row.periods_to_add} disabled={isViewOnly || row.status === 'completed'} onChange={(e) => handleFieldChange(row.id, 'periods_to_add', parseInt(e.target.value) || 0)} className="w-full border border-slate-300 rounded-md px-2 py-2 text-xs font-bold text-center outline-none focus:border-blue-500 bg-white transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-400" placeholder="0" />
                        )}
                      </td>
                      <td className="px-5 py-5 align-top">
                        {isAllView ? (
                          <span className="text-[10px] font-bold uppercase text-slate-600">{row.class_understanding_level || '-'}</span>
                        ) : (
                          row.status === 'completed' ? (
                            <select value={row.class_understanding_level || ''} disabled={isViewOnly} onChange={(e) => handleFieldChange(row.id, 'class_understanding_level', e.target.value)} className="w-full text-[10px] font-bold uppercase rounded-md px-3 py-2 border border-blue-300 bg-blue-50 text-blue-700 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm">
                              <option value="">Select Level...</option>
                              <option value="approaching">Approaching</option>
                              <option value="meeting">Meeting</option>
                              <option value="exceeding">Exceeding</option>
                            </select>
                          ) : (
                            <div className="py-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest text-center border border-dashed border-slate-300 rounded-md bg-slate-50/50">Awaiting Status</div>
                          )
                        )}
                      </td>
                      <td className="px-5 py-5 align-top">
                        {isAllView ? (
                          <p className="text-[11px] font-medium text-slate-600 whitespace-pre-wrap">{row.learning_outcome || row.learningOutcome || '-'}</p>
                        ) : (
                          <textarea rows={2} value={row.learningOutcome} disabled={isViewOnly} onChange={(e) => handleFieldChange(row.id, 'learningOutcome', e.target.value)} placeholder="Outcome goals..." className="w-full text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-md px-3 py-2 focus:border-blue-500 outline-none resize-none placeholder:text-slate-300 min-h-[48px] shadow-sm transition-all" />
                        )}
                      </td>
                      <td className="px-5 py-5 align-top text-center">
                        {isAllView ? (
                          <span className="text-[10px] font-bold uppercase text-slate-600">{row.notebookChecked}</span>
                        ) : (
                          <select value={row.notebookChecked} disabled={isViewOnly} onChange={(e) => handleFieldChange(row.id, 'notebookChecked', e.target.value)} className="w-full border border-slate-300 rounded-md px-2 py-2 text-[10px] font-bold uppercase outline-none bg-white cursor-pointer shadow-sm focus:border-blue-500">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-5 align-top text-center">
                        {isAllView ? (
                          <span className="text-[10px] font-bold uppercase text-slate-600">{row.homeworkChecked || 'No'}</span>
                        ) : (
                          <select value={row.homeworkChecked} disabled={isViewOnly} onChange={(e) => handleFieldChange(row.id, 'homeworkChecked', e.target.value)} className="w-full border border-slate-300 rounded-md px-2 py-2 text-[10px] font-bold uppercase outline-none bg-white cursor-pointer shadow-sm focus:border-blue-500">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        )}
                      </td>
                      {!isAllView && (
                        <td className="px-5 py-5 align-top text-center">
                          {(row.notebookChecked === 'Yes' || row.homeworkChecked === 'Yes') ? (
                            <button 
                              onClick={() => openStudentManager(row)} 
                              disabled={isViewOnly}
                              className={clsx(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-md transition-all border shadow-sm group",
                                isViewOnly 
                                  ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed" 
                                  : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                              )}
                            >
                              <Users size={14} className={clsx(!isViewOnly && "group-hover:scale-110 transition-transform")} />
                              <span className="text-[10px] font-black uppercase tracking-wider">Select Students</span>
                            </button>
                          ) : (
                            <div className="py-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest border border-dashed border-slate-200 rounded-md bg-slate-50/30">N/A</div>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-5 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isAllView ? (
                            <button 
                              onClick={() => handleDelete(row)}
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all active:scale-90"
                              title="Delete Topic"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            isViewOnly ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => setEditingId(row.id)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-all border border-slate-200 shadow-sm group">
                                  <Edit2 size={13} className="group-hover:rotate-12 transition-transform" />
                                  <span className="text-[10px] font-black uppercase tracking-wider">Edit</span>
                                </button>
                                </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSaveRow(row)}
                                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                >
                                  <Save size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-wider">Save</span>
                                </button>
                                {row.is_completed === 1 && (
                                  <button onClick={() => setEditingId(null)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                                    <X size={18} />
                                  </button>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar */}
      {weeklyData.length > 0 && !isAllView && (
        <div className="flex justify-end items-center gap-4 pt-10 pb-6 border-t border-slate-100 mt-6">
          <button 
            onClick={() => {
              if (window.confirm("Are you sure? This will discard all unsaved changes and reload original data.")) {
                loadPlan();
                setStudentDataMap({});
                setEditingId(null);
              }
            }}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-500 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-rose-600 hover:border-rose-100 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <Clock size={14} className="rotate-180" /> Reset Changes
          </button>

          <button 
            onClick={handleSaveAll} 
            disabled={loading} 
            className="flex items-center gap-2.5 bg-blue-600 text-white px-10 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save All Changes
          </button>
        </div>
      )}

      {/* Student Tracker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">Student Tracker — <span className="text-blue-600">{selectedTopic?.topic}</span></h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={22} /></button>
            </div>
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input type="text" placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-md text-xs font-semibold border border-slate-200 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="flex gap-4 text-[9px] font-black uppercase text-slate-400 tracking-widest px-2">
                <div className="w-24 text-center">Notebook<br/>Incomplete</div>
                <div className="w-24 text-center">Homework<br/>Incomplete</div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 scrollbar-thin max-h-[60vh] bg-slate-50/30">
              {modalLoading ? <div className="h-40 flex justify-center items-center"><Loader2 className="animate-spin text-blue-600" size={28} /></div> : (
                <div className="space-y-2">
                  {studentList.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.roll_no.toString().includes(studentSearch)).map(s => (
                    <div key={s.id} className="p-3.5 rounded-md border border-slate-100 flex items-center justify-between hover:border-blue-100 transition-colors bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center text-[10px] font-bold text-slate-400">#{s.roll_no}</div>
                        <span className="text-xs font-bold text-slate-700">{s.name}</span>
                      </div>
                      <div className="flex gap-4">
                        {/* Notebook Toggle */}
                        <button
                          onClick={() => toggleStudentStatus(s.id, 'notebook_done')}
                          className={clsx(
                            "w-24 py-1.5 rounded-md text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5",
                            s.notebook_done ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                          )}
                        >
                          <Book size={10} /> {s.notebook_done ? "Done" : "Pending"}
                        </button>
                        {/* Homework Toggle */}
                        <button
                          onClick={() => toggleStudentStatus(s.id, 'homework_done')}
                          className={clsx(
                            "w-24 py-1.5 rounded-md text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5",
                            s.homework_done ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                          )}
                        >
                          <ClipboardCheck size={10} /> {s.homework_done ? "Done" : "Pending"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors">Cancel</button>
              {!isAllView && <button onClick={saveStudentProgress} disabled={modalLoading} className="bg-blue-600 text-white px-8 py-2.5 rounded-md font-bold text-[10px] uppercase shadow-md hover:bg-blue-700 transition-all active:scale-95">Save Progress</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
