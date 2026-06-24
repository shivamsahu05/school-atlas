import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Tabs } from '../../components/ui';
import WeeklySyllabusPlan from '../../components/teacher/WeeklySyllabusPlan';
import IntelligenceInsights from '../../components/teacher/IntelligenceInsights';
import { Modal } from '../../components/ui';
import { Plus, Loader2, Table, Upload, Download } from 'lucide-react';
import { syllabusApi, scheduleApi } from '../../api';

export default function TeacherSchedule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('weekly');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [assignments, setAssignments] = useState({ assignments: [] });
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ class_id: '', section_id: '', subject_id: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    class_id: '', section_id: '', subject_id: '', topic: '', week: '', month: '', periods: 0
  });

  const canEditMicroSchedule = user?.role === 'admin' || user?.permissions?.some(p => p.module === 'MICRO_SCHEDULE_EDIT');

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  React.useEffect(() => {
    scheduleApi.getMyAssignments().then(res => {
      setAssignments(res?.data || { assignments: [] });
    }).catch(console.error);
  }, []);

  // Auto-hide messages after 7 seconds
  React.useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 7000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Auto-select Class if only 1 option is available
  React.useEffect(() => {
    if (modalOpen && !form.class_id && assignments.assignments && assignments.assignments.length > 0) {
      const uniqueClasses = [...new Set(assignments.assignments.map(a => a.classId))];
      if (uniqueClasses.length === 1) {
        setForm(prev => ({ ...prev, class_id: uniqueClasses[0] }));
      }
    }
  }, [modalOpen, form.class_id, assignments]);

  // Auto-select Subject if only 1 option is available
  React.useEffect(() => {
    if (modalOpen && form.class_id && !form.subject_id && assignments.assignments) {
      const availableSubjects = [...new Map(assignments.assignments.filter(a => String(a.classId) === String(form.class_id)).map(a => [a.subjectName, a])).values()];
      if (availableSubjects.length === 1) {
        setForm(prev => ({ ...prev, subject_id: availableSubjects[0].subjectId }));
      }
    }
  }, [modalOpen, form.class_id, form.subject_id, assignments]);

  // Auto-hide bulk results after 10 seconds
  React.useEffect(() => {
    if (uploadResults) {
      const timer = setTimeout(() => setUploadResults(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [uploadResults]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      if (!form.class_id || !form.subject_id || !form.topic || !form.week || !form.month) {
        setMessage({ text: '❌ Please fill all required fields.', type: 'error' });
        setSubmitting(false);
        return;
      }

      let res;
      if (editId) {
        res = await syllabusApi.updateMicroSchedule(editId, form);
      } else {
        res = await syllabusApi.addMicroSchedule(form);
      }

      if (res.success || res.data?.success || res.status === 200) {
        setMessage({ text: `✅ Schedule ${editId ? 'updated' : 'added'} successfully!`, type: 'success' });
        setForm({ class_id: '', section_id: '', subject_id: '', topic: '', week: '', month: '', periods: 0 });
        setEditId(null);
        setTimeout(() => setModalOpen(false), 1500);

        // Refresh all components
        ['syllabus-updated', 'insights-refresh', 'analytics-refresh', 'lo-updated', 'dashboard-refresh'].forEach(e => window.dispatchEvent(new Event(e)));
      }
    } catch (err) {
      setMessage({ text: '❌ ' + (err.response?.data?.message || 'Operation failed'), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = (row) => {
    setEditId(row.id);
    setForm({
      class_id: row.class_id || '',
      section_id: row.section_id || '',
      subject_id: row.subject_id || '',
      topic: row.topic || '',
      week: row.week || '',
      month: row.month || '',
      periods: row.periods || row.db_periods || 0
    });
    setModalOpen(true);
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (bulkForm.class_id) formData.append('class_id', bulkForm.class_id);
      if (bulkForm.section_id) formData.append('section_id', bulkForm.section_id);
      if (bulkForm.subject_id) formData.append('subject_id', bulkForm.subject_id);
      
      const res = await syllabusApi.uploadPlan(formData);
      setUploadResults(res.data);
      if (res.success || res.data?.inserted > 0 || res.data?.updated > 0) {
        const { inserted, updated } = res.data || {};
        setMessage({ 
          text: `✅ Bulk upload successful: ${inserted || 0} added, ${updated || 0} updated.`, 
          type: 'success' 
        });
        window.dispatchEvent(new Event('syllabus-updated'));
        window.dispatchEvent(new Event('insights-refresh'));
        window.dispatchEvent(new Event('analytics-refresh'));
      }
    } catch (err) {
      setMessage({ text: '❌ ' + (err.response?.data?.message || 'Upload failed'), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Serio no.", "Month", "Week", "No. of Periods", "Chapter & Topic", "Learning Outcome", "Remarks"];
    const example = ["1", "May", "Week 1 (1-7)", "5", "Power Sharing (Intro)", "Basic Concept", ""];
    const csvContent = headers.join(",") + "\n" + example.join(",");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'syllabus_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExport = async () => {
    try {
      const res = await syllabusApi.exportPlan();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'syllabus_plan.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed');
    }
  };

  if (!user) return <div className="p-4 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8 animate-fade-in py-2 sm:py-4 px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Micro Schedule</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            {activeTab === 'weekly' && 'Syllabus & Lesson Planning'}
            {activeTab === 'insights' && 'Teaching Intelligence & Analytics'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadTemplate} className="btn bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Table size={16} className="text-emerald-500" /> Template
          </button>
          <button onClick={() => setBulkModalOpen(true)} className="btn bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Upload size={16} className="text-brand-500" /> Bulk Upload
          </button>
          <button onClick={handleExport} className="btn bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Download size={16} className="text-amber-500" /> Export
          </button>
          <button
            onClick={() => { setEditId(null); setForm({ class_id: '', section_id: '', subject_id: '', topic: '', week: '', month: '', periods: 0 }); setModalOpen(true); setMessage({ text: '', type: '' }); }}
            className="btn bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-100 flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Add Micro Schedule
          </button>
        </div>
      </div>

      <Tabs
        tabs={[
          { value: 'weekly', label: 'Weekly Syllabus Plan' },
          { value: 'all', label: 'All Micro Schedule' },
          { value: 'insights', label: 'Intelligence Insights' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-8 transition-all duration-300">
        {activeTab === 'weekly' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WeeklySyllabusPlan />
          </div>
        )}

        {activeTab === 'all' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <WeeklySyllabusPlan isAllView={true} onEditClick={canEditMicroSchedule ? handleEditOpen : undefined} />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <IntelligenceInsights />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); setMessage({ text: '', type: '' }); }} title={editId ? "Edit Micro Schedule" : "Add Micro Schedule"}>
        <form onSubmit={handleAdd} className="space-y-4">
          {message.text && (
            <div className={`p-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
              {message.text}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Class *</label>
              <select className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-200"
                value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value, section_id: '', subject_id: '' })} required>
                <option value="">Select assigned class…</option>
                {Array.isArray(assignments.assignments) && [...new Set(assignments.assignments.map(a => a.classId))].map(id => {
                  const name = assignments.assignments.find(a => a.classId === id)?.className;
                  const displayName = name?.startsWith('Class') ? name : `Class ${name}`;
                  return <option key={id} value={id}>{displayName}</option>
                })}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject *</label>
              <select className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-50"
                value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} disabled={!form.class_id} required>
                <option value="">Select assigned subject…</option>
                {form.class_id && [...new Map(assignments.assignments.filter(a => String(a.classId) === String(form.class_id)).map(a => [a.subjectName, a])).values()].map(a => (
                  <option key={a.subjectId} value={a.subjectId}>{a.subjectName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Month *</label>
              <select className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-200"
                value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} required>
                <option value="">Select Month…</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Week *</label>
              <select className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-200"
                value={form.week} onChange={e => setForm({ ...form, week: e.target.value })} required>
                <option value="">Select Week…</option>
                <option value="Week 1">Week 1 (1-7)</option>
                <option value="Week 2">Week 2 (8-14)</option>
                <option value="Week 3">Week 3 (15-21)</option>
                <option value="Week 4">Week 4 (22-28)</option>
                <option value="Week 5">Week 5 (29-End)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chapter & Topic *</label>
              <input className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="e.g. Linear Equations" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Periods Required *</label>
              <input type="number" className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="e.g. 5" value={form.periods} onChange={e => setForm({ ...form, periods: e.target.value })} required />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all disabled:opacity-50">
              {submitting ? (editId ? 'Updating...' : 'Adding...') : (editId ? 'Update Schedule' : 'Add to Schedule')}
            </button>
            <button type="button" onClick={() => { setModalOpen(false); setEditId(null); }} className="px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkModalOpen} onClose={() => { setBulkModalOpen(false); setUploadResults(null); }} title="Bulk Syllabus Upload">
        <form onSubmit={handleBulkUpload} className="space-y-4">
          <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <Upload size={24} className="text-brand-600" />
            </div>
            
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Class</label>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-200"
                  value={bulkForm.class_id} onChange={e => setBulkForm({ ...bulkForm, class_id: e.target.value, section_id: 'All', subject_id: '' })} required>
                  <option value="">Select Class…</option>
                  {Array.isArray(assignments.assignments) && [...new Set(assignments.assignments.map(a => a.classId))].map(id => {
                    const name = assignments.assignments.find(a => a.classId === id)?.className;
                    const displayName = name?.startsWith('Class') ? name : `Class ${name}`;
                    return <option key={id} value={id}>{displayName}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Section</label>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-50"
                  value={bulkForm.section_id} onChange={e => setBulkForm({ ...bulkForm, section_id: e.target.value })} disabled={!bulkForm.class_id}>
                  <option value="All">All Sections</option>
                  {bulkForm.class_id && [...new Map(assignments.assignments.filter(a => String(a.classId) === String(bulkForm.class_id) && a.sectionId).map(a => [a.sectionId, a])).values()].map(a => (
                    <option key={a.sectionId} value={a.sectionId}>{a.sectionName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject</label>
                <select className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-50"
                  value={bulkForm.subject_id} onChange={e => setBulkForm({ ...bulkForm, subject_id: e.target.value })} disabled={!bulkForm.class_id} required>
                  <option value="">Select Subject…</option>
                  {bulkForm.class_id && [...new Map(assignments.assignments.filter(a => String(a.classId) === String(bulkForm.class_id)).map(a => [a.subjectName, a])).values()].map(a => (
                    <option key={a.subjectId} value={a.subjectId}>{a.subjectName}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="block text-sm font-black text-slate-700 mb-1">Select Excel or CSV</label>
            <p className="text-xs text-slate-400 mb-6">Maximum file size: 2MB</p>
            <input type="file" accept=".csv, .xlsx" onChange={e => setUploadFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer" />
          </div>

          {uploadResults && (
            <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3">
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-emerald-600 text-xl font-black">{uploadResults.inserted}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success</p>
                </div>
                <div className="text-center">
                  <p className="text-rose-600 text-xl font-black">{uploadResults.failed}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Failed</p>
                </div>
              </div>
              {uploadResults.errors?.length > 0 && (
                <div className="max-h-32 overflow-y-auto border-t border-slate-50 pt-2">
                  {uploadResults.errors.map((err, i) => (
                    <div key={i} className="text-[10px] text-rose-500 py-1 flex gap-2">
                      <span className="font-black">Row {err.row}:</span> {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting || !uploadFile} className="flex-1 bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all disabled:opacity-50">
              {submitting ? 'Uploading...' : 'Start Upload'}
            </button>
            <button type="button" onClick={() => setBulkModalOpen(false)} className="px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Close</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}