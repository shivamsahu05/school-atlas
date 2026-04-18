import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import PermissionWrapper from '../../components/common/PermissionWrapper';
import FiltersBar from '../../components/common/FiltersBar';
import ExportButton from '../../components/common/ExportButton';
import { StatCard, ProgressBar, StatusBadge, SectionHeader, Tabs } from '../../components/ui';
import DataTable from '../../components/ui/DataTable';
import { Clock, CheckCircle, AlertCircle, Users, Save, Check, XCircle, Edit2 } from 'lucide-react';
import {
  fetchSchedule,
  updatePeriodStatus,
  updateStudentProgress,
  bulkMarkCompleted,
  fetchWeeklySyllabus,
  updateWeeklyPlan,
  getTeacherOrDefault
} from '../../data/mockAPI';
import StudentTrackerModal from './StudentTrackerModal';
import * as XLSX from 'xlsx';

const STATUS_OPTIONS = ['Completed', 'In Progress', 'Pending', 'Not Started'];
const LEARNING_STATUS_OPTIONS = ['Approaching', 'Meeting', 'Exceeding'];
const NOTEBOOK_CHECKED_OPTIONS = ['Yes', 'No'];

export default function TeacherSchedule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' or 'weekly'
  const [schedule, setSchedule] = useState([]);
  const [filters, setFilters] = useState({ class: 'All', subject: 'All', week: 'Current' });
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [selectedWeeklyRow, setSelectedWeeklyRow] = useState(null);
  const [loading, setLoading] = useState(true);

  // Weekly syllabus specific states
  const [weeklyData, setWeeklyData] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
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
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterWeek, setFilterWeek] = useState('All');

  // Get mock teacher data as fallback for missing fields
  const mockTeacher = getTeacherOrDefault(user?.id);
  const assignedClasses = user?.assignedClasses || mockTeacher?.assignedClasses || [];
  const assignedSubjects = user?.assignedSubjects || mockTeacher?.assignedSubjects || [];
  const userPermissions = user?.permissions || mockTeacher?.permissions || {};

  // Set initial class/subject for weekly view
  useEffect(() => {
    if (assignedClasses.length > 0 && !selectedClass) {
      setSelectedClass(assignedClasses[0]);
    }
    if (assignedSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(assignedSubjects[0]);
    }
  }, [assignedClasses, assignedSubjects]);

  // Load period grid schedule
  const loadSchedule = () => {
    setLoading(true);
    fetchSchedule(user.id, filters)
      .then(data => {
        setSchedule(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'grid') {
      loadSchedule();
    }
  }, [user, filters, activeTab]);

  // Load weekly syllabus data
  const loadWeeklyData = async () => {
    if (!selectedClass || !selectedSubject) return;
    setWeeklyLoading(true);
    try {
      const data = await fetchWeeklySyllabus(user.id, selectedClass, selectedSubject);
      const initializedData = data.map(row => ({
        ...row,
        status: row.status || 'Pending',
        periodsNeeded: row.periodsNeeded ?? row.periods,
        learningStatus: row.learningStatus || 'Meeting',
        teacherNotebookChecked: row.teacherNotebookChecked || 'No',
        learningOutcome: row.learningOutcome || '',
        // Ensure students array exists and each has notebook property
        students: (row.students || []).map(s => ({ ...s, notebook: s.notebook ?? false }))
      }));
      setWeeklyData(initializedData);
    } catch (error) {
      console.error('Failed to load weekly syllabus', error);
    } finally {
      setWeeklyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'weekly' && selectedClass && selectedSubject) {
      loadWeeklyData();
    }
  }, [activeTab, selectedClass, selectedSubject]);

  // Period grid calculations
  const total = schedule.length;
  const completed = schedule.filter(p => p.status === 'Completed').length;
  const pending = total - completed;

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
      const updated = prevData.map(r => {
        if (r.id !== id) return r;

        const updatedRow = { ...r, [field]: value };

        // Bulk update: if teacherNotebookChecked changes to "Yes", mark all students' notebooks as checked
        if (field === 'teacherNotebookChecked' && value === 'Yes') {
          updatedRow.students = (r.students || []).map(student => ({
            ...student,
            notebook: true
          }));
        }

        return updatedRow;
      });
      return updated;
    });
  };

  const handleBulkNotebookCheck = (status) => {
    setWeeklyData(prevData => prevData.map(row => {
      // Only update rows that match current filters
      const matchesMonth = filterMonth === 'All' || row.month === filterMonth;
      const matchesWeek = filterWeek === 'All' || row.week === filterWeek;
      
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

  const handleSaveRow = async (id) => {
    const row = weeklyData.find(r => r.id === id);
    if (!row) return;
    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
    try {
      await updateWeeklyPlan(row.id, {
        status: row.status,
        periodsNeeded: row.periodsNeeded,
        learningStatus: row.learningStatus,
        homeworkStatus: row.homeworkStatus,
        students: row.students,
        teacherNotebookChecked: row.teacherNotebookChecked,
        learningOutcome: row.learningOutcome,
      });
      setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
      lockRow(row.id); // Lock fields upon successful save
      setTimeout(() => {
        setSaveStatus(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 2000);
    } catch (error) {
      setSaveStatus(prev => ({ ...prev, [id]: 'error' }));
    }
  };

  const handleSaveAllWeekly = async () => {
    const promises = weeklyData.map(row => handleSaveRow(row.id));
    await Promise.all(promises);
  };

  // Weekly syllabus progress
  const totalWeeklyPeriods = weeklyData.reduce((sum, row) => sum + (row.periods || 0), 0);
  const completedWeeklyPeriods = weeklyData
    .filter(row => row.status === 'Completed')
    .reduce((sum, row) => sum + (row.periods || 0), 0);
  const weeklyProgressPercent = totalWeeklyPeriods
    ? Math.round((completedWeeklyPeriods / totalWeeklyPeriods) * 100)
    : 0;

  // Split class / section
  const uniqueBaseClasses = [...new Set(assignedClasses.map(c => c.replace(/[A-Z]$/, '')))];
  const currentBaseClass = selectedClass ? selectedClass.replace(/[A-Z]$/, '') : '';
  const currentSection = selectedClass ? selectedClass.replace(/^[0-9]+/, '') : '';
  const availableSections = currentBaseClass
    ? assignedClasses.filter(c => c.startsWith(currentBaseClass)).map(c => c.replace(currentBaseClass, ''))
    : [];

  const weeklyColumns = [
    { key: 'month', label: 'Month', sortable: true },
    { key: 'week', label: 'Week', sortable: true },
    { key: 'periods', label: 'Periods' },
    { key: 'chapter', label: 'Chapter' },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        !lockedRows.has(row.id) ? (
          <select
            value={value}
            onChange={(e) => handleWeeklyFieldChange(row.id, 'status', e.target.value)}
            className="border rounded px-2 py-1 text-sm bg-white w-full"
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
            className="border rounded px-2 py-1 text-sm w-24"
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
            className="border rounded px-2 py-1 text-sm bg-white w-full"
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
        return (
          <div className="space-y-1">
            {!lockedRows.has(row.id) ? (
              <select
                value={value}
                onChange={(e) => handleWeeklyFieldChange(row.id, 'teacherNotebookChecked', e.target.value)}
                className={clsx(
                  "border rounded px-2 py-1 text-sm w-full transition-colors font-medium",
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
            
            {value === 'No' && missingCount > 0 && (
              <button
                onClick={() => setSelectedWeeklyRow(row)}
                className="text-[10px] text-brand-600 hover:text-brand-800 underline block font-semibold px-1"
              >
                Select Students ({missingCount} missing)
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
            className="border rounded px-2 py-1 text-sm w-full"
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
      render: (value, row) => (
        <div className="space-y-1">
          {!lockedRows.has(row.id) ? (
            <select
              value={value}
              onChange={(e) => handleWeeklyFieldChange(row.id, 'homeworkStatus', e.target.value)}
              className="border rounded px-2 py-1 text-sm bg-white w-full"
            >
              <option value="Complete">Complete</option>
              <option value="Incomplete">Incomplete</option>
            </select>
          ) : (
            <span className={clsx(
              "px-2 py-1 rounded text-xs font-bold inline-block",
              value === 'Complete' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            )}>
              {value}
            </span>
          )}
          
          {value === 'Incomplete' && (
            <button
              onClick={() => setSelectedWeeklyRow(row)}
              className="text-xs text-brand-600 hover:text-brand-800 underline block"
            >
              Select Students ({row.students?.filter(s => !s.homework).length || 0} missing)
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, row) => {
        const isEditing = !lockedRows.has(row.id);
        const status = saveStatus[row.id];
        return (
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => unlockRow(row.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-indigo-600"
              >
                <Edit2 size={14} /> Edit
              </button>
            ) : (
              <button
                onClick={() => handleSaveRow(row.id)}
                disabled={status === 'saving'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition
                  ${status === 'saved' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-200'}
                  disabled:opacity-50`}
              >
                {status === 'saving' ? (
                  <>Saving...</>
                ) : status === 'saved' ? (
                  <><Check size={14} /> Saved</>
                ) : (
                  <><Save size={14} /> Save</>
                )}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (!user) return <div className="p-8 text-center text-slate-400">Loading user...</div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">Micro Schedule</h1>
        {activeTab === 'grid' && <ExportButton onClick={handleExport} />}
      </div>

      {/* Tab Switcher */}
      <Tabs
        tabs={[
          { value: 'grid', label: 'Period Grid' },
          { value: 'weekly', label: 'Weekly Syllabus Plan' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* ===== PERIOD GRID VIEW ===== */}
      {activeTab === 'grid' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Periods" value={total} icon={Clock} color="blue" />
            <StatCard title="Completed" value={completed} icon={CheckCircle} color="green" />
            <StatCard title="Pending" value={pending} icon={AlertCircle} color="amber" />
          </div>
          <ProgressBar value={completed} max={total} color="blue" />

          <FiltersBar
            filters={filters}
            onChange={setFilters}
            classes={assignedClasses}
            subjects={assignedSubjects}
            showWeek
          />

          <PermissionWrapper permission={userPermissions?.scheduleEdit}>
            <button
              onClick={() => bulkMarkCompleted(user.id, filters).then(() => loadSchedule())}
              className="btn-secondary"
            >
              Mark All Pending as Completed
            </button>
          </PermissionWrapper>

          {loading ? (
            <div className="p-8 text-center">Loading schedule...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 border text-left text-xs font-medium text-gray-500 uppercase">Day/Period</th>
                    {periods.map(p => (
                      <th key={p} className="p-3 border text-center text-xs font-medium text-gray-500 uppercase">P{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {days.map(day => (
                    <tr key={day}>
                      <td className="p-3 border font-medium text-sm bg-gray-50">{day}</td>
                      {periods.map(period => {
                        const entry = scheduleMap[day]?.[period];
                        if (!entry) return <td key={period} className="p-3 border text-center text-gray-400 text-sm">—</td>;
                        return (
                          <td key={period} className="p-2 border">
                            <div
                              className="cursor-pointer hover:shadow-md rounded-lg p-2 bg-gray-50 transition"
                              onClick={() => setSelectedPeriod(entry)}
                            >
                              <div className="font-semibold text-sm">{entry.subject}</div>
                              <div className="text-xs text-gray-600">{entry.class}</div>
                              <div className="text-xs truncate text-gray-500">{entry.chapter}</div>
                              <div className="mt-1"><StatusBadge status={entry.status} /></div>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Users size={12} /> {entry.students?.length || 0}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ===== WEEKLY SYLLABUS PLAN VIEW ===== */}
      {activeTab === 'weekly' && (
        <>
          {/* Class, Section & Subject Selectors */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select
                value={currentBaseClass}
                onChange={(e) => {
                  const newBase = e.target.value;
                  const firstSec = assignedClasses.filter(c => c.startsWith(newBase)).map(c => c.replace(newBase, ''))[0];
                  setSelectedClass(newBase + firstSec);
                }}
                className="border rounded-lg px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 w-32"
              >
                {uniqueBaseClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={currentSection}
                onChange={(e) => setSelectedClass(currentBaseClass + e.target.value)}
                className="border rounded-lg px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 w-32"
              >
                {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border rounded-lg px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 w-48"
              >
                {assignedSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
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
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
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
                {[...new Set(weeklyData.filter(r => filterMonth === 'All' || r.month === filterMonth).map(r => r.week).filter(Boolean))].map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Syllabus Progress</span>
              <span className="text-sm font-semibold text-gray-800">{weeklyProgressPercent}%</span>
            </div>
            <ProgressBar value={completedWeeklyPeriods} max={totalWeeklyPeriods} color="blue" />
            <p className="text-xs text-gray-500 mt-2">
              {completedWeeklyPeriods} of {totalWeeklyPeriods} periods completed
            </p>
          </div>

          {/* Weekly Plan Table */}
          <div className="card p-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <SectionHeader
                title={`${selectedClass} - ${selectedSubject}`}
                subtitle="Weekly syllabus plan — edit status, periods needed, and learning status"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkNotebookCheck('Yes')}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-100"
                >
                  <CheckCircle size={16} /> Mark All Checked
                </button>
                <button
                  onClick={() => handleBulkNotebookCheck('No')}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-rose-100"
                >
                  <XCircle size={16} /> Mark All Unchecked
                </button>
              </div>
            </div>
            <DataTable
              columns={weeklyColumns}
              rows={weeklyData.filter(r => {
                if (filterMonth !== 'All' && r.month !== filterMonth) return false;
                if (filterWeek !== 'All' && r.week !== filterWeek) return false;
                return true;
              })}
              loading={weeklyLoading}
              pagination={true}
              pageSize={10}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-secondary" onClick={loadWeeklyData}>Reset</button>
              <button className="btn-primary" onClick={handleSaveAllWeekly}>
                Save All Changes
              </button>
            </div>
          </div>
        </>
      )}

      {/* Student Tracker Modal (only for grid view) */}
      {selectedPeriod && (
        <StudentTrackerModal
          period={selectedPeriod}
          onClose={() => setSelectedPeriod(null)}
          onSave={(students) => {
            updateStudentProgress(selectedPeriod.id, students).then(() => {
              loadSchedule();
              setSelectedPeriod(null);
            });
          }}
          canEdit={userPermissions?.studentTracking?.enabled}
        />
      )}

      {/* Week Student Tracker Modal */}
      {selectedWeeklyRow && (
        <StudentTrackerModal
          period={{
            subject: selectedSubject,
            class: selectedClass,
            students: selectedWeeklyRow.students || []
          }}
          onClose={() => setSelectedWeeklyRow(null)}
          onSave={(students) => handleWeeklyStudentsChange(selectedWeeklyRow.id, students)}
          canEdit={true}
        />
      )}
    </div>
  );
}