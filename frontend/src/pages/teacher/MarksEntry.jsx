import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { SectionHeader } from '../../components/ui';
import { Save, Lock, CheckCircle, Search, AlertCircle, History, Edit3, Unlock } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const getAcademicYears = () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const currentStartYear = month < 3 ? year - 1 : year;
  const years = [];
  for (let i = -1; i < 4; i++) {
    const y = currentStartYear - i;
    years.push(`${y}-${(y + 1).toString().slice(-2)}`);
  }
  return years;
};

export default function MarksEntry({ isAdmin = false }) {
  const [viewMode, setViewMode] = useState('entry'); // 'entry' | 'history' | 'marksheet'
  const [options, setOptions] = useState({ classes: [], sections: [], subjects: [], globalAccess: false, permissions: [] });
  const [loading, setLoading] = useState(true);
  
  const academicYears = getAcademicYears();
  const defaultYear = academicYears.find(y => {
    const cy = new Date().getFullYear();
    const cm = new Date().getMonth();
    const csy = cm < 3 ? cy - 1 : cy;
    return y === `${csy}-${(csy + 1).toString().slice(-2)}`;
  }) || academicYears[1];

  const [filters, setFilters] = useState({
    academic_year: defaultYear,
    exam_type: 'Unit Test',
    class_id: '',
    section_id: '',
    subject_id: ''
  });

  const [students, setStudents] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [marksheetData, setMarksheetData] = useState({ subjects: [], examTypes: [], marksheet: [] });
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [globalTotalMarks, setGlobalTotalMarks] = useState('');

  // Available sections based on selected class and permissions
  const [availableSections, setAvailableSections] = useState([]);
  // Available subjects based on selected class and permissions
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const res = await api.get('/marks/teacher-options');
      if (res.data.success) {
        setOptions(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load access permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!filters.class_id) {
      setAvailableSections([]);
      setAvailableSubjects([]);
      return;
    }
    const cId = Number(filters.class_id);
    if (options.globalAccess) {
      setAvailableSections(options.sections.filter(s => s.class_id === cId));
      setAvailableSubjects(options.subjects);
    } else {
      const classPerms = options.permissions.filter(p => p.class_id === cId || p.class_id === null);
      const secIds = new Set(classPerms.map(p => p.section_id).filter(Boolean));
      const hasAllSections = classPerms.some(p => p.section_id === null);
      if (hasAllSections) {
        setAvailableSections(options.sections.filter(s => s.class_id === cId));
      } else {
        setAvailableSections(options.sections.filter(s => s.class_id === cId && secIds.has(s.id)));
      }
      const subIds = new Set(classPerms.map(p => p.subject_id).filter(Boolean));
      const hasAllSubjects = classPerms.some(p => p.subject_id === null);
      if (hasAllSubjects) {
        setAvailableSubjects(options.subjects);
      } else {
        setAvailableSubjects(options.subjects.filter(s => subIds.has(s.id)));
      }
    }
    setFilters(f => ({ ...f, section_id: '', subject_id: '' }));
    setStudents([]);
    setHistoryData([]);
    setGlobalTotalMarks('');
  }, [filters.class_id, options]);

  useEffect(() => {
    setStudents([]);
    setHistoryData([]);
    setMarksheetData({ subjects: [], examTypes: [], marksheet: [] });
    setGlobalTotalMarks('');
  }, [viewMode]);

  const loadData = async () => {
    if (!filters.class_id) {
      return toast.error('Class is required.');
    }
    if (viewMode !== 'marksheet' && !filters.subject_id) {
      return toast.error('Subject is required.');
    }
    if (viewMode === 'entry' && !filters.exam_type) {
      return toast.error('Exam Type is required.');
    }

    try {
      setFetchingStudents(true);
      const query = new URLSearchParams(filters).toString();
      
      if (viewMode === 'entry') {
        const res = await api.get(`/marks/students?${query}`);
        if (res.data.success) {
          const data = res.data.data;
          setStudents(data);
          // Pre-fill global total marks if any student has it
          const existingTotal = data.find(s => s.total_marks)?.total_marks;
          if (existingTotal) {
            setGlobalTotalMarks(existingTotal);
          } else {
            setGlobalTotalMarks('');
          }
        }
      } else if (viewMode === 'history') {
        const res = await api.get(`/marks/history?${query}`);
        if (res.data.success) setHistoryData(res.data.data);
      } else if (viewMode === 'marksheet') {
        const res = await api.get(`/marks/marksheet?${query}`);
        if (res.data.success) {
          setMarksheetData({
            subjects: res.data.data.subjects,
            examTypes: res.data.data.examTypes || [],
            marksheet: res.data.data.marksheet
          });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleMarksChange = (idx, value) => {
    const updated = [...students];
    updated[idx].marks_obtained = value;
    setStudents(updated);
  };

  const saveMarks = async (isFinal = false) => {
    if (students.length === 0) return;
    if (!globalTotalMarks) {
      return toast.error("Please enter the Max Marks for this exam before saving.");
    }
    if (isFinal) {
      if (!window.confirm("Are you sure you want to Final Save? You will not be able to edit these marks again.")) {
        return;
      }
    }
    try {
      setSaving(true);
      const payload = {
        ...filters,
        isFinal,
        globalTotalMarks,
        marksData: students.map(s => ({
          student_id: s.student_id,
          marks_obtained: s.marks_obtained
        }))
      };

      const res = await api.post('/marks/save', payload);
      if (res.data.success) {
        toast.success(res.data.message || 'Saved successfully!');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  const unlockStudent = async (studentId = null) => {
    const msg = studentId 
      ? "Unlock this student's marks? This will revert their status to Draft."
      : "Unlock ALL finalized students in this class for this exam? This will revert their status to Draft.";
      
    if (!window.confirm(msg)) return;
    try {
      const payload = {
        subject_id: filters.subject_id,
        exam_type: filters.exam_type,
        academic_year: filters.academic_year
      };
      if (studentId) {
        payload.student_id = studentId;
      } else {
        payload.class_id = filters.class_id;
      }

      const res = await api.post('/marks/unlock', payload);
      if (res.data.success) {
        toast.success(res.data.message);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unlock marks.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading modules...</div>;

  let availableClasses = options.classes;
  if (!options.globalAccess) {
    const classIds = new Set(options.permissions.map(p => p.class_id).filter(Boolean));
    const hasAllClasses = options.permissions.some(p => p.class_id === null);
    if (!hasAllClasses) {
      availableClasses = options.classes.filter(c => classIds.has(c.id));
    }
  }

  return (
    <div className="p-4 sm:p-8 animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader 
          title="Marks Entry Portal" 
          subtitle="Record and finalize student marks" 
        />
        
        {isAdmin && (
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('entry')} 
              className={clsx("flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-all", viewMode === 'entry' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              <Edit3 size={16} /> Marks Entry
            </button>
            <button 
              onClick={() => setViewMode('history')} 
              className={clsx("flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-all", viewMode === 'history' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              <History size={16} /> Yearly History
            </button>
            <button 
              onClick={() => setViewMode('marksheet')} 
              className={clsx("flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-all", viewMode === 'marksheet' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >
              <History size={16} /> Marksheet
            </button>
          </div>
        )}
      </div>

      {availableClasses.length === 0 ? (
        <div className="bg-amber-50 text-amber-700 p-6 rounded-2xl flex items-center gap-3">
          <AlertCircle />
          <p className="font-bold">You currently have no classes assigned for Marks Entry. Please contact the administrator.</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Academic Year: hidden on Marks Entry tab, visible on History & Marksheet */}
            {viewMode !== 'entry' && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Academic Year *</label>
                <select className="select" value={filters.academic_year} onChange={e => setFilters({...filters, academic_year: e.target.value})}>
                  {academicYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          
            {viewMode === 'entry' && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Exam Type *</label>
                <select className="select" value={filters.exam_type} onChange={e => setFilters({...filters, exam_type: e.target.value})}>
                  <option value="Unit Test">Unit Test</option>
                  <option value="Half Yearly Exam">Half Yearly Exam</option>
                  <option value="Annual Exam">Annual Exam</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Class Scope *</label>
              <select className="select" value={filters.class_id} onChange={e => setFilters({...filters, class_id: e.target.value})}>
                <option value="">Select Class...</option>
                {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Section</label>
              <select className="select" value={filters.section_id} onChange={e => setFilters({...filters, section_id: e.target.value})} disabled={!filters.class_id}>
                <option value="">All Sections</option>
                {availableSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {viewMode !== 'marksheet' && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Subject *</label>
                <select className="select" value={filters.subject_id} onChange={e => setFilters({...filters, subject_id: e.target.value})} disabled={!filters.class_id}>
                  <option value="">Select Subject...</option>
                  {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <button onClick={loadData} disabled={fetchingStudents || !filters.class_id || (viewMode !== 'marksheet' && !filters.subject_id)} className="btn-primary">
              <Search size={16} className="mr-2" /> {viewMode === 'entry' ? 'Load Students' : viewMode === 'marksheet' ? 'Generate Marksheet' : 'Generate History'}
            </button>
          </div>
        </div>
      )}

      {/* ENTRY MODE VIEW */}
      {viewMode === 'entry' && students.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-slate-700">Student List</h3>
              <div className="h-4 w-px bg-slate-300 hidden md:block"></div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Max Marks For Exam:</label>
                <input 
                  type="number" 
                  className="input w-24 py-1 h-8 text-center font-bold text-brand-600"
                  placeholder="e.g. 50"
                  value={globalTotalMarks}
                  onChange={(e) => setGlobalTotalMarks(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {isAdmin && students.some(s => s.status === 'final_saved') && (
                <button 
                  onClick={() => unlockStudent()} 
                  disabled={saving}
                  className="btn bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 flex items-center gap-2"
                  title="Unlock all finalized students in this class"
                >
                  <Unlock size={16} className="text-amber-500" /> Unlock All
                </button>
              )}
              <button 
                onClick={() => saveMarks(false)} 
                disabled={saving}
                className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Save size={16} className="text-brand-500" /> Save Draft
              </button>
              <button 
                onClick={() => saveMarks(true)} 
                disabled={saving}
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              >
                <CheckCircle size={16} /> Final Save
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Roll No</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Marks Obtained</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, idx) => {
                  const isFinal = student.status === 'final_saved';
                  const disabled = isFinal && !isAdmin;

                  return (
                    <tr key={student.student_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{student.roll_no}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">{student.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            step="0.01"
                            disabled={disabled}
                            value={student.marks_obtained ?? ''}
                            onChange={(e) => handleMarksChange(idx, e.target.value)}
                            className={clsx(
                              "input w-24 text-center py-1.5",
                              disabled && "bg-slate-100 text-slate-400 border-transparent cursor-not-allowed"
                            )}
                            placeholder="e.g. 18.5"
                          />
                          <span className="text-sm font-medium text-slate-400">/ {globalTotalMarks || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {isFinal ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">
                              <Lock size={10} /> Finalized
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase">
                              Draft
                            </span>
                          )}
                          
                          {isFinal && isAdmin && (
                            <button 
                              onClick={() => unlockStudent(student.student_id)}
                              className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors ml-2"
                              title="Unlock to Draft"
                            >
                              <Unlock size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HISTORY MODE VIEW */}
      {isAdmin && viewMode === 'history' && historyData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-700">Yearly Marks Sheet ({filters.academic_year})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4 whitespace-nowrap bg-slate-50/50 sticky left-0 border-r border-slate-200">Roll No</th>
                  <th className="px-6 py-4 whitespace-nowrap bg-slate-50/50 sticky left-[100px] border-r border-slate-200">Student Name</th>
                  <th className="px-6 py-4 text-center border-r border-slate-200">Unit Test</th>
                  <th className="px-6 py-4 text-center border-r border-slate-200">Half Yearly Exam</th>
                  <th className="px-6 py-4 text-center">Annual Exam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyData.map((student) => (
                  <tr key={student.student_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 whitespace-nowrap bg-white sticky left-0 border-r border-slate-200">{student.roll_no}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600 whitespace-nowrap bg-white sticky left-[100px] border-r border-slate-200">{student.name}</td>
                    
                    {['Unit Test', 'Half Yearly', 'Annual Exam'].map(exam => {
                      const m = student.marks[exam];
                      return (
                        <td key={exam} className="px-6 py-4 text-center border-r border-slate-200">
                          {m ? (
                            <div className="flex flex-col items-center">
                              <div>
                                <span className="font-bold text-slate-800">{m.obtained ?? '-'}</span>
                                <span className="text-slate-400 text-xs mx-1">/</span>
                                <span className="text-slate-500 text-sm">{m.total ?? '-'}</span>
                              </div>
                              <div className="mt-1">
                                {m.status === 'final_saved' ? (
                                  <span className="inline-flex items-center text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase"><Lock size={8} className="mr-0.5"/> Final</span>
                                ) : (
                                  <span className="inline-flex items-center text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">Draft</span>
                                )}
                              </div>
                              {m.teacher_name && (
                                <div className="mt-1 text-[9px] text-slate-400 font-medium truncate w-full max-w-[80px] text-center" title={`Entered by: ${m.teacher_name}`}>
                                  By: {m.teacher_name.split(' ')[0]}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* MARKSHEET MODE VIEW */}
      {isAdmin && viewMode === 'marksheet' && marksheetData?.marksheet?.length > 0 && (() => {
        const { subjects, examTypes, marksheet } = marksheetData;
        const EXAM_SHORT = { 'Unit Test': 'UT', 'Half Yearly Exam': 'HY', 'Annual Exam': 'AE' };
        // Total column count for subjects section (subjects × examTypes per subject)
        const subjectColSpan = examTypes.length || 1;

        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-700">Class Marksheet — {filters.academic_year}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {marksheet.length} student(s) &middot; {subjects.length} subject(s) &middot;&nbsp;
                  Exams: {examTypes.length > 0 ? examTypes.join(', ') : 'None yet'}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {/* Row 1: Static cols + Subject name groups */}
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th rowSpan={2} className="px-3 py-3 whitespace-nowrap sticky left-0 bg-slate-50 border-r border-b border-slate-200 align-middle">#</th>
                    <th rowSpan={2} className="px-4 py-3 whitespace-nowrap sticky left-[48px] bg-slate-50 border-r border-b border-slate-200 align-middle min-w-[140px]">Student Name</th>
                    {subjects.map(sub => (
                      <th key={sub.id} colSpan={subjectColSpan + 1} className="px-4 py-2 text-center border-r border-slate-200 bg-slate-100 text-slate-600 min-w-[100px]">
                        {sub.name}
                      </th>
                    ))}
                    <th rowSpan={2} colSpan={2} className="px-4 py-3 text-center bg-indigo-50 text-indigo-700 border-l border-slate-200 align-middle min-w-[160px]">Grand Total / %</th>
                  </tr>
                  {/* Row 2: Exam type sub-columns per subject */}
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {subjects.map(sub => (
                      <React.Fragment key={sub.id}>
                        {examTypes.map(et => (
                          <th key={et} className="px-2 py-2 text-center border-r border-slate-100 bg-white min-w-[70px] whitespace-nowrap">
                            <span className="inline-block">{EXAM_SHORT[et] || et}</span>
                          </th>
                        ))}
                        {/* Subject sub-total column */}
                        <th className="px-2 py-2 text-center border-r border-slate-200 bg-slate-50 text-slate-500 min-w-[70px] whitespace-nowrap">Total</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marksheet.map(student => (
                    <tr key={student.student_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-3 text-xs font-bold text-slate-400 whitespace-nowrap bg-white sticky left-0 border-r border-slate-200">{student.roll_no}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap bg-white sticky left-[48px] border-r border-slate-200">{student.name}</td>

                      {student.subjects.map(sub => (
                        <React.Fragment key={sub.subject_id}>
                          {/* Per-exam-type columns */}
                          {examTypes.map(et => {
                            const em = sub.byExam?.[et];
                            return (
                              <td key={et} className="px-2 py-3 text-center border-r border-slate-100">
                                {em !== null && em !== undefined ? (
                                  <div className="flex flex-col items-center">
                                    <span className="font-bold text-slate-800 text-xs">{em.obtained}</span>
                                    <span className="text-[9px] text-slate-400">/{em.total}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-200 text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                          {/* Subject sub-total */}
                          <td className="px-2 py-3 text-center border-r border-slate-200 bg-slate-50/50">
                            {sub.subTotal !== null ? (
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-slate-700 text-xs">{sub.subObtained}</span>
                                <span className="text-[9px] text-slate-400">/{sub.subTotal}</span>
                              </div>
                            ) : (
                              <span className="text-slate-200 text-xs">—</span>
                            )}
                          </td>
                        </React.Fragment>
                      ))}

                      {/* Grand total + percentage */}
                      <td className="px-3 py-3 text-center bg-indigo-50/30 border-l border-slate-200">
                        {student.grandTotalMax > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-indigo-700 text-sm">{student.grandTotalObtained}</span>
                            <span className="text-[9px] text-indigo-400">/{student.grandTotalMax}</span>
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center bg-indigo-50/30">
                        {student.percentage !== null ? (
                          <span className={clsx(
                            "font-bold text-sm px-2 py-0.5 rounded-full",
                            student.percentage >= 80 ? "text-emerald-700 bg-emerald-50" :
                            student.percentage >= 60 ? "text-amber-700 bg-amber-50" :
                            student.percentage >= 33 ? "text-orange-700 bg-orange-50" :
                            "text-rose-700 bg-rose-50"
                          )}>
                            {student.percentage}%
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
