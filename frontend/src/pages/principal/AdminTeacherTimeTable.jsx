import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { timetableApi } from '../../api';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || '';

const getToken = () => {
    try {
        const s = localStorage.getItem('sams_session');
        return s ? JSON.parse(s).token : null;
    } catch { return null; }
};

const AdminTeacherTimeTable = () => {
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [classStreams, setClassStreams] = useState([]);
    const isHigherSecondaryClass = (cn) => String(cn) === '11' || String(cn) === '12';
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);
    const [editingSlotId, setEditingSlotId] = useState(null);
    const [editSlotForm, setEditSlotForm] = useState({ start_time: '', end_time: '' });
    
    // Add Slot Modal
    const [showAddSlotModal, setShowAddSlotModal] = useState(false);
    const [newSlotForm, setNewSlotForm] = useState({ start_time: '', end_time: '', is_break: false });

    // Assign Class Modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignSlotData, setAssignSlotData] = useState({ day: '', slotId: null });
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [assignRoom, setAssignRoom] = useState('');
    const [manualAssignForm, setManualAssignForm] = useState({ class_number: '', section: '', subject_id: '', stream_id: '' });
    const [classForm, setClassForm] = useState({ class_number: '', section: '', subject_id: '', room_number: '' });
    
    // Upload & Conflict States
    const [uploading, setUploading] = useState(false);
    const [conflicts, setConflicts] = useState([]);
    const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const fileInputRef = useRef(null);

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    
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

    const getSubjectColor = (subject) => {
      const defaultColor = { bg: 'bg-brand-50/50', border: 'border-brand-200', text: 'text-brand-700', badge: 'bg-brand-100 text-brand-800' };
      if (!subject) return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' };
      const sub = subject.toLowerCase();
      const match = SUBJECT_COLOR_MAP.find(m => sub.includes(m.key));
      return match ? { bg: match.bg, border: match.border, text: match.text, badge: match.badge } : defaultColor;
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        if (ts === '-') return '';
        if (!ts.includes(':')) return ts;
        const parts = ts.split(':');
        const [h, m] = parts;
        const hr = parseInt(h);
        if (isNaN(hr)) return ts;
        return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
    };

    useEffect(() => { fetchInitialData(); }, []);
    useEffect(() => { selectedTeacher ? fetchTeacherTimetable() : setTimetable([]); }, [selectedTeacher]);
    useEffect(() => {
        if (manualAssignForm.class_number) {
            fetchClassSubjects(manualAssignForm.class_number);
            fetchClassSections(manualAssignForm.class_number);
            if (isHigherSecondaryClass(manualAssignForm.class_number)) {
                fetchClassStreams(manualAssignForm.class_number);
            }
        } else {
            setSubjects([]);
            setSections([]);
            setClassStreams([]);
        }
    }, [manualAssignForm.class_number]);

    const fetchInitialData = async () => {
        try {
            const token = getToken();
            const h = { 'Authorization': `Bearer ${token}` };
            const [t, ts, c] = await Promise.all([
                fetch(`${API_URL}/api/teachers`, { headers: h }),
                fetch(`${API_URL}/api/admin/time-slots`, { headers: h }),
                fetch(`${API_URL}/api/admin/classes`, { headers: h })
            ]);
            const td = await t.json(), tsd = await ts.json(), cd = await c.json();
            if (td.success) {
                const fetchedTeachers = td.data?.items || td.data || [];
                setTeachers(fetchedTeachers.filter(x => x.status !== 'inactive' && x.status !== 'INACTIVE'));
            }
            if (tsd.success) setTimeSlots(tsd.data || tsd.timeSlots || []);
            if (cd.success) setClasses(cd.data || cd.classes || []);
        } catch (e) { console.error('Error:', e); }
    };

    const fetchTeacherTimetable = async () => {
        try {
            const token = getToken();
            const url = selectedTeacher === 'ALL' 
                ? `${API_URL}/api/teacher/schedule/assignments` // Or another endpoint that gives all timetables
                : `${API_URL}/api/admin/teacher/${selectedTeacher}`;
                
            if (selectedTeacher === 'ALL') {
                const tr = await fetch(`${API_URL}/api/admin/teacher/all`, { headers: { 'Authorization': `Bearer ${token}` } });
                const d = await tr.json();
                if (d.success) setTimetable(d.timetable || []);
            } else {
                const r = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                const d = await r.json();
                if (d.success) setTimetable(d.timetable);
            }
        } catch (e) { console.error('Error:', e); }
    };

    const fetchClassSubjects = async (cn) => {
        if (!cn) { setSubjects([]); return; }
        const cls = classes.find(c => c.class_number == cn);
        if (!cls) return;
        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/class-subjects/${cls.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const d = await r.json();
            if (d.success) setSubjects(d.data || d.subjects || []);
        } catch (e) { console.error('Error:', e); }
    };

    const fetchClassSections = async (cn, streamId) => {
        if (!cn) { setSections([]); return; }
        const cls = classes.find(c => c.class_number == cn);
        if (!cls) return;
        try {
            const token = getToken();
            let url = `${API_URL}/api/admin/class-sections/${cls.id}`;
            if (isHigherSecondaryClass(cn) && streamId) url += `?stream_id=${streamId}`;
            const r = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const d = await r.json();
            if (d.success) setSections(d.data || d.sections || []);
        } catch (e) { console.error('Error:', e); }
    };

    const fetchClassStreams = async (cn) => {
        try {
            const token = getToken();
            const cls = classes.find(c => c.class_number == cn);
            if (!cls) return;
            const r = await fetch(`${API_URL}/api/admin/class-streams/${cls.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const d = await r.json();
            if (d.success) setClassStreams(d.data || d.streams || []);
        } catch (e) { console.error('Error:', e); }
    };

    // Class assignment has been moved to Teacher Edit page per requirements.
    // Timetable module is now read-only for class assignments.

    const handleTimeSlotEdit = (slot) => { if (slot.is_break) return; setEditingSlotId(slot.id); setEditSlotForm({ start_time: slot.start_time || '', end_time: slot.end_time || '-' }); };

    const handleTimeSlotSave = async (slotId) => {
        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/time-slots/${slotId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ start_time: editSlotForm.start_time, end_time: editSlotForm.end_time }) });
            const d = await r.json();
            if (d.success) { setTimeSlots(p => p.map(s => s.id === slotId ? { ...s, start_time: editSlotForm.start_time, end_time: editSlotForm.end_time } : s)); setEditingSlotId(null); toast.success('Updated!'); }
            else toast.error(d.message || 'Failed');
        } catch (e) { toast.error('Failed to update'); }
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/time-slots`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(newSlotForm)
            });
            const d = await r.json();
            if (d.success) {
                toast.success('Time slot added!');
                setShowAddSlotModal(false);
                setNewSlotForm({ start_time: '', end_time: '', is_break: false });
                fetchInitialData();
            } else toast.error(d.message || 'Failed');
        } catch (e) { toast.error('Failed to add slot'); }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!confirm('Delete this time slot? This will remove all assignments for this slot across all teachers.')) return;
        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/time-slots/${slotId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await r.json();
            if (d.success) {
                toast.success('Time slot deleted!');
                fetchInitialData();
            } else toast.error(d.message || 'Failed');
        } catch (e) { toast.error('Failed to delete slot'); }
    };

    const getTimetableEntry = (day, ts) => timetable.find(e => e.day_of_week?.toUpperCase() === day.toUpperCase() && e.time_slot_id === (ts?.id || ts));
    const getSelectedTeacherName = () => teachers.find(t => t.id === parseInt(selectedTeacher))?.name || '';
    
    const currentTeacherObj = teachers.find(t => t.id === parseInt(selectedTeacher));
    const currentTeacherAssignments = currentTeacherObj?.assignments || [];

    const handleEmptySlotClick = (day, slotId, existingEntry = null) => {
        setAssignSlotData({ day, slotId, entryId: existingEntry?.id || null });
        if (existingEntry) {
            // Find the matching assignment to pre-select it
            const match = currentTeacherAssignments.find(a => 
                a.class_name?.replace('Class ', '').trim() === existingEntry.class_number && 
                (a.section_name || a.section_code || '') === existingEntry.section && 
                a.subject_id === existingEntry.subject_id
            );
            if (match) {
                setSelectedAssignmentId(`${match.class_id}-${match.section_id}-${match.subject_id}`);
            } else {
                setSelectedAssignmentId('');
            }
            setAssignRoom(existingEntry.room_number || '');
        } else {
            setSelectedAssignmentId('');
            setAssignRoom('');
            setManualAssignForm({ class_number: '', section: '', subject_id: '', stream_id: '' });
        }
        setShowAssignModal(true);
    };

    const handleRemoveAssignment = async () => {
        if (!assignSlotData.entryId) return;
        if (!confirm('Remove this assignment from the timetable?')) return;
        
        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/teacher/entry/${assignSlotData.entryId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await r.json();
            if (d.success) {
                toast.success('Assignment removed!');
                setShowAssignModal(false);
                fetchTeacherTimetable();
            } else {
                toast.error(d.message || 'Failed to remove');
            }
        } catch (error) {
            toast.error('Error removing assignment');
        }
    };

    const handleAssignSlot = async (e) => {
        e.preventDefault();
        if (!selectedAssignmentId) return toast.error('Please select an assignment');
        
        let payload = {};

        if (selectedAssignmentId === 'MANUAL') {
            if (!manualAssignForm.class_number || !manualAssignForm.subject_id) {
                return toast.error('Class and Subject are required for manual assignment');
            }
            payload = {
                classNumber: manualAssignForm.class_number,
                section: manualAssignForm.section,
                subjectId: manualAssignForm.subject_id,
                streamId: manualAssignForm.stream_id,
                teacherId: selectedTeacher,
                dayOfWeek: assignSlotData.day,
                timeSlotId: assignSlotData.slotId,
                roomNumber: assignRoom
            };
        } else {
            const assignment = currentTeacherAssignments.find(a => `${a.class_id}-${a.section_id}-${a.subject_id}` === selectedAssignmentId);
            if (!assignment) return toast.error('Assignment not found');

            payload = {
                classNumber: assignment.class_name?.replace('Class ', '').trim(),
                section: assignment.section_name || assignment.section_code || '',
                subjectId: assignment.subject_id,
                teacherId: selectedTeacher,
                dayOfWeek: assignSlotData.day,
                timeSlotId: assignSlotData.slotId,
                roomNumber: assignRoom
            };
        }

        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/teacher/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const d = await r.json();
            if (d.success) {
                toast.success('Timetable entry assigned!');
                setShowAssignModal(false);
                fetchTeacherTimetable();
            } else {
                toast.error(d.message || 'Failed to assign');
            }
        } catch (error) {
            toast.error('Error assigning timetable slot');
        }
    };

    /* ─── UPLOAD & CONFLICT LOGIC ─── */
    const handleDownloadTemplate = async () => {
        try {
            const response = await timetableApi.downloadTemplate();
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Timetable_Template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error('Failed to download template');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await timetableApi.uploadExcel(formData);
            if (res.success) {
                const report = res.report;
                let msg = `Successfully uploaded ${report.successCount} slots. `;
                if (report.failedCount > 0) msg += `${report.failedCount} failed. `;
                toast.success(msg);

                if (report.errors && report.errors.length > 0) {
                    report.errors.forEach(err => toast.error(`Row ${err.row}: ${err.reason}`, { duration: 5000 }));
                }

                if (report.conflicts && report.conflicts.length > 0) {
                    setConflicts(report.conflicts);
                    setCurrentConflictIndex(0);
                    setShowConflictModal(true);
                } else if (selectedTeacher) {
                    fetchTeacherTimetable();
                }
            } else {
                toast.error(res.message || 'Upload failed');
            }
        } catch (error) {
            toast.error('Failed to process Excel upload');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleResolveConflict = async (action) => {
        const currentConflict = conflicts[currentConflictIndex];
        try {
            const res = await timetableApi.resolveConflict({
                action,
                conflictData: currentConflict.conflictData
            });

            if (res.success) {
                toast.success(res.message);
                
                // Move to next conflict or close
                if (currentConflictIndex < conflicts.length - 1) {
                    setCurrentConflictIndex(prev => prev + 1);
                } else {
                    setShowConflictModal(false);
                    setConflicts([]);
                    if (selectedTeacher) fetchTeacherTimetable();
                    toast.success('All conflicts resolved!');
                }
            } else {
                toast.error(res.message || 'Failed to resolve conflict');
            }
        } catch (error) {
            toast.error('Error resolving conflict');
        }
    };

    const handleExportTimetable = () => {
        if (!selectedTeacher) {
            toast.error("Please select a teacher first to export their timetable");
            return;
        }
        
        let teacherName = "All_Teachers";
        if (selectedTeacher !== 'ALL') {
            const t = teachers.find(t => t.id === Number(selectedTeacher) || String(t.id) === String(selectedTeacher));
            if (t) teacherName = t.name;
        }

        const data = [];
        
        // Header Row
        const headerRow = ["Day / Time"];
        timeSlots.forEach(slot => {
            if (slot.is_break) {
                headerRow.push("BREAK");
            } else {
                headerRow.push(`${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`);
            }
        });
        data.push(headerRow);

        // Data Rows
        days.forEach(day => {
            const row = [day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()];
            timeSlots.forEach(slot => {
                if (slot.is_break) {
                    row.push("BREAK");
                } else {
                    if (selectedTeacher === 'ALL') {
                        const entries = timetable.filter(e => e.day_of_week?.toUpperCase() === day.toUpperCase() && e.time_slot_id === slot.id);
                        if (entries.length > 0) {
                            row.push(entries.map(e => `${e.teacher_name || e.teacher?.name || 'Unknown'} (${e.class_number}-${e.section} ${e.subject_name || e.subject?.name})`).join(" | "));
                        } else {
                            row.push("-");
                        }
                    } else {
                        const entry = getTimetableEntry(day, slot.id);
                        if (entry) {
                            row.push(`${entry.class_number}-${entry.section} ${entry.subject_name}`);
                        } else {
                            row.push("-");
                        }
                    }
                }
            });
            data.push(row);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Auto-size columns
        const colWidths = [{ wch: 15 }];
        timeSlots.forEach(() => colWidths.push({ wch: selectedTeacher === 'ALL' ? 40 : 25 }));
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Timetable");
        XLSX.writeFile(wb, `Timetable_${teacherName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Timetable exported successfully!");
    };

    /* ─── RENDER ─── */
    return (
        <div className="space-y-6 animate-fade-in pb-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white shadow-xl">
                <div className="relative z-10">
                    <h1 className="text-2xl font-black tracking-tight">Teacher Timetable</h1>
                    <p className="mt-1 text-brand-100 text-sm font-medium">Manage teacher schedules and class assignments</p>
                </div>
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-10 blur-3xl"></div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Teacher</label>
                    <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none cursor-pointer">
                        <option value="">Choose a teacher...</option>
                        <option value="ALL">🌟 View All Teachers / Full Timetable</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.subject ? `- ${t.subject}` : ''}</option>)}
                    </select>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={handleExportTimetable}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <span>📥 Export Timetable</span>
                    </button>
                    <button 
                        onClick={handleDownloadTemplate}
                        className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <span>⬇️ Download Template</span>
                    </button>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <span>{uploading ? '⏳ Uploading...' : '⬆️ Upload Excel'}</span>
                    </button>

                    <button 
                        onClick={() => setShowAddSlotModal(true)}
                        className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <span>➕ Add New Slot</span>
                    </button>
                    {selectedTeacher && (
                        <div className="flex items-center gap-3 bg-brand-50 px-4 py-2 rounded-xl border border-brand-100">
                            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">{getSelectedTeacherName().charAt(0)}</div>
                            <div>
                                <p className="text-[9px] text-brand-600 font-black uppercase tracking-widest leading-none">Selected</p>
                                <p className="font-bold text-slate-800 text-xs">{getSelectedTeacherName()}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b-2 border-slate-200">
                                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-32 border-r-2 border-slate-200 bg-slate-50 sticky left-0 z-10">Day / Time</th>
                                {timeSlots.map(slot => (
                                    <th 
                                        key={slot.id} 
                                        className={`px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[140px] border-r border-slate-100 last:border-r-0 group relative transition-colors ${!slot.is_break && editingSlotId !== slot.id ? 'cursor-pointer hover:bg-brand-50/50 hover:text-brand-600' : ''}`}
                                        onClick={() => { if (!slot.is_break && editingSlotId !== slot.id) handleTimeSlotEdit(slot); }}
                                    >
                                        {slot.is_break ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-amber-600">☕ BREAK</span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                                                    className="opacity-0 group-hover:opacity-100 text-[8px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded border border-rose-100 hover:bg-rose-100 transition-all"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : editingSlotId === slot.id ? (
                                            <div className="flex flex-col gap-1 items-center" onClick={e => e.stopPropagation()}>
                                                <input 
                                                    type="text" 
                                                    value={editSlotForm.start_time} 
                                                    onChange={e => setEditSlotForm({...editSlotForm, start_time: e.target.value})} 
                                                    placeholder="Period Name"
                                                    className="w-full px-2 py-1 text-[10px] border border-brand-300 rounded-lg outline-none bg-white text-center font-bold" 
                                                />
                                                <div className="flex gap-1 mt-1">
                                                    <button onClick={() => handleTimeSlotSave(slot.id)} className="px-2 py-0.5 text-[8px] font-bold bg-emerald-500 text-white rounded shadow-sm">Save</button>
                                                    <button onClick={() => setEditingSlotId(null)} className="px-2 py-0.5 text-[8px] font-bold bg-slate-200 text-slate-600 rounded">X</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="flex items-center gap-1 font-bold text-slate-700">
                                                    {formatTime(slot.start_time)}
                                                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-brand-400">✏️</span>
                                                </span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[7px] bg-rose-50 text-rose-400 px-1 rounded border border-rose-100 hover:bg-rose-500 hover:text-white transition-all whitespace-nowrap"
                                                >
                                                    Delete Slot
                                                </button>
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {days.map((day, i) => (
                                <tr key={day} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                    <td className="px-3 py-3 text-xs font-bold text-center whitespace-nowrap border-r-2 border-slate-200 sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-slate-600">
                                        {day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()}
                                    </td>
                                    {timeSlots.map(slot => {
                                        if (slot.is_break) {
                                            return (
                                                <td key={`${day}-${slot.id}`} className="px-2 py-2 border-r border-slate-100 last:border-r-0 h-24 align-top">
                                                    <div className="h-full w-full bg-amber-50/50 flex items-center justify-center rounded-lg border border-amber-100/50">
                                                        <span className="text-[10px] text-amber-600 font-black tracking-widest">BREAK</span>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        if (selectedTeacher === 'ALL') {
                                            const entries = timetable.filter(e => e.day_of_week?.toUpperCase() === day.toUpperCase() && e.time_slot_id === slot.id);
                                            return (
                                                <td key={`${day}-${slot.id}`} className="px-2 py-2 border-r border-slate-100 last:border-r-0 h-24 align-top overflow-y-auto max-h-24">
                                                    <div className="flex flex-col gap-1 w-full">
                                                        {entries.map((entry, idx) => {
                                                            const colors = getSubjectColor(entry.subject_name || entry.subject?.name);
                                                            return (
                                                                <div key={idx} className={`p-1.5 rounded-lg border ${colors.bg} ${colors.border}`}>
                                                                    <p className="text-[9px] font-black text-slate-800 truncate">{entry.teacher_name || entry.teacher?.name || 'Unknown'}</p>
                                                                    <p className="text-[9px] text-slate-600 truncate">{entry.subject_name || entry.subject?.name} ({entry.class_number}-{entry.section})</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                        }

                                        const entry = getTimetableEntry(day, slot.id);
                                        const colors = getSubjectColor(entry?.subject_name);
                                        return (
                                            <td 
                                                key={`${day}-${slot.id}`} 
                                                className={`px-2 py-2 border-r border-slate-100 last:border-r-0 transition-all relative group h-24 align-top ${selectedTeacher && selectedTeacher !== 'ALL' ? (entry ? colors.bg + ' cursor-pointer' : 'bg-slate-50/10 cursor-pointer hover:bg-brand-50') : 'opacity-50 bg-slate-50'}`}
                                                onClick={() => {
                                                    if (selectedTeacher && selectedTeacher !== 'ALL' && !slot.is_break) {
                                                        handleEmptySlotClick(day, slot.id, entry);
                                                    }
                                                }}
                                            >
                                                <>
                                                    {selectedTeacher && selectedTeacher !== 'ALL' && !slot.is_break && (
                                                        <div className={`absolute inset-0 m-1 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 ${entry ? 'bg-slate-900/10 backdrop-blur-[1px]' : 'bg-brand-50/80'}`}>
                                                            <span className={`text-xl font-black flex items-center justify-center shadow-sm w-8 h-8 rounded-full ${entry ? 'bg-white text-slate-700' : 'text-brand-500 bg-white'}`}>
                                                                {entry ? '✎' : '+'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {entry ? (
                                                        <div className={`border-2 shadow-sm rounded-xl p-2 h-full flex flex-col gap-1 group-hover:shadow-md group-hover:border-brand-400 transition-all ${colors.bg} ${colors.border}`}>
                                                            <div className="flex items-start justify-between gap-1">
                                                                <span className={`font-black text-[11px] line-clamp-2 leading-tight ${colors.text}`}>{entry.subject_name}</span>
                                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border whitespace-nowrap ${colors.badge} ${colors.border}`}>{entry.class_number}-{entry.section}</span>
                                                            </div>
                                                            {entry.stream_name && <div className="text-[9px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 w-fit font-bold">📚 {entry.stream_name}</div>}
                                                            {entry.room_number && <div className="mt-auto text-[10px] text-slate-500 font-bold bg-slate-50 w-max px-1.5 py-0.5 rounded border border-slate-200">📍 {entry.room_number}</div>}
                                                        </div>
                                                    ) : <div className="h-full w-full flex items-center justify-center"><span className="text-slate-200 text-xl">•</span></div>}
                                                </>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {!selectedTeacher && timeSlots.length > 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-center shadow-sm">
                    <div className="bg-brand-50 p-5 rounded-full mb-4"><span className="text-3xl">👨‍🏫</span></div>
                    <h3 className="text-lg font-bold text-slate-800">Assign Classes</h3>
                    <p className="text-slate-500 mt-1.5 max-w-sm text-sm">Select a teacher from the dropdown to view their schedule and assign classes.</p>
                    <div className="mt-4 flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">Read-Only View / Click + to Assign</span>
                    </div>
                </div>
            )}

            {/* Assign Timetable Slot Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span>📅</span> Assign Slot
                            </h2>
                            <button onClick={() => setShowAssignModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400">✕</button>
                        </div>
                        <form onSubmit={handleAssignSlot} className="p-6 space-y-5">
                            <div className="bg-brand-50 border border-brand-100 p-3 rounded-xl flex items-center justify-between">
                                <span className="text-xs font-bold text-brand-700">{assignSlotData.day}</span>
                                <span className="text-xs font-bold text-brand-700 bg-white px-2 py-1 rounded border border-brand-200">
                                    {formatTime(timeSlots.find(ts => ts.id === assignSlotData.slotId)?.start_time)}
                                </span>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Assignment *</label>
                                <select 
                                    value={selectedAssignmentId} 
                                    onChange={e => setSelectedAssignmentId(e.target.value)} 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none" 
                                    required
                                >
                                    <option value="">-- Choose an assignment --</option>
                                    {currentTeacherAssignments.length === 0 && <option disabled>No assignments found for this teacher</option>}
                                    {currentTeacherAssignments.map((a, i) => (
                                        <option key={i} value={`${a.class_id}-${a.section_id}-${a.subject_id}`}>
                                            Class {a.class_name?.replace('Class ', '').trim()} {a.section_name || a.section_code} - {a.subject_name}
                                        </option>
                                    ))}
                                    <option value="MANUAL" className="font-bold text-brand-600 bg-brand-50">⚡ Custom / Manual Assignment</option>
                                </select>
                                <p className="text-[9px] text-slate-500 mt-1 ml-1">Select from Teacher's existing assignments, or choose Custom.</p>
                            </div>

                            {selectedAssignmentId === 'MANUAL' && (
                                <div className="space-y-4 bg-brand-50/50 p-4 rounded-xl border border-brand-100/50">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Class *</label>
                                            <select value={manualAssignForm.class_number} onChange={e => { setManualAssignForm({...manualAssignForm, class_number: e.target.value, section: '', stream_id: ''}) }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" required>
                                                <option value="">Select Class</option>
                                                {classes.map(c => <option key={c.id} value={c.class_number}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Section</label>
                                            <select value={manualAssignForm.section} onChange={e => setManualAssignForm({...manualAssignForm, section: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500">
                                                <option value="">No Section</option>
                                                {sections.map(s => <option key={s.mapping_id || s.id || Math.random()} value={s.code || s.section_code}>{s.section_name || s.name || s.code || s.section_code}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    {isHigherSecondaryClass(manualAssignForm.class_number) && (
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stream *</label>
                                            <select value={manualAssignForm.stream_id} onChange={e => setManualAssignForm({...manualAssignForm, stream_id: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" required>
                                                <option value="">Select Stream</option>
                                                {classStreams.map(s => <option key={s.link_id || s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject *</label>
                                        <select value={manualAssignForm.subject_id} onChange={e => setManualAssignForm({...manualAssignForm, subject_id: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" required>
                                            <option value="">Select Subject</option>
                                            {subjects.map(s => <option key={s.mapping_id || s.id || s.subject_id} value={s.subject_id || s.id}>{s.name || s.subject_name} ({s.code || s.subject_code})</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Room Number (Optional)</label>
                                <input 
                                    type="text" 
                                    value={assignRoom} 
                                    onChange={e => setAssignRoom(e.target.value)} 
                                    placeholder="e.g. Lab 1, Room 101"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" 
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                {assignSlotData.entryId ? (
                                    <button type="button" onClick={handleRemoveAssignment} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 shadow-sm border border-rose-100">Remove</button>
                                ) : null}
                                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-sm">{assignSlotData.entryId ? 'Update' : 'Assign'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddSlotModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">➕ Add New Slot</h2>
                            <button onClick={() => setShowAddSlotModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400">✕</button>
                        </div>
                        <form onSubmit={handleAddSlot} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Period Name</label>
                                    <input type="text" placeholder="e.g., Period 1" value={newSlotForm.start_time} onChange={e => setNewSlotForm({...newSlotForm, start_time: e.target.value, end_time: '-'})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" required />
                                </div>
                            </div>
                            <label className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl cursor-pointer">
                                <input type="checkbox" checked={newSlotForm.is_break} onChange={e => setNewSlotForm({...newSlotForm, is_break: e.target.checked})} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
                                <span className="text-sm font-semibold text-amber-900">Mark as Break (e.g. Lunch)</span>
                            </label>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowAddSlotModal(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-sm">Create Slot</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Conflict Resolution Modal */}
            {showConflictModal && conflicts.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up border border-slate-100">
                        <div className="p-6 border-b border-slate-100 bg-amber-50">
                            <h3 className="text-xl font-black text-amber-800 flex items-center gap-2">
                                <span>⚠️</span> Conflict Detected
                            </h3>
                            <p className="text-sm text-amber-700 mt-1 font-medium">
                                Conflict {currentConflictIndex + 1} of {conflicts.length} (Row {conflicts[currentConflictIndex].row})
                            </p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-2">Existing Assignment</p>
                                <div className="text-sm text-slate-700 space-y-1 font-medium">
                                    <p>Teacher: <span className="font-bold">{conflicts[currentConflictIndex].existing.teacher}</span></p>
                                    <p>Time: <span className="font-bold">{conflicts[currentConflictIndex].existing.time}</span></p>
                                    <p>Class: <span className="font-bold">{conflicts[currentConflictIndex].existing.class} {conflicts[currentConflictIndex].existing.section}</span></p>
                                    <p>Subject: <span className="font-bold">{conflicts[currentConflictIndex].existing.subject}</span></p>
                                </div>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-2">New Upload Request</p>
                                <div className="text-sm text-slate-700 space-y-1 font-medium">
                                    <p>Teacher: <span className="font-bold">{conflicts[currentConflictIndex].existing.teacher}</span></p>
                                    <p>Time: <span className="font-bold">{conflicts[currentConflictIndex].existing.time}</span></p>
                                    <p>Class: <span className="font-bold">{conflicts[currentConflictIndex].conflictData.classNumber} {conflicts[currentConflictIndex].conflictData.section}</span></p>
                                </div>
                            </div>
                            
                            <p className="text-sm text-slate-600 text-center italic mt-2">How would you like to handle this conflict?</p>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
                            <button 
                                onClick={() => handleResolveConflict('KEEP EXISTING')}
                                className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                Keep Existing (Skip Upload)
                            </button>
                            <button 
                                onClick={() => handleResolveConflict('REPLACE WITH NEW')}
                                className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-sm"
                            >
                                Replace With New Upload
                            </button>
                            <button 
                                onClick={() => handleResolveConflict('SKIP THIS ROW')}
                                className="w-full py-3 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors shadow-sm"
                            >
                                Skip This Row
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTeacherTimeTable;