import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

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
    const [showAddSlotModal, setShowAddSlotModal] = useState(false);
    const [newSlotForm, setNewSlotForm] = useState({ start_time: '', end_time: '', is_break: false });
    const [classForm, setClassForm] = useState({ class_number: '', section: '', subject_id: '', room_number: '' });
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
        const [h, m] = ts.split(':');
        const hr = parseInt(h);
        return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
    };

    useEffect(() => { fetchInitialData(); }, []);
    useEffect(() => { selectedTeacher ? fetchTeacherTimetable() : setTimetable([]); }, [selectedTeacher]);

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
            if (td.success) setTeachers((td.data?.items || td.data || []).filter(x => x.status === 'active'));
            if (tsd.success) setTimeSlots(tsd.data || tsd.timeSlots || []);
            if (cd.success) setClasses(cd.data || cd.classes || []);
        } catch (e) { console.error('Error:', e); }
    };

    const fetchTeacherTimetable = async () => {
        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/teacher/${selectedTeacher}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const d = await r.json();
            if (d.success) setTimetable(d.timetable);
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

    const handleCellClick = async (day, slot) => {
        if (slot.is_break || !selectedTeacher) { if (!selectedTeacher) toast.error('Select a teacher first'); return; }
        const entry = getTimetableEntry(day, slot);
        setSelectedCell({ day, slot, entry });
        if (entry) {
            const f = [fetchClassSubjects(entry.class_number), fetchClassSections(entry.class_number)];
            if (isHigherSecondaryClass(entry.class_number)) f.push(fetchClassStreams(entry.class_number)); else setClassStreams([]);
            await Promise.all(f);
            const sid = entry.stream_id ? String(entry.stream_id) : '';
            if (isHigherSecondaryClass(entry.class_number) && sid) await fetchClassSections(entry.class_number, sid);
            setClassForm({ class_number: entry.class_number, section: entry.section, subject_id: entry.subject_id, room_number: entry.room_number || '', stream_id: sid });
        } else { setSubjects([]); setSections([]); setClassStreams([]); setClassForm({ class_number: '', section: '', subject_id: '', room_number: '', stream_id: '' }); }
        setShowEditModal(true);
    };

    const handleClassChange = (e) => {
        const v = e.target.value;
        setClassForm({ ...classForm, class_number: v, section: '', subject_id: '', stream_id: '' });
        if (v) { fetchClassSubjects(v); if (isHigherSecondaryClass(v)) { fetchClassStreams(v); setSections([]); } else { setClassStreams([]); fetchClassSections(v); } }
        else { setSubjects([]); setSections([]); setClassStreams([]); }
    };

    const handleSaveClass = async (e) => {
        e.preventDefault();
        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/teacher/assign`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ classNumber: classForm.class_number, section: classForm.section, streamId: classForm.stream_id || null, dayOfWeek: selectedCell.day.charAt(0).toUpperCase() + selectedCell.day.slice(1).toLowerCase(), timeSlotId: selectedCell.slot.id, subjectId: classForm.subject_id, teacherId: selectedTeacher, roomNumber: classForm.room_number })
            });
            const d = await r.json();
            if (d.success) { toast.success('Assignment saved!'); setShowEditModal(false); fetchTeacherTimetable(); }
            else toast.error(d.message || 'Failed');
        } catch (e) { toast.error('Failed to save'); }
    };

    const handleDeleteClass = async () => {
        if (!selectedCell?.entry?.id || !confirm('Delete this assignment?')) return;
        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/teacher/entry/${selectedCell.entry.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const d = await r.json();
            if (d.success) { toast.success('Deleted!'); setShowEditModal(false); fetchTeacherTimetable(); }
            else toast.error(d.message || 'Failed');
        } catch (e) { toast.error('Failed to delete'); }
    };

    const handleTimeSlotEdit = (slot) => { if (slot.is_break) return; setEditingSlotId(slot.id); setEditSlotForm({ start_time: slot.start_time?.substring(0, 5) || '', end_time: slot.end_time?.substring(0, 5) || '' }); };

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

    const getTimetableEntry = (day, ts) => timetable.find(e => e.day_of_week?.toUpperCase() === day.toUpperCase() && e.time_slot_id === ts.id);
    const getSelectedTeacherName = () => teachers.find(t => t.id === parseInt(selectedTeacher))?.name || '';

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
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name} - {t.subject}</option>)}
                    </select>
                </div>
                <div className="flex gap-2">
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
                                                    type="time" 
                                                    value={editSlotForm.start_time} 
                                                    onChange={e => setEditSlotForm({...editSlotForm, start_time: e.target.value})} 
                                                    className="w-full px-2 py-1 text-[10px] border border-brand-300 rounded-lg outline-none bg-white lowercase" 
                                                />
                                                <span className="text-[8px] text-slate-400 font-bold lowercase">to</span>
                                                <input 
                                                    type="time" 
                                                    value={editSlotForm.end_time} 
                                                    onChange={e => setEditSlotForm({...editSlotForm, end_time: e.target.value})} 
                                                    className="w-full px-2 py-1 text-[10px] border border-brand-300 rounded-lg outline-none bg-white lowercase" 
                                                />
                                                <div className="flex gap-1 mt-1">
                                                    <button onClick={() => handleTimeSlotSave(slot.id)} className="px-2 py-0.5 text-[8px] font-bold bg-emerald-500 text-white rounded shadow-sm">Save</button>
                                                    <button onClick={() => setEditingSlotId(null)} className="px-2 py-0.5 text-[8px] font-bold bg-slate-200 text-slate-600 rounded">X</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-0.5">
                                                <span className="flex items-center gap-1">
                                                    {formatTime(slot.start_time)}
                                                    <span className="opacity-0 group-hover:opacity-100 text-[8px] text-brand-400">✏️</span>
                                                </span>
                                                <span className="text-[8px] opacity-30 lowercase tracking-normal">to</span>
                                                <span>{formatTime(slot.end_time)}</span>
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
                                        const entry = getTimetableEntry(day, slot);
                                        const colors = getSubjectColor(entry?.subject_name);
                                        return (
                                            <td 
                                                key={`${day}-${slot.id}`} 
                                                onClick={() => handleCellClick(day, slot)} 
                                                className={`px-2 py-2 border-r border-slate-100 last:border-r-0 transition-all relative group h-24 align-top ${selectedTeacher ? (entry ? colors.bg : 'cursor-pointer hover:bg-brand-50/30') : 'cursor-not-allowed opacity-50 bg-slate-50'}`}
                                            >
                                                {slot.is_break ? (
                                                    <div className="h-full w-full bg-amber-50/50 flex items-center justify-center rounded-lg border border-amber-100/50">
                                                        <span className="text-[10px] text-amber-600 font-black tracking-widest">BREAK</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {selectedTeacher && !entry && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-2xl text-brand-300 font-black">+</span></div>}
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

            {!selectedTeacher && timeSlots.length > 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-center shadow-sm">
                    <div className="bg-brand-50 p-5 rounded-full mb-4"><span className="text-3xl">👨‍🏫</span></div>
                    <h3 className="text-lg font-bold text-slate-800">Assign Classes</h3>
                    <p className="text-slate-500 mt-1.5 max-w-sm text-sm">Select a teacher from the dropdown to view their schedule and assign classes.</p>
                    <div className="mt-4 flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">Click cells to assign</span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">Click assignments to edit</span>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">{selectedCell?.entry ? '✏️ Edit Assignment' : '➕ Assign Class'}</h2>
                            <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="bg-brand-50 px-6 py-2.5 flex justify-between items-center text-xs border-b border-brand-100">
                            <div><span className="font-bold text-brand-700">Day: </span><span className="text-brand-900">{selectedCell?.day}</span></div>
                            <span className="px-2 py-0.5 bg-brand-100 text-brand-800 rounded text-[10px] font-bold">{selectedCell?.slot?.start_time} - {selectedCell?.slot?.end_time}</span>
                        </div>
                        <form onSubmit={handleSaveClass} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Class *</label>
                                    <select value={classForm.class_number} onChange={handleClassChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" required>
                                        <option value="">Select</option>
                                        {[...new Set(classes.map(c => c.class_number))].sort((a, b) => a - b).map(cn => <option key={cn} value={cn}>Class {cn}</option>)}
                                    </select>
                                </div>
                                {classForm.class_number && isHigherSecondaryClass(classForm.class_number) ? (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Group *</label>
                                        <select value={classForm.stream_id || ''} onChange={e => { setClassForm({...classForm, stream_id: e.target.value, section: ''}); e.target.value ? fetchClassSections(classForm.class_number, e.target.value) : setSections([]); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" disabled={!classStreams.length}>
                                            <option value="">Select</option>
                                            {classStreams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Section <span className="text-slate-300 font-normal normal-case">(Optional)</span></label>
                                        <select value={classForm.section} onChange={e => setClassForm({...classForm, section: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" disabled={!classForm.class_number}>
                                            <option value="">Select</option>
                                            {sections.map(s => <option key={s.section_id || s.id} value={s.section_code || s.code}>{s.section_name || s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            {classForm.class_number && isHigherSecondaryClass(classForm.class_number) && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Section <span className="text-slate-300 font-normal normal-case">(Optional)</span></label>
                                    <select value={classForm.section} onChange={e => setClassForm({...classForm, section: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" disabled={!classForm.stream_id}>
                                        <option value="">{!classForm.stream_id ? 'Select Group First' : 'Select'}</option>
                                        {sections.map(s => <option key={s.section_id || s.id} value={s.section_code || s.code}>{s.section_name || s.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Subject *</label>
                                <select value={classForm.subject_id} onChange={e => setClassForm({...classForm, subject_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" required disabled={!classForm.class_number}>
                                    <option value="">Select</option>
                                    {subjects.map(s => <option key={s.subject_id || s.id} value={s.subject_id || s.id}>{s.subject_name || s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Room <span className="text-slate-300 font-normal normal-case">(Optional)</span></label>
                                <input type="text" value={classForm.room_number} onChange={e => setClassForm({...classForm, room_number: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. 101, Lab A" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                {selectedCell?.entry && <button type="button" onClick={handleDeleteClass} className="px-4 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 border border-rose-200 mr-auto text-sm">Delete</button>}
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary px-5 py-2.5 text-sm">Cancel</button>
                                <button type="submit" className="btn-primary px-5 py-2.5 text-sm">{selectedCell?.entry ? 'Save Changes' : 'Assign'}</button>
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Time</label>
                                    <input type="time" value={newSlotForm.start_time} onChange={e => setNewSlotForm({...newSlotForm, start_time: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Time</label>
                                    <input type="time" value={newSlotForm.end_time} onChange={e => setNewSlotForm({...newSlotForm, end_time: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500" required />
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
        </div>
    );
};

export default AdminTeacherTimeTable;