import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Tabs, Modal } from '../../components/ui/index.jsx';
import WeeklySyllabusPlan from '../../components/teacher/WeeklySyllabusPlan';
import IntelligenceInsights from '../../components/teacher/IntelligenceInsights';
import { Plus, Download, Upload, Loader2 } from 'lucide-react';
import { syllabusApi, classesApi, academicApi, teachersApi } from '../../api';
import { MONTHS } from '../../data/constants';

export default function AdminSchedule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [classes, setClasses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('All');
  const [acadSections, setAcadSections] = useState([]);
  const [acadSubjects, setAcadSubjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  // Bulk upload override drop downs
  const [bulkTeacherId, setBulkTeacherId] = useState('');
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkSectionId, setBulkSectionId] = useState('');
  const [bulkSubjectId, setBulkSubjectId] = useState('');
  const [bulkSections, setBulkSections] = useState([]);
  const [bulkSubjects, setBulkSubjects] = useState([]);

  const handleBulkClassChange = async (classId) => {
    setBulkClassId(classId);
    setBulkSectionId('');
    setBulkSubjectId('');
    if (!classId) {
      setBulkSections([]);
      setBulkSubjects([]);
      return;
    }
    try {
      const [secRes, subRes] = await Promise.all([
        academicApi.getClassSections(classId),
        academicApi.getClassSubjects(classId)
      ]);
      setBulkSections(secRes.data || secRes.sections || []);
      setBulkSubjects(subRes.data || subRes.subjects || []);
    } catch (err) {
      console.error('Failed to load class data for bulk:', err);
    }
  };

  const INITIAL_FORM = {
    teacher_id: '', class_id: '', subject_id: '', section_id: '', chapter: '', topic: '',
    month: 'May', week: 'Week 1', periods: 1, learning_outcome: '',
    planned_start_date: '', planned_end_date: '', is_completed: false
  };
  const [form, setForm] = useState(INITIAL_FORM);
  const [editId, setEditId] = useState(null);

  // Fetch static metadata on mount
  useEffect(() => {
    Promise.all([
      academicApi.getClasses(),
      classesApi.getSubjects(),
      teachersApi.getAll()
    ]).then(([clsRes, subRes, teaRes]) => {
      const clsList = Array.isArray(clsRes.data) ? clsRes.data : (clsRes.classes || clsRes.data?.items || []);
      setClasses(clsList);
      const teaList = teaRes.data?.items || teaRes.items || [];
      setAllTeachers(teaList);
    }).catch(console.error);
  }, []);

  const loadClassData = async (classId) => {
    if (!classId) {
      setAcadSections([]);
      setAcadSubjects([]);
      return;
    }
    try {
      const [secRes, subRes] = await Promise.all([
        academicApi.getClassSections(classId),
        academicApi.getClassSubjects(classId)
      ]);
      setAcadSections(secRes.data || secRes.sections || []);
      setAcadSubjects(subRes.data || subRes.subjects || []);
    } catch (err) {
      console.error('Failed to load class data:', err);
    }
  };

  const handleClassChange = async (classId) => {
    setForm(f => ({ ...f, class_id: classId, section_id: '', subject_id: '' }));
    await loadClassData(classId);
  };

  // Auto-calculate dates based on month and week selection
  useEffect(() => {
    if (!form.week || !form.month) return;

    const calculateDates = (monthStr, weekStr) => {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const mIdx = months.indexOf(monthStr);
      if (mIdx === -1) return { start: '', end: '' };

      const year = new Date().getFullYear();
      const weekNum = parseInt(weekStr.replace(/\D/g, '')) || 1;

      const startDay = (weekNum - 1) * 7 + 1;
      let endDay = weekNum * 7;

      const lastDayOfMonth = new Date(year, mIdx + 1, 0).getDate();
      if (startDay > lastDayOfMonth) return { start: '', end: '' };
      if (endDay > lastDayOfMonth) endDay = lastDayOfMonth;

      const fmt = (d) => `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { start: fmt(startDay), end: fmt(endDay) };
    };

    const { start, end } = calculateDates(form.month, form.week);
    if (start && end) {
      setForm(f => ({ ...f, planned_start_date: start, planned_end_date: end }));
    }
  }, [form.week, form.month]);

  const handleModalOpen = () => {
    setForm(INITIAL_FORM);
    setEditId(null);
    setAcadSections([]);
    setAcadSubjects([]);
    setModalOpen(true);
  };

  const handleEditOpen = async (row) => {
    setEditId(row.id);
    setForm({
      teacher_id: row.teacher_id || '',
      class_id: row.class_id || '',
      section_id: row.section_id || '',
      subject_id: row.subject_id || '',
      chapter: row.chapter || '',
      topic: row.topic || '',
      month: row.month || 'May',
      week: row.week || 'Week 1',
      periods: row.periods || 1,
      learning_outcome: row.learning_outcome || '',
      planned_start_date: row.planned_start_date ? row.planned_start_date.slice(0, 10) : '',
      planned_end_date: row.planned_end_date ? row.planned_end_date.slice(0, 10) : '',
      is_completed: row.is_completed === 1 || row.is_completed === true,
      status: row.status || (row.is_completed ? 'completed' : 'pending')
    });
    await loadClassData(row.class_id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.class_id || !form.subject_id || !form.topic || !form.teacher_id) {
      alert('Teacher, Class, subject and topic are required.');
      return;
    }

    try {
      setSubmitting(true);
      const selectedClass = classes.find(c => c.id === Number(form.class_id));
      const sectionObj = acadSections.find(s => s.section_id === Number(form.section_id));

      const payload = {
        ...form,
        className: selectedClass?.name,
        sectionName: sectionObj?.section_name || sectionObj?.name || sectionObj?.code
      };

      if (editId) {
        await syllabusApi.update(editId, payload);
        alert('✅ Updated Successfully');
      } else {
        await syllabusApi.create(payload);
        alert('✅ Created Successfully');
      }
      setModalOpen(false);
      setForm(INITIAL_FORM);
      setEditId(null);
      setAcadSections([]);
      setAcadSubjects([]);

      // Refresh current views
      window.dispatchEvent(new Event('syllabus-updated'));
      window.dispatchEvent(new Event('insights-refresh'));
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${editId ? 'update' : 'add'} topic.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await syllabusApi.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'syllabus_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download template.');
    }
  };

  const resetBulk = () => {
    setUploadFile(null);
    setBulkTeacherId('');
    setBulkClassId('');
    setBulkSectionId('');
    setBulkSubjectId('');
    setBulkSections([]);
    setBulkSubjects([]);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (bulkTeacherId) formData.append('teacher_id', bulkTeacherId);
      if (bulkClassId) formData.append('class_id', bulkClassId);
      if (bulkSectionId) formData.append('section_id', bulkSectionId);
      if (bulkSubjectId) formData.append('subject_id', bulkSubjectId);

      const res = await syllabusApi.bulkUpload(formData);
      alert(res.message || 'Bulk upload successful!');
      setBulkModalOpen(false);
      resetBulk();
      window.dispatchEvent(new Event('syllabus-updated'));
      window.dispatchEvent(new Event('insights-refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload syllabus.');
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      setSubmitting(true);
      const res = await syllabusApi.exportPlan({});
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `syllabus_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export syllabus.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <div className="p-4 text-center text-slate-400">Loading...</div>;

  return (
<<<<<<< HEAD
    <div className="space-y-8 animate-fade-in p-4 sm:p-8">
=======
    <div className="space-y-8 animate-fade-in py-2 sm:py-4 px-0">
>>>>>>> ab32a4a (Added marks management, schedule and syllabus report modules)
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Admin Micro Schedule</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            {activeTab === 'all' && 'Overview of All Schedules'}
            {activeTab === 'insights' && 'Teaching Intelligence & Analytics'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="btn bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <Download size={16} className="text-emerald-500" /> Template
          </button>
          <button
            onClick={() => setBulkModalOpen(true)}
            className="btn bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <Upload size={16} className="text-brand-500" /> Bulk Upload
          </button>
          <button
            onClick={handleExport}
            className="btn bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            <Download size={16} className="text-amber-500" /> Export
          </button>
          <button
            onClick={handleModalOpen}
            className="btn bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-100 flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Add Micro Schedule Topic
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-1">
        <Tabs
          tabs={[
            { value: 'all', label: 'All Micro Schedule' },
            { value: 'insights', label: 'Intelligence Insights' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {activeTab !== 'insights' && (
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm min-w-[220px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Choose Teacher:</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="w-full bg-transparent border-none text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:ring-0 py-1"
            >
              <option value="All">All Teachers</option>
              {allTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-8 transition-all duration-300">
        {activeTab === 'all' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WeeklySyllabusPlan isAllView={true} filterTeacherId={selectedTeacherId} onEditClick={handleEditOpen} />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <IntelligenceInsights />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Micro Schedule" : "Add Micro Schedule"} size="lg">
        <div className="p-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Assigned Teacher *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  value={form.teacher_id}
                  onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                  required
                >
                  <option value="">Select teacher…</option>
                  {allTeachers.map(t => <option key={t.id} value={t.id}>{t.name} (ID: {t.id})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Class *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  value={form.class_id}
                  onChange={e => handleClassChange(e.target.value)}
                  required
                >
                  <option value="">Select class…</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Section *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={form.section_id || ''}
                  onChange={e => setForm(f => ({ ...f, section_id: e.target.value }))}
                  required
                  disabled={!form.class_id}
                >
                  <option value="">Select section…</option>
                  {acadSections.map(s => <option key={s.mapping_id || s.id} value={s.section_id || s.id}>{s.section_name || s.name || s.code}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Subject *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={form.subject_id}
                  onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                  required
                  disabled={!form.class_id}
                >
                  <option value="">Select subject…</option>
                  {acadSubjects.map(s => <option key={s.mapping_id || s.id} value={s.subject_id || s.id}>{s.subject_name || s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Month *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  value={form.month}
                  onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                  required
                >
                  {MONTHS.filter(m => m !== 'All').map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Week *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  value={form.week}
                  onChange={e => setForm(f => ({ ...f, week: e.target.value }))}
                  required
                >
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Chapter</label>
                <input
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                  placeholder="e.g. Chapter 1"
                  value={form.chapter}
                  onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Topic *</label>
                <input
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                  placeholder="e.g. Topic Name"
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Periods Required</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                  value={form.periods}
                  onChange={e => setForm(f => ({ ...f, periods: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Learning Outcome</label>
                <input
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                  placeholder="e.g. Understand basic concepts"
                  value={form.learning_outcome}
                  onChange={e => setForm(f => ({ ...f, learning_outcome: e.target.value }))}
                />
              </div>
            </div>

            {/* Auto-calculated date range — shown as read-only info */}
            {form.planned_start_date && form.planned_end_date && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-50 rounded-2xl border border-brand-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">📅 Auto-Dates:</span>
                <span className="text-xs font-bold text-brand-700">
                  {new Date(form.planned_start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' — '}
                  {new Date(form.planned_end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className="ml-auto text-[9px] text-brand-300 font-bold uppercase tracking-wider">Auto-calculated from Month & Week</span>
              </div>
            )}

            {editId && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Status *</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all appearance-none cursor-pointer"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value, is_completed: e.target.value === 'completed' }))}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all disabled:opacity-50"
              >
                {submitting ? 'Saving...' : (editId ? 'Save Changes' : 'Create Topic')}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkModalOpen} onClose={() => { setBulkModalOpen(false); resetBulk(); }} title="Bulk Syllabus Upload">
        <form onSubmit={handleBulkUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Teacher (Fallback)</label>
              <select
                value={bulkTeacherId}
                onChange={e => setBulkTeacherId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none cursor-pointer"
              >
                <option value="">Select teacher…</option>
                {allTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Class (Fallback)</label>
              <select
                value={bulkClassId}
                onChange={e => handleBulkClassChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none cursor-pointer"
              >
                <option value="">Select class…</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Section (Fallback)</label>
              <select
                value={bulkSectionId}
                onChange={e => setBulkSectionId(e.target.value)}
                disabled={!bulkClassId}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="">Select section…</option>
                {bulkSections.map(s => (
                  <option key={s.mapping_id || s.id} value={s.section_id || s.id}>{s.section_name || s.name || s.code}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Subject (Fallback)</label>
              <select
                value={bulkSubjectId}
                onChange={e => setBulkSubjectId(e.target.value)}
                disabled={!bulkClassId}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="">Select subject…</option>
                {bulkSubjects.map(s => (
                  <option key={s.mapping_id || s.id} value={s.subject_id || s.id}>{s.subject_name || s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <Upload size={24} className="text-brand-600" />
            </div>
            <label className="block text-sm font-black text-slate-700 mb-1">Select Excel or CSV</label>
            <p className="text-xs text-slate-400 mb-6">Maximum file size: 2MB</p>
            <input
              type="file"
              accept=".csv, .xlsx"
              onChange={e => setUploadFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="flex-1 bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Start Upload'}
            </button>
            <button
              type="button"
              onClick={() => { setBulkModalOpen(false); resetBulk(); }}
              className="px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
            >
              Close
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
