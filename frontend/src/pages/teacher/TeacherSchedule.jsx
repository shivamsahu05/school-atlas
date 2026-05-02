import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import PermissionWrapper from '../../components/common/PermissionWrapper';
import FiltersBar from '../../components/common/FiltersBar';
import ExportButton from '../../components/common/ExportButton';
import { StatCard, ProgressBar, StatusBadge, SectionHeader, Tabs } from '../../components/ui';
import DataTable from '../../components/ui/DataTable';
import { Clock, CheckCircle, AlertCircle, Users, Save, Check, XCircle, Edit2, UserX, TrendingUp, Loader2 } from 'lucide-react';
import {
  scheduleApi,
  syllabusApi,
  studentsApi,
  intelligenceApi
} from '../../api';
import StudentTrackerModal from './StudentTrackerModal';
import * as XLSX from 'xlsx';

const STATUS_OPTIONS = ['Completed', 'In Progress', 'Pending', 'Not Started'];
const LEARNING_STATUS_OPTIONS = ['Approaching', 'Meeting', 'Exceeding'];
const NOTEBOOK_CHECKED_OPTIONS = ['Yes', 'No'];
const SUBJECT_COLOR_MAP = [
  { key: 'science', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  { key: 'math', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
  { key: 'english', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  { key: 'social', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
  { key: 'history', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
  { key: 'hindi', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  { key: 'computer', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  { key: 'art', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  { key: 'music', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  { key: 'phys', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800' },
];

export default function TeacherSchedule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' or 'weekly'
  const [schedule, setSchedule] = useState([]);
  const [filters, setFilters] = useState({ class: 'All', subject: 'All', week: 'Current' });
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedWeeklyRow, setSelectedWeeklyRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [intelData, setIntelData] = useState([]);
  const [intelLoading, setIntelLoading] = useState(false);

  // Weekly syllabus specific states
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [modalSubjects, setModalSubjects] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});

  // Active editing rows for Weekly Plan (Inverted: By default, unlocked)
  const [lockedRows, setLockedRows] = useState(new Set());

  const unlockRow = (id) => {
    setLockedRows(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const lockRow = (id) => {
    setLockedRows(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const [filterMonth, setFilterMonth] = useState('All');
  const [syllabusMetadata, setSyllabusMetadata] = useState({ months: [], syllabus: [] });
  const [filterWeek, setFilterWeek] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [weeksFromCalendar, setWeeksFromCalendar] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);

  function getWeeksInMonth(year, month) {
    const weeks = [];
    const start = new Date(year, month, 1);
    let current = new Date(start);

    // Find the first Monday or the 1st of the month
    while (current.getMonth() === month) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      weeks.push({
        start: new Date(weekStart),
        end: new Date(weekEnd),
        label: `Week ${weeks.length + 1}`
      });

      current.setDate(current.getDate() + 7);
    }

    return weeks;
  }

  useEffect(() => {
    if (!selectedMonth) return;
    const w = getWeeksInMonth(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth()
    );
    setWeeksFromCalendar(w);
    if (w.length > 0) {
      setSelectedWeek(w[0]);
    }
  }, [selectedMonth]);

  const [assignments, setAssignments] = useState({ classes: [], subjects: [] });
  const [syllabusWeeks, setSyllabusWeeks] = useState([]);
  const userPermissions = user?.permissions || {};

  useEffect(() => {
    scheduleApi.getMyAssignments().then(res => {
      const data = res?.data || { classes: [], subjects: [] };
      setAssignments(data);
    });
  }, []);

  // Fetch Syllabus Metadata when class or subject changes
  useEffect(() => {
    const classObj = assignments.classes.find(c => `${c.class_number}-${c.section}` === selectedClass);
    if (classObj && selectedSubject) {
      syllabusApi.getMetadata({
        class_id: classObj.class_id,
        subject_id: selectedSubject
      }).then(res => {
        setSyllabusMetadata(res.data || { months: [], syllabus: [] });

        // Populate syllabusWeeks for the grid/filters
        const weeks = (res.data?.syllabus || []).map(item => {
          const startRaw = item.planned_start_date ? new Date(item.planned_start_date) : null;
          const startStr = startRaw ? startRaw.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';
          return {
            value: item.week,
            label: item.week ? `${item.week} (${startStr})` : item.week,
            startDate: startRaw
          };
        });
        setSyllabusWeeks(weeks);

        if (res.data?.months?.length > 0) {
          const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
          if (res.data.months.includes(currentMonthName)) {
            setFilterMonth(currentMonthName);
          } else {
            setFilterMonth(res.data.months[0]);
          }
        }
      });
    }
  }, [selectedClass, selectedSubject, assignments.classes]);

  // Set initial class/subject for weekly view
  useEffect(() => {
    if (assignments.classes.length > 0 && !selectedClass) {
      const c = assignments.classes[0];
      setSelectedClass(`${c.class_number}-${c.section}`);
    }
  }, [assignments.classes, selectedClass]);

  // Fetch Dynamic Subjects when Class changes
  useEffect(() => {
    if (!selectedClass) {
      setModalSubjects([]);
      return;
    }

    const classObj = assignments.classes.find(c => `${c.class_number}-${c.section}` === selectedClass);
    if (classObj) {
      scheduleApi.getTeacherSubjects({ class_id: classObj.class_id }).then(res => {
        const subjects = res.data || [];
        setModalSubjects(subjects);
        // Auto-select first subject if none selected or if current not in new list
        if (subjects.length > 0) {
          const exists = subjects.find(s => String(s.id) === String(selectedSubject));
          if (!exists) setSelectedSubject(String(subjects[0].id));
        } else {
          setSelectedSubject('');
        }
      });
    }
  }, [selectedClass, assignments.classes]);

  // Subject auto-selection and dynamic loading is now handled in the previous useEffect
  // that calls scheduleApi.getTeacherSubjects.


  // Combined stable trigger for loading data with simple debounce
  // Using primitive dependencies (strings/numbers) to prevent infinite loops from object recreation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'grid') {
        loadSchedule();
      }
      if (activeTab === 'weekly' && selectedClass && selectedSubject && filterMonth && filterWeek) {
        console.log('[DEBUG] Triggering loadMicroSchedule:', { selectedClass, selectedSubject, filterMonth, filterWeek });
        loadMicroSchedule();
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [activeTab, filterMonth, filterWeek, selectedClass, selectedSubject]);

  useEffect(() => {
    if (activeTab === 'intelligence') {
      loadIntelligence();
    }
  }, [activeTab]);

  const loadIntelligence = async () => {
    setIntelLoading(true);
    try {
      const res = await intelligenceApi.getMicroIntelligence();
      setIntelData(res.data || []);
    } catch (err) {
      console.error('Failed to load intelligence:', err);
    } finally {
      setIntelLoading(false);
    }
  };

  // UNIVERSAL NORMALIZE FUNCTION
  const normalize = (value) => {
    return String(value || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/-/g, '');
  };

  const loadMicroSchedule = async () => {
    if (!selectedClass || !selectedSubject || !filterMonth || !filterWeek) {
      console.log('[DEBUG] Skipping loadMicroSchedule - missing filters');
      return;
    }
    setWeeklyLoading(true);

    const classObj = assignments.classes.find(c => {
      const normAssigned = normalize(`${c.class_number}-${c.section}`);
      const normSelected = normalize(selectedClass);
      return normAssigned === normSelected;
    });

    if (!classObj) {
      console.error('[DEBUG] Class mapping failure. Selected:', selectedClass, 'Assignments:', assignments.classes);
      setWeeklyLoading(false);
      return;
    }

    const params = {
      class_id: classObj.class_id,
      section_id: classObj.section_id || 0,
      subject_id: selectedSubject,
      month: filterMonth === 'All' ? 'All' : filterMonth,
      week: filterWeek === 'All' ? 'All' : filterWeek
    };

    console.log('[DEBUG] DATA PIPELINE — STAGE 1: API Request', params);

    try {
      setWeeklyError(null);
      const res = await scheduleApi.getMicroSchedule(params);

      // MANDATORY DEBUG OUTPUT
      console.log('[DEBUG] Raw API response body:', res);

      const raw = res?.data;

      // SINGLE SAFE RULE (MANDATORY)
      const results = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.savedData)
        ? raw.savedData
        : [];

      // Map topics to weeklyData (ensure students list exists)
      const formatted = results.map(topicRow => ({
        ...topicRow,
        id: topicRow.id,
        periodsNeeded: topicRow.periods_planned || 0,
        homeworkStatus: topicRow.homework || 'Complete',
        status: topicRow.is_completed ? 'Completed' : (topicRow.learning_status || 'Pending'),
        students: topicRow.students || [],
        completed_date: topicRow.completed_date,
        updated_at: topicRow.updated_at
      }));
      
      setWeeklyData(formatted);

    } catch (err) {
      console.error('[DEBUG] DATA PIPELINE — CRITICAL FAILURE', err);
      setWeeklyError(err.message || 'Server communication failed');
      setWeeklyData([]);
    } finally {
      setWeeklyLoading(false);
    }
  };

  // Load period grid schedule
  const loadSchedule = () => {
    if (!selectedWeek) return;
    setLoading(true);

    const [classNum, sectionStr] = (filters.class && filters.class !== 'All')
      ? filters.class.split('-')
      : [null, null];

    const params = {
      ...filters,
      class_number: classNum,
      section: sectionStr,
      start_date: selectedWeek.start.toISOString().split('T')[0],
      end_date: selectedWeek.end.toISOString().split('T')[0],
      week_label: selectedWeek.label
    };

    console.log("Selected Week:", selectedWeek);
    console.log("API Params:", params);

    const filterWeek = (row) => {
      if (!selectedWeek) return true;
      const daysMap = {
        MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, SUNDAY: 0,
      };
      const weekStart = new Date(selectedWeek.start);
      const weekEnd = new Date(selectedWeek.end);
      const rowDay = daysMap[row.day_of_week.toUpperCase()];
      const current = new Date(weekStart);
      while (current <= weekEnd) {
        if (current.getDay() === rowDay) return true;
        current.setDate(current.getDate() + 1);
      }
      return false;
    };

    scheduleApi.getMySchedule(params)
      .then(res => {
        const raw = res?.data || [];
        const sortedStartTimes = [...new Set(raw.map(item => item.start_time))].sort();

        const mapped = raw
          .filter(item => item.topic && item.topic.trim() !== '')
          .filter(filterWeek)
          .map(item => {
            const rawStudents = item.students_data ? (typeof item.students_data === 'string' ? JSON.parse(item.students_data) : item.students_data) : [];
            return {
              ...item,
              day: item.day_of_week.charAt(0).toUpperCase() + item.day_of_week.slice(1).toLowerCase(),
              period: sortedStartTimes.indexOf(item.start_time) + 1,
              subject: item.subject_name,
              class: `${item.class_number}-${item.section}`,
              topic: item.topic,
              status: item.status,
              students: Array.isArray(rawStudents) ? rawStudents : []
            };
          });
        setSchedule(mapped);

        // Update syllabusWeeks with date ranges from the schedule itself
        const uniqueWeeks = [...new Set(raw.map(item => item.week).filter(Boolean))];
        const weekOpts = uniqueWeeks.map(w => {
          const first = raw.find(item => item.week === w && item.planned_start_date);
          if (first) {
            const start = new Date(first.planned_start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            const end = new Date(first.planned_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            return { value: w, label: `${w} (${start} — ${end})` };
          }
          return { value: w, label: w };
        });
        if (weekOpts.length > 0) {
          setSyllabusWeeks(weekOpts);
        }

        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const [selectedGridEntry, setSelectedGridEntry] = useState(null);

  const handleGridStudentClick = async (entry) => {
    // If students are already there, just open
    if (entry.students && entry.students.length > 0) {
      setSelectedGridEntry(entry);
      return;
    }

    // Otherwise fetch base students for this class
    try {
      // Use class_id and section_id directly from the schedule entry
      const res = await studentsApi.getAll({
        class_id: entry.class_id,
        section_id: entry.section_id
      });
      const classStudents = res?.data || [];
      const formatted = classStudents.map(s => ({
        id: s.id,
        name: s.name,
        rollNumber: s.roll_no,
        homework: true,
        notebook: true
      }));

      setSelectedGridEntry({ ...entry, students: formatted });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGridStudentsSave = async (updatedStudents) => {
    if (!selectedGridEntry) return;

    try {
      // Update syllabus if syllabus_id exists
      if (selectedGridEntry.syllabus_id) {
        await syllabusApi.update(selectedGridEntry.syllabus_id, {
          students_data: JSON.stringify(updatedStudents)
        });
      }

      // Update ALL cells in the same week with same subject & class
      setSchedule(prev => prev.map(item => {
        const sameSubject = item.subject === selectedGridEntry.subject;
        const sameClass = item.class === selectedGridEntry.class;
        const sameWeek = item.week === selectedGridEntry.week;
        if (sameSubject && sameClass && sameWeek) {
          return { ...item, students: updatedStudents };
        }
        return item;
      }));

      setSelectedGridEntry(null);
    } catch (err) {
      console.error('Failed to update tracking');
    }
  };

  const getWeekString = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    const day = date.getDate()
    if (day <= 7) return 'Week 1 (1–7)'
    if (day <= 14) return 'Week 2 (8–14)'
    if (day <= 21) return 'Week 3 (15–21)'
    if (day <= 28) return 'Week 4 (22–28)'
    return 'Week 5 (29+)'
  }

  // Period grid calculations (Synced with schedule state)
  const gridTotal = schedule.length;
  const gridCompleted = schedule.filter(p => p.status === 'Completed').length;
  const gridPending = gridTotal - gridCompleted;
  const gridProgressPercent = gridTotal > 0 ? Math.round((gridCompleted / gridTotal) * 100) : 0;

  const handleExport = () => {
    const wsData = schedule.map(p => ({
      Day: p.day,
      Period: p.period,
      Subject: p.subject,
      Class: p.class,
      Chapter: p.chapter,
      Topics: p.topics,
      Status: p.status,
      'Homework Done': p.students?.filter(s => s.homework).length || 0,
      'Notebook Checked': p.students?.filter(s => s.notebook).length || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
    XLSX.writeFile(wb, `Schedule_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

  const scheduleMap = {};
  schedule.forEach(item => {
    if (!scheduleMap[item.day]) scheduleMap[item.day] = {};
    scheduleMap[item.day][item.period] = item;
  });

  // Weekly syllabus handlers
  const handleWeeklyFieldChange = (id, field, value) => {
    setWeeklyData(prevData => {
      return prevData.map(r => {
        if (r.id !== id) return r;

        let updatedRow = { ...r, [field]: value };

        if (field === 'status' && value === 'Completed' && !updatedRow.completed_date) {
          updatedRow.completed_date = new Date().toISOString().split('T')[0];
        } else if (field === 'status' && value !== 'Completed') {
          updatedRow.completed_date = null;
        }

        // Bulk update: if teacherNotebookChecked changes to "Yes", mark all students' notebooks as checked
        if (field === 'teacherNotebookChecked' && value === 'Yes') {
          updatedRow.students = (r.students || []).map(student => ({
            ...student,
            notebook: true
          }));
        }

        // Smart Auto-Complete: If both homework is complete and notebooks are checked,
        // auto-set the main status to 'Completed' to ensure grid sync.
        const isHomeworkDone = field === 'homeworkStatus' ? value === 'Complete' : r.homeworkStatus === 'Complete';
        const isNotebooksDone = field === 'teacherNotebookChecked' ? value === 'Yes' : r.teacherNotebookChecked === 'Yes';

        if (isHomeworkDone && isNotebooksDone && updatedRow.status === 'Pending') {
          updatedRow.status = 'Completed';
        }

        return updatedRow;
      });
    });
  };

  const handleBulkNotebookCheck = (status) => {
    setWeeklyData(prevData => prevData.map(row => {
      // Use normalize() to handle format mismatches: 'Week 1' vs 'week1' etc.
      const matchesMonth = filterMonth === 'All' || normalize(row.month) === normalize(filterMonth);
      const matchesWeek = filterWeek === 'All' || normalize(row.week) === normalize(filterWeek);

      if (!matchesMonth || !matchesWeek) return row;

      return {
        ...row,
        teacherNotebookChecked: status,
        students: (row.students || []).map(student => ({
          ...student,
          notebook: status === 'Yes'
        }))
      };
    }));
  };

  const handleWeeklyStudentsChange = (id, students) => {
    const updated = weeklyData.map(r => r.id === id ? { ...r, students } : r);
    setWeeklyData(updated);
    setSelectedWeeklyRow(null);
  };

  const getGridDate = (dayIndex) => {
    const activeWeek = syllabusWeeks.find(w => w.value === filters.week);
    if (!activeWeek || !activeWeek.startDate) return null;

    const date = new Date(activeWeek.startDate);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getSubjectColor = (subject) => {
    const defaultColor = { bg: 'bg-brand-50/50', border: 'border-brand-200', text: 'text-brand-700', badge: 'bg-brand-100 text-brand-800' };
    if (!subject) return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' };

    const sub = subject.toLowerCase();
    const match = SUBJECT_COLOR_MAP.find(m => sub.includes(m.key));

    return match ? {
      bg: match.bg,
      border: match.border,
      text: match.text,
      badge: match.badge
    } : defaultColor;
  };


  const handleSaveAllWeekly = async () => {
    setLoading(true);
    try {
      const [classNum, sectionStr] = selectedClass.split('-');
      
      const batchPayload = weeklyData.map(row => {
        const isActuallyCompleted = row.status === 'Completed';
        const finalDate = row.completed_date || (isActuallyCompleted ? new Date().toISOString().split('T')[0] : null);
        
        const studentsStatus = (row.students || []).map(s => ({
          student_id: s.id,
          lo_status: s.learning_status || s.lo_status || 'Meeting', // SYNC FOR DASHBOARDS
          homework_status: s.homework_status || (s.homework ? 'COMPLETED' : 'PENDING')
        }));

        return {
          class_number: classNum,
          section: sectionStr,
          subject_id: selectedSubject,
          month: filterMonth,
          week: filterWeek,
          topic: row.topic,
          periods_planned: row.periodsNeeded || 0,
          periods_completed: row.periodsCompleted || 0,
          learning_status: row.status,
          homework: row.homeworkStatus,
          syllabus_id: row.id,
          is_completed: isActuallyCompleted,
          completed_date: isActuallyCompleted ? finalDate : null,
          students_status: studentsStatus
        };
      });

      console.log('[DEBUG] SAVING BATCH PAYLOAD:', batchPayload);
      await scheduleApi.saveMicroSchedule(batchPayload);
      
      alert("✅ All changes saved successfully");
      loadMicroSchedule();
      loadSchedule();
    } catch (error) {
      console.error("BATCH SAVE ERROR:", error);
      alert("❌ Failed to save changes: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Weekly syllabus progress (SINGLE SAFE BLOCK)
  const safeData = Array.isArray(weeklyData) ? weeklyData : [];

  const totalCount = safeData.length || 0;

  const completedCount = safeData.filter(i =>
    i.is_completed === 1 ||
    i.status?.toLowerCase() === "completed"
  ).length;

  const progress =
    totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

  // For display text compatibility
  const completedWeeklyPeriods = completedCount; 
  const totalWeeklyPeriods = totalCount;
  const weeklyProgressPercent = progress;


  // Derive string arrays for FiltersBar compatibility
  const filterClasses = assignments.classes.map(c => `${c.class_number}-${c.section}`);
  const filterSubjects = [...new Set(assignments.subjects.map(s => s.name))];

  // Map IDs to names for display
  const currentBaseClassObj = assignments.classes.find(c => `${c.class_number}-${c.section}` === selectedClass);
  const currentSubjectObj = assignments.subjects.find(s => s.subject_id === Number(selectedSubject));

  // modalSubjects is now managed via state and dynamic API calls

  const weeklyColumns = [
    {
      key: 'week', label: 'Week', sortable: true,
      render: (v, r) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-slate-900">{v}</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 border border-slate-200 uppercase tracking-tighter">ID: {r.id}</span>
          </div>
          {r.dateRange && <span className="text-[10px] text-slate-400 font-bold">{r.dateRange}</span>}
        </div>
      )
    },
    {
      key: 'topic',
      label: 'Topic/Chapter',
      render: (v, r) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-slate-800 leading-tight">{r.topic || 'Untitled Topic'}</span>
          <span className="text-[10px] font-medium text-slate-400 italic">{r.chapter || 'No Chapter'}</span>
        </div>
      )
    },
    {
      key: 'periods',
      label: 'Periods',
      render: (v, r) => <span className="font-bold text-slate-700">{r.periodsNeeded || 0}</span>
    },
    { key: 'chapter', label: 'Chapter' },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        !lockedRows.has(row.id) ? (
          <select
            value={value}
            onChange={(e) => handleWeeklyFieldChange(row.id, 'status', e.target.value)}
            className="border rounded px-1.5 py-0.5 text-xs bg-white w-24"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <StatusBadge status={value === 'Completed' ? 'active' : value === 'Pending' ? 'inactive' : 'pending'} label={value} />
        )
      ),
    },
    {
      key: 'periodsNeeded',
      label: 'Periods Needed',
      render: (value, row) => (
        !lockedRows.has(row.id) ? (
          <input
            type="number"
            min="0"
            value={value}
            onChange={(e) => handleWeeklyFieldChange(row.id, 'periodsNeeded', parseInt(e.target.value) || 0)}
            className="border rounded px-1.5 py-0.5 text-xs w-12"
          />
        ) : (
          <span className="text-sm font-medium">{value}</span>
        )
      ),
    },
    {
      key: 'learningStatus',
      label: 'Learning Status',
      render: (value, row) => (
        !lockedRows.has(row.id) ? (
          <select
            value={value}
            onChange={(e) => handleWeeklyFieldChange(row.id, 'learningStatus', e.target.value)}
            className="border rounded px-1.5 py-0.5 text-xs bg-white w-24"
          >
            {LEARNING_STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <span className="text-sm font-medium text-slate-700">{value}</span>
        )
      ),
    },
    {
      key: 'teacherNotebookChecked',
      label: 'Teacher Notebook Checked',
      render: (value, row) => {
        const missingCount = row.students?.filter(s => !s.notebook).length || 0;
        const totalStudents = row.students?.length || 0;
        return (
          <div className="space-y-1">
            {!lockedRows.has(row.id) ? (
              <select
                value={value}
                onChange={(e) => {
                  const newVal = e.target.value;
                  if (newVal === 'No' && row.students?.length) {
                    setWeeklyData(prev => prev.map(r =>
                      r.id === row.id
                        ? { ...r, teacherNotebookChecked: newVal, students: r.students.map(s => ({ ...s, notebook: false })) }
                        : r
                    ));
                  } else {
                    handleWeeklyFieldChange(row.id, 'teacherNotebookChecked', newVal);
                  }
                }}
                className={clsx(
                  "border rounded px-1.5 py-0.5 text-xs w-24 transition-colors font-medium",
                  value === 'Yes'
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-200"
                )}
              >
                {NOTEBOOK_CHECKED_OPTIONS.map(opt => (
                  <option key={opt} value={opt} className="bg-white text-slate-700">{opt}</option>
                ))}
              </select>
            ) : (
              <span className={clsx(
                "px-2 py-1 rounded text-xs font-bold inline-block",
                value === 'Yes' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              )}>
                {value}
              </span>
            )}

            {value === 'No' && (
              <button
                onClick={() => setSelectedWeeklyRow(row)}
                className="text-[10px] text-brand-600 hover:text-brand-800 underline block font-semibold px-1"
              >
                Select Students ({missingCount > 0 ? `${missingCount} missing` : `${totalStudents} total`})
              </button>
            )}
            {value === 'Yes' && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold px-1">
                <Check size={10} /> All notebooks checked
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'learningOutcome',
      label: 'Learning Outcome',
      render: (value, row) => (
        !lockedRows.has(row.id) ? (
          <input
            type="text"
            value={value}
            onChange={(e) => handleWeeklyFieldChange(row.id, 'learningOutcome', e.target.value)}
            className="border rounded px-1.5 py-0.5 text-xs w-full"
            placeholder="Enter outcome"
          />
        ) : (
          <span className="text-sm text-slate-600">{value || '-'}</span>
        )
      ),
    },
    {
      key: 'homeworkStatus',
      label: 'Homework',
      render: (value, row) => {
        const notDoneCount = row.students?.filter(s => !s.homework).length || 0;
        return (
          <div className="space-y-1">
            {!lockedRows.has(row.id) ? (
              <select
                value={value}
                onChange={(e) => {
                  const newVal = e.target.value;
                  if (newVal === 'Incomplete' && row.students?.length) {
                    setWeeklyData(prev => prev.map(r =>
                      r.id === row.id
                        ? { ...r, homeworkStatus: newVal, students: r.students.map(s => ({ ...s, homework: false })) }
                        : r
                    ));
                  } else {
                    handleWeeklyFieldChange(row.id, 'homeworkStatus', newVal);
                  }
                }}
                className="border rounded px-1.5 py-0.5 text-xs bg-white w-full"
              >
                <option value="Complete">Complete</option>
                <option value="Incomplete">Incomplete</option>
              </select>
            ) : (
              <span className={clsx(
                "px-2 py-1 rounded text-xs font-bold inline-block",
                value === 'Complete' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}>
                {value}
              </span>
            )}

            {value === 'Incomplete' && (
              <button
                onClick={() => setSelectedWeeklyRow(row)}
                className="text-[10px] text-rose-600 hover:text-rose-800 underline block font-semibold px-1"
              >
                Select Students ({notDoneCount} not done)
              </button>
            )}
            {value === 'Complete' && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold px-1">
                <Check size={10} /> All homework done
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'date_info',
      label: 'Date Status',
      render: (value, row) => {
        const isCompleted = row.status === 'Completed' || row.is_completed === 1 || row.is_completed === true;
        const displayDate = isCompleted ? row.completed_date : row.updated_at;
        
        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          } catch (e) {
            return dateStr;
          }
        };

        return (
          <div className="flex flex-col gap-1 min-w-[140px]">
            {displayDate ? (
              <div className="flex flex-col gap-0.5">
                <span className={clsx(
                  "text-[10px] font-black px-2 py-1 rounded-lg border shadow-sm w-fit uppercase tracking-tighter",
                  isCompleted 
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                    : "text-amber-700 bg-amber-50 border-amber-200"
                )}>
                  {isCompleted ? "✅ Topic Completed" : "⏳ Execution Pending"}
                </span>
                <span className="text-[10px] font-bold text-slate-400 ml-1">
                  {isCompleted ? "Completed on: " : "Last Updated: "}
                  <span className="text-slate-600">{formatDate(displayDate)}</span>
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 w-fit uppercase tracking-tighter">
                  No History
                </span>
                <span className="text-[10px] font-bold text-slate-300 ml-1">No date recorded</span>
              </div>
            )}
          </div>
        );
      }
    }
  ];

  if (!user) return <div className="p-4 sm:p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Micro Schedule</h1>
        {activeTab === 'grid' && <ExportButton onClick={handleExport} />}
      </div>

      {/* Tab Switcher */}
      <Tabs
        tabs={[
          { value: 'grid', label: 'Period Grid' },
          { value: 'weekly', label: 'Weekly Syllabus Plan' },
          { value: 'intelligence', label: 'Intelligence Insights' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* ===== PERIOD GRID VIEW ===== */}
      {activeTab === 'grid' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Periods" value={gridTotal} icon={Clock} color="blue" />
            <StatCard title="Completed" value={gridCompleted} icon={CheckCircle} color="green" />
            <StatCard title="Pending" value={gridPending} icon={AlertCircle} color="amber" />
          </div>
          <ProgressBar value={gridCompleted} max={gridTotal} color="blue" />

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                <select
                  value={filters.class}
                  onChange={(e) => setFilters(f => ({ ...f, class: e.target.value }))}
                  className="border rounded-lg px-3 py-2 bg-white w-40"
                >
                  <option value="All">All Classes</option>
                  {filterClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => setFilters(f => ({ ...f, subject: e.target.value }))}
                  className="border rounded-lg px-3 py-2 bg-white w-40"
                >
                  <option value="All">All Subjects</option>
                  {filterSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <select
                  value={selectedMonth.getMonth()}
                  onChange={(e) => {
                    const d = new Date(selectedMonth);
                    d.setMonth(parseInt(e.target.value));
                    setSelectedMonth(d);
                  }}
                  className="border rounded-lg px-3 py-2 bg-white w-40"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Week</label>
                <select
                  value={weeksFromCalendar.indexOf(selectedWeek)}
                  onChange={(e) => setSelectedWeek(weeksFromCalendar[parseInt(e.target.value)])}
                  className="border rounded-lg px-3 py-2 bg-white w-64"
                >
                  {weeksFromCalendar.map((w, i) => (
                    <option key={i} value={i}>
                      {w.label} ({w.start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {w.end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <PermissionWrapper permission={userPermissions?.scheduleEdit}>
            <button
              onClick={() => {
                const pending = schedule.filter(p => p.status !== 'Completed');
                Promise.all(pending.map(p => scheduleApi.markComplete({ id: p.id, status: 'Completed' })))
                  .then(() => loadSchedule());
              }}
              className="btn-secondary"
            >
              Mark All Pending as Completed
            </button>
          </PermissionWrapper>

          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                <div className="bg-white/90 p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-bold text-slate-600">Updating Schedule...</span>
                </div>
              </div>
            )}
            <div className="overflow-auto max-h-[600px] border border-slate-200 rounded-xl">
              <table className="min-w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-slate-50">
                  <tr>
                    <th className="px-2 py-2 border-b border-r text-left text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 sticky left-0 z-30 w-20">Day / Period</th>
                    {periods.map(p => (
                      <th key={p} className="px-2 py-2 border-b border-r text-center text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[100px] bg-slate-50">P{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {days.map((day, i) => (
                    <tr key={day}>
                      <td className="px-2 py-2 border-b border-r font-black text-slate-500 bg-slate-50 text-center sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase tracking-tighter">{day}</span>
                          {getGridDate(i) && (
                            <span className="text-[9px] text-brand-600 font-bold bg-brand-50 px-1 py-0.5 rounded mt-0.5 border border-brand-100">
                              {getGridDate(i)}
                            </span>
                          )}
                        </div>
                      </td>
                      {periods.map(p => {
                        const entry = scheduleMap[day]?.[p];
                        const colors = getSubjectColor(entry?.subject);
                        return (
                          <td
                            key={`${day}-${p}`}
                            className={clsx(
                              "p-1 border-b border-r h-20 align-top transition-colors",
                              entry ? colors.bg : "bg-transparent"
                            )}
                            onClick={() => entry && handleGridStudentClick(entry)}
                          >
                            {(() => {
                              if (!entry) return (
                                <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-100 rounded-lg">
                                  <span className="text-slate-200 text-[10px]">—</span>
                                </div>
                              );
                              
                              // LIVE SYNC: Use weeklyData as the source of truth if syllabus_id matches
                              const liveData = entry.syllabus_id && Array.isArray(weeklyData) ? weeklyData.find(w => w.id === entry.syllabus_id) : null;
                              const displayStatus = liveData ? liveData.status : entry.status;
                              const displayTopic = liveData ? liveData.topic : entry.topic;
                              const displayStudents = liveData ? liveData.students : entry.students;
                              
                              return (
                                <div className={clsx(
                                  "border shadow-sm rounded-lg p-2 h-full flex flex-col gap-0.5 transition-all hover:shadow-md cursor-pointer",
                                  colors.bg,
                                  colors.border,
                                  "hover:border-brand-400"
                                )}>
                                  <div className="flex items-start justify-between gap-1">
                                    <span className={clsx("font-black text-[10px] line-clamp-1 leading-tight", colors.text)}>{entry.subject}</span>
                                    <StatusBadge status={displayStatus} size="sm" />
                                  </div>
                                  <div className={clsx("text-[9px] font-bold px-1 py-0.5 rounded border w-fit", colors.badge, colors.border)}>{entry.class}</div>
                                  {displayTopic && <div className="text-[9px] truncate text-slate-500 font-medium">Topic: {displayTopic}</div>}
                                  <div className="mt-auto">
                                    {(() => {
                                      const studentList = Array.isArray(displayStudents) ? displayStudents : [];
                                      const notDoneList = studentList.filter(s => !s.homework);
                                      const isRed = notDoneList.length > 0;
                                      return (
                                        <div
                                          className={clsx(
                                            "text-[9px] font-bold flex items-center gap-1",
                                            isRed ? "text-red-500" : colors.text
                                          )}
                                        >
                                          <UserX size={9} />
                                          {notDoneList.length} Not Done
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== WEEKLY SYLLABUS PLAN VIEW ===== */}
      {activeTab === 'weekly' && (() => {
        const weeklyColors = getSubjectColor(currentSubjectObj?.name);
        return (
          <div className="space-y-6">
            {/* Class, Section & Subject Selectors */}
            <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class & Section</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="border rounded-lg px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 w-48"
                    >
                      {assignments.classes.map(c => (
                        <option key={`${c.class_number}-${c.section}`} value={`${c.class_number}-${c.section}`}>Class {c.class_number} - {c.section}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="border rounded-lg px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 w-48"
                    >
                      <option value="">Select Subject...</option>
                      {modalSubjects.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Month & Week Filters */}
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                      value={filterMonth}
                      onChange={(e) => { setFilterMonth(e.target.value); setFilterWeek('All'); }}
                      className="border rounded-lg px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 w-40"
                    >
                      <option value="All">All Months</option>
                      {syllabusMetadata.months.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
                    <select
                      value={filterWeek}
                      onChange={(e) => setFilterWeek(e.target.value)}
                      className="border rounded-lg px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 w-48"
                    >
                      <option value="All">All Weeks</option>
                      {syllabusMetadata.syllabus
                        .filter(r => filterMonth === 'All' || r.month === filterMonth)
                        .map(r => (
                          <option key={r.week} value={r.week}>{r.week}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Overall Progress */}
                <div className={clsx("card p-5 border-2", weeklyColors.border)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx("text-sm font-bold uppercase tracking-widest", weeklyColors.text)}>Overall Syllabus Progress</span>
                    <span className={clsx("text-sm font-black", weeklyColors.text)}>{weeklyProgressPercent || 0}%</span>
                  </div>
                  <ProgressBar
                    value={completedWeeklyPeriods || 0}
                    max={totalWeeklyPeriods || 0}
                    color={weeklyColors.text.replace('text-', '').split('-')[0]}
                  />
                  <p className={clsx("text-xs font-medium mt-2", weeklyColors.text)}>
                    {completedWeeklyPeriods || 0} of {totalWeeklyPeriods || 0} periods completed
                  </p>
                </div>

                {/* Weekly Plan Table */}
                <div className={clsx("card p-6 border-2", weeklyColors.border)}>
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div className="flex flex-col gap-1">
                      <h2 className={clsx("text-2xl font-black tracking-tight", weeklyColors.text)}>
                        {currentBaseClassObj?.class_name || ''} - {currentSubjectObj?.name || ''}
                      </h2>
                      <p className="text-sm text-slate-500 font-medium italic">Weekly syllabus plan — edit status, periods needed, and learning status</p>
                    </div>
                  </div>

                  <div className="relative">
                    {weeklyLoading && (
                      <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                        <div className="bg-white/90 p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm font-bold text-slate-600">Updating Plan...</span>
                        </div>
                      </div>
                    )}
                    <DataTable
                      columns={weeklyColumns}
                      rows={(() => {
                        const safeData = Array.isArray(weeklyData) ? weeklyData : [];
                        
                        const filtered = safeData.filter(item => {
                          const normalize = (value) => 
                            String(value || '').toLowerCase().replace(/\s+/g, '').replace(/-/g, '');

                          // CLASS MATCH (Strict ID)
                          const selectedClassObj = assignments.classes.find(c => 
                            normalize(`${c.class_number}-${c.section}`) === normalize(selectedClass)
                          );
                          const matchClass =
                            !selectedClass ||
                            selectedClass === "All" ||
                            (selectedClassObj && 
                             Number(item.class_id) === Number(selectedClassObj.class_id) && 
                             (!item.section_id || Number(item.section_id) === Number(selectedClassObj.section_id)));

                          // SUBJECT MATCH (Strict ID)
                          const matchSubject =
                            !selectedSubject ||
                            selectedSubject === "All" ||
                            Number(item.subject_id) === Number(selectedSubject);

                          // WEEK MATCH
                          const matchWeek =
                            !filterWeek ||
                            filterWeek === "All" ||
                            filterWeek === "All Weeks" ||
                            normalize(item.week) === normalize(filterWeek);

                          // MONTH SAFE (OPTIONAL FIELD)
                          const matchMonth =
                            filterMonth === "All" ||
                            filterMonth === "All Months" ||
                            !item.month ||
                            normalize(item.month) === normalize(filterMonth);

                          const isMatched = matchClass && matchSubject && matchWeek && matchMonth;
                          
                          if (!isMatched && safeData.length > 0) {
                             console.log(`[FILTER DEBUG] Hiding Topic: ${item.topic}`, {
                               matchClass, matchSubject, matchWeek, matchMonth,
                               item: { cid: item.class_id, sid: item.subject_id, week: item.week, month: item.month },
                               filters: { class: selectedClass, sub: selectedSubject, week: filterWeek, month: filterMonth }
                             });
                          }

                          return isMatched;
                        });

                        // DEBUG RULE (MANDATORY)
                        console.log("RAW DB DATA:", safeData);
                        console.log("FILTERS:", {
                          selectedClass,
                          selectedSubject,
                          filterMonth,
                          filterWeek
                        });

                        return filtered;
                      })()}
                      emptyMessage={
                        weeklyError ? (
                          <div className="flex flex-col items-center gap-2 text-rose-500 font-bold p-8">
                            <AlertCircle size={32} />
                            <span>Backend SQL Error</span>
                            <p className="text-xs font-medium text-slate-400">{weeklyError}</p>
                          </div>
                        ) : safeData.length > 0
                          ? "No items match the current month/week filters."
                          : "No syllabus topics found for this class and subject."
                      }
                      loading={false} // Handled by our own loader
                      pagination={true}
                      pageSize={10}
                    />
                    
                    {/* Save All Footer Button */}
                    <div className="mt-8 flex justify-center border-t border-slate-100 pt-6">
                      <button
                        onClick={handleSaveAllWeekly}
                        disabled={weeklyLoading || safeData.length === 0}
                        className="flex items-center gap-2 px-8 py-3 bg-brand-600 text-white font-black rounded-xl hover:bg-brand-700 active:scale-95 transition-all shadow-lg shadow-brand-200 disabled:opacity-50 disabled:scale-100"
                      >
                        {weeklyLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save All Changes
                      </button>
                    </div>
                  </div>
                </div>
          </div>
        );
      })()}

      {/* ===== INTELLIGENCE INSIGHTS VIEW ===== */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              title="Topics at High Risk" 
              value={intelData.filter(t => t.risk_level === 'HIGH').length} 
              icon={AlertCircle} 
              color="red" 
            />
            <StatCard 
              title="Average Completion Rate" 
              value={`${intelData.length > 0 ? Math.round(intelData.reduce((a,b) => a + b.completion_rate, 0) / intelData.length) : 0}%`} 
              icon={TrendingUp} 
              color="blue" 
            />
            <StatCard 
              title="Total Not Done Cases" 
              value={intelData.reduce((a,b) => a + b.not_done_students, 0)} 
              icon={UserX} 
              color="amber" 
            />
          </div>

          <div className="card p-6">
            <SectionHeader 
              title="Topic-Wise Failure Tracking" 
              subtitle="Analysis of completion rates and student backlogs per topic" 
            />
            
            <div className="mt-6 overflow-hidden border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Topic / Class</th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Completion Rate</th>
                    <th className="px-6 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Level</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Students Pending</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {intelLoading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm font-medium text-slate-400">Computing Intelligence...</span>
                        </div>
                      </td>
                    </tr>
                  ) : intelData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-slate-400 text-sm italic">
                        No execution data available for analysis.
                      </td>
                    </tr>
                  ) : (
                    intelData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{item.topic}</span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {item.class} · {item.subject} · {item.week}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className={clsx(
                              "text-sm font-black",
                              item.completion_rate >= 80 ? "text-emerald-600" : item.completion_rate >= 50 ? "text-amber-600" : "text-rose-600"
                            )}>
                              {item.completion_rate}%
                            </span>
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={clsx(
                                  "h-full rounded-full transition-all duration-500",
                                  item.completion_rate >= 80 ? "bg-emerald-500" : item.completion_rate >= 50 ? "bg-amber-500" : "bg-rose-500"
                                )}
                                style={{ width: `${item.completion_rate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={clsx(
                            "text-[10px] font-black px-2 py-1 rounded-lg border",
                            item.risk_level === 'HIGH' ? "bg-rose-50 text-rose-700 border-rose-200" :
                            item.risk_level === 'MEDIUM' ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}>
                            {item.risk_level}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.not_done_list.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {item.not_done_list.slice(0, 3).map((stu, idx) => (
                                <span key={idx} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                  {stu.name}
                                </span>
                              ))}
                              {item.not_done_list.length > 3 && (
                                <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                                  +{item.not_done_list.length - 3} More
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle size={14} /> 100% Submission
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Student Tracker Modal (only for grid view) */}

      {/* Weekly Plan Student Tracker Modal */}
      {selectedWeeklyRow && (
        <StudentTrackerModal
          period={{
            subject: currentSubjectObj?.name || selectedSubject,
            class: currentBaseClassObj?.class_name || selectedClass,
            week: selectedWeeklyRow.week,
            dateRange: selectedWeeklyRow.dateRange,
            students: selectedWeeklyRow.students || []
          }}
          onClose={() => setSelectedWeeklyRow(null)}
          onSave={(students) => handleWeeklyStudentsChange(selectedWeeklyRow.id, students)}
          canEdit={true}
        />
      )}

      {selectedGridEntry && (
        <StudentTrackerModal
          period={{
            subject: selectedGridEntry.subject,
            class: selectedGridEntry.class,
            week: syllabusWeeks.find(w => w.value === filters.week)?.label || filters.week,
            students: selectedGridEntry.students || []
          }}
          onClose={() => setSelectedGridEntry(null)}
          onSave={() => { }}
          canEdit={false}
        />
      )}


    </div>
  );
}