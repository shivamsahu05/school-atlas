import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatCard, ProgressBar, SectionHeader, Tabs } from '../../components/ui';
import DataTable from '../../components/ui/DataTable';
import { Clock, CheckCircle, AlertCircle, Users, BookOpen, Notebook, Download, RotateCcw, Search } from 'lucide-react';
import { fetchCompletionReport, getTeacherOrDefault } from '../../data/mockAPI';

export default function CompletionReport() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]); // aggregated student records
  
  // Initialize filters from URL if available
  const [filters, setFilters] = useState({
    class: searchParams.get('class') || 'All',
    section: 'All', // We split class/section in the tracker so this is 'All' for now
    subject: searchParams.get('subject') || 'All',
    week: 'Current'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Teacher/Admin data
  const mockTeacher = getTeacherOrDefault(user?.id);
  const assignedClasses = user?.assignedClasses || mockTeacher?.assignedClasses || [];
  const assignedSubjects = user?.assignedSubjects || mockTeacher?.assignedSubjects || [];
  const isAdmin = user?.role === 'admin' || mockTeacher?.role === 'admin';

  // Extract unique base classes and sections
  const uniqueBaseClasses = [...new Set(assignedClasses.map(c => c.replace(/[A-Z]$/, '')))];
  const currentBaseClass = filters.class !== 'All' ? filters.class : '';
  const availableSections = currentBaseClass
    ? assignedClasses.filter(c => c.startsWith(currentBaseClass)).map(c => c.replace(currentBaseClass, ''))
    : [];

  // Weeks options
  const weekOptions = ['Current', 'Last Week', 'Week 1', 'Week 2', 'Week 3', 'Week 4'];

  // Load report data
  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await fetchCompletionReport({
        teacherId: isAdmin ? null : user.id,
        ...filters
      });
      setReportData(data);
    } catch (error) {
      console.error('Failed to load completion report', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [filters]);

  const resetFilters = () => {
    setFilters({ class: 'All', section: 'All', subject: 'All', week: 'Current' });
    setSearchTerm('');
  };

  const exportCSV = () => {
    const headers = ['Student Name', 'Class', 'Section', 'Subject', 'Week', 'Homework', 'Notebook', 'Teacher Audit', 'Last Updated'];
    const rows = filteredData.map(s => [
      s.studentName, s.class, s.section, s.subject, s.week, 
      s.homeworkComplete ? 'Complete' : 'Pending',
      s.notebookComplete ? 'Checked' : 'Pending',
      s.teacherChecked ? 'Verified' : 'Not Verified',
      s.lastUpdated ? new Date(s.lastUpdated).toLocaleDateString() : '—'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Completion_Report_${filters.class}_${filters.subject}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter by search term
  const filteredData = reportData.filter(s => 
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const totalStudents = filteredData.length;
  const homeworkComplete = filteredData.filter(s => s.homeworkComplete).length;
  const notebookComplete = filteredData.filter(s => s.notebookComplete).length;
  const bothComplete = filteredData.filter(s => s.homeworkComplete && s.notebookComplete).length;
  const incompleteStudents = filteredData.filter(s => !s.homeworkComplete || !s.notebookComplete);

  // Table columns
  const columns = [
    { key: 'studentName', label: 'Student Name', sortable: true },
    { key: 'class', label: 'Class', sortable: true },
    { key: 'section', label: 'Section', sortable: true },
    { key: 'subject', label: 'Subject', sortable: true },
    { key: 'week', label: 'Week', sortable: true },
    {
      key: 'teacherChecked',
      label: 'Teacher Audit',
      render: (value) => (
        <div className="flex items-center gap-2">
          {value ? (
            <CheckCircle className="text-emerald-500" size={16} />
          ) : (
            <AlertCircle className="text-amber-500" size={16} />
          )}
          <span className={`text-xs font-semibold ${value ? 'text-emerald-700' : 'text-amber-700'}`}>
            {value ? 'Verified' : 'Not Verified'}
          </span>
        </div>
      )
    },
    {
      key: 'homeworkComplete',
      label: 'Homework',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Complete' : 'Incomplete'}
        </span>
      )
    },
    {
      key: 'notebookComplete',
      label: 'Notebook',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Checked' : 'Pending'}
        </span>
      )
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (value) => value ? new Date(value).toLocaleDateString() : '—'
    }
  ];

  // Incomplete students shown first
  const sortedData = [...reportData].sort((a, b) => {
    const aIncomplete = !a.homeworkComplete || !a.notebookComplete ? 1 : 0;
    const bIncomplete = !b.homeworkComplete || !b.notebookComplete ? 1 : 0;
    return bIncomplete - aIncomplete;
  });

  if (!user) return <div className="p-8 text-center">Loading user...</div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Homework & Notebook Completion Report</h1>
          <p className="text-sm text-slate-500">Student-level tracking and verification audit</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetFilters}
            className="p-2.5 text-slate-400 hover:text-brand-600 rounded-xl hover:bg-brand-50 transition-all border border-slate-100"
            title="Reset Filters"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={exportCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-5">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Class</label>
              <select
                value={filters.class}
                onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value, section: 'All' }))}
                className="border border-slate-200 rounded-xl px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 text-sm font-medium w-40"
              >
                <option value="All">All Classes</option>
                {uniqueBaseClasses.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Section</label>
              <select
                value={filters.section}
                onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
                disabled={filters.class === 'All'}
                className="border border-slate-200 rounded-xl px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 text-sm font-medium w-32 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="All">All Sections</option>
                {availableSections.map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Subject</label>
              <select
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
                className="border border-slate-200 rounded-xl px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 text-sm font-medium w-48"
              >
                <option value="All">All Subjects</option>
                {assignedSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Week</label>
              <select
                value={filters.week}
                onChange={(e) => setFilters(prev => ({ ...prev, week: e.target.value }))}
                className="border border-slate-200 rounded-xl px-4 py-2 bg-white shadow-sm focus:ring-2 focus:ring-brand-500 text-sm font-medium w-40"
              >
                {weekOptions.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full lg:w-64 pb-0.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Search Student</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Homework Complete"
          value={homeworkComplete}
          icon={BookOpen}
          color="green"
        />
        <StatCard
          title="Notebook Checked"
          value={notebookComplete}
          icon={Notebook}
          color="purple"
        />
        <StatCard
          title="Both Complete"
          value={bothComplete}
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      {/* Progress Bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Completion</span>
          <span className="text-sm font-semibold text-gray-800">
            {totalStudents ? Math.round((bothComplete / totalStudents) * 100) : 0}%
          </span>
        </div>
        <ProgressBar
          value={bothComplete}
          max={totalStudents}
          color="blue"
        />
      </div>

      {/* Incomplete Students Highlight */}
      {incompleteStudents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-amber-600" size={20} />
            <h2 className="font-semibold text-amber-800">
              Students with Incomplete Work ({incompleteStudents.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {incompleteStudents.slice(0, 10).map(student => (
              <div key={student.id} className="bg-white p-2 rounded shadow-sm text-sm">
                <span className="font-medium">{student.studentName}</span>
                <span className="text-gray-500 ml-2">({student.class}-{student.section})</span>
                <div className="text-xs mt-1">
                  {!student.homeworkComplete && <span className="text-red-600 mr-2">Homework missing ({student.subject})</span>}
                  {!student.notebookComplete && <span className="text-red-600">Notebook unchecked ({student.subject})</span>}
                </div>
              </div>
            ))}
            {incompleteStudents.length > 10 && (
              <div className="text-sm text-gray-500 p-2">
                ...and {incompleteStudents.length - 10} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Table */}
      <div className="card p-6">
        <SectionHeader
          title="Detailed Student Report"
          subtitle="Homework and notebook completion status by student"
        />
        <DataTable
          columns={columns}
          rows={sortedData}
          loading={loading}
          pagination={true}
          pageSize={15}
          emptyMessage="No data found for the selected filters"
        />
      </div>
    </div>
  );
}