import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import { GraduationCap, Users, Calendar, MapPin, User, BookOpen } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || '';

const getToken = () => {
    try {
        const session = JSON.parse(localStorage.getItem('sams_session') || '{}');
        return session?.token || null;
    } catch { return null; }
};

const AdminStudentTimetable = () => {
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [classStreams, setClassStreams] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedStream, setSelectedStream] = useState('');
    const [timeSlots, setTimeSlots] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(false);

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const isHigherSecondaryClass = (cn) => String(cn) === '11' || String(cn) === '12';

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

    useEffect(() => {
        fetchClasses();
        fetchTimeSlots();
    }, []);

    useEffect(() => {
        if (selectedClass === 'ALL') {
            fetchClassTimetable();
        } else if (selectedClass && selectedSection) {
            fetchClassTimetable();
        } else {
            setTimetable([]);
        }
    }, [selectedClass, selectedSection, selectedStream]);

    const fetchClasses = async () => {
        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/classes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await r.json();
            if (d.success) setClasses(d.data || d.classes || []);
        } catch (e) { console.error('Error:', e); }
    };

    const fetchTimeSlots = async () => {
        try {
            const token = getToken();
            const r = await fetch(`${API_URL}/api/admin/time-slots`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await r.json();
            if (d.success) setTimeSlots(d.data || d.timeSlots || []);
        } catch (e) { console.error('Error:', e); }
    };

    const fetchClassStreams = async (cn) => {
        try {
            const token = getToken();
            const cls = classes.find(c => c.class_number == cn);
            if (!cls) return;
            const r = await fetch(`${API_URL}/api/admin/class-streams/${cls.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await r.json();
            if (d.success) setClassStreams(d.data || d.streams || []);
        } catch (e) { console.error('Error:', e); }
    };

    const fetchClassSections = async (cn, streamId) => {
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

    const fetchClassTimetable = async () => {
        setLoading(true);
        try {
            const token = getToken();
            let url = `${API_URL}/api/admin/class-timetable`;
            if (selectedClass !== 'ALL') {
                url += `?classNumber=${selectedClass}&section=${selectedSection}`;
            } else {
                url = `${API_URL}/api/admin/teacher/all`;
            }
            const r = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const d = await r.json();
            if (d.success) setTimetable(d.data || d.timetable || []);
        } catch (e) { 
            console.error('Error:', e);
            toast.error('Failed to fetch timetable');
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = (e) => {
        const v = e.target.value;
        setSelectedClass(v);
        setSelectedSection('');
        setSelectedStream('');
        setSections([]);
        setClassStreams([]);
        if (v) {
            if (isHigherSecondaryClass(v)) {
                fetchClassStreams(v);
            } else {
                fetchClassSections(v);
            }
        }
    };

    const handleStreamChange = (e) => {
        const v = e.target.value;
        setSelectedStream(v);
        setSelectedSection('');
        if (v) {
            fetchClassSections(selectedClass, v);
        } else {
            setSections([]);
        }
    };

    const getTimetableEntry = (day, slotId) => {
        return timetable.find(e => e.day_of_week?.toUpperCase() === day.toUpperCase() && e.time_slot_id === slotId);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white shadow-xl">
                <div className="relative z-10">
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <GraduationCap className="w-8 h-8" />
                        Student Timetable
                    </h1>
                    <p className="mt-1 text-indigo-100 text-sm font-medium">View weekly schedule for students by class and section</p>
                </div>
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-10 blur-3xl"></div>
            </div>

            {/* Selection Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Class</label>
                    <select 
                        value={selectedClass} 
                        onChange={handleClassChange} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                    >
                        <option value="">Choose Class...</option>
                        <option value="ALL">🌟 View All Classes / Full Timetable</option>
                        {[...new Set(classes.map(c => c.class_number))].sort((a, b) => a - b).map(cn => (
                            <option key={cn} value={cn}>Class {cn}</option>
                        ))}
                    </select>
                </div>

                {selectedClass && selectedClass !== 'ALL' && isHigherSecondaryClass(selectedClass) && (
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Group/Stream</label>
                        <select 
                            value={selectedStream} 
                            onChange={handleStreamChange} 
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="">Choose Group...</option>
                            {classStreams.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedClass !== 'ALL' && (
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Section</label>
                        <select 
                            value={selectedSection} 
                            onChange={(e) => setSelectedSection(e.target.value)} 
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                            disabled={!selectedClass || (isHigherSecondaryClass(selectedClass) && !selectedStream)}
                        >
                            <option value="">Choose Section...</option>
                            {sections.map(s => (
                                <option key={s.section_id || s.id} value={s.code || s.section_code}>{s.name || s.section_name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedClass && selectedClass !== 'ALL' && selectedSection && (
                    <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2.5 rounded-xl border border-indigo-100 lg:col-span-1">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                            {selectedClass}
                        </div>
                        <div>
                            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest leading-none">Viewing</p>
                            <p className="font-bold text-slate-800 text-sm">Section {selectedSection}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Timetable View */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b-2 border-slate-200">
                                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-32 border-r-2 border-slate-200 bg-slate-50 sticky left-0 z-10">Day / Time</th>
                                {timeSlots.map(slot => (
                                    <th key={slot.id} className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[160px] border-r border-slate-100 last:border-r-0">
                                        {slot.is_break ? (
                                            <span className="text-amber-600">BREAK</span>
                                        ) : (
                                            <div className="flex flex-col gap-0.5 font-bold text-slate-700">
                                                <span>{formatTime(slot.start_time)}</span>
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {days.map((day, i) => (
                                <tr key={day} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                    <td className="px-3 py-4 text-xs font-bold text-center whitespace-nowrap border-r-2 border-slate-200 sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-slate-600">
                                        {day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()}
                                    </td>
                                    
                                    {timeSlots.map(slot => {
                                        if (slot.is_break) {
                                            return (
                                                <td key={`${day}-${slot.id}`} className="px-2 py-2 border-r border-slate-100 last:border-r-0 h-28 align-top">
                                                    <div className="h-full w-full bg-amber-50/50 flex items-center justify-center rounded-xl border border-amber-100/50">
                                                        <span className="text-[10px] text-amber-600 font-black tracking-widest">BREAK</span>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        if (selectedClass === 'ALL') {
                                            const entries = timetable.filter(e => e.day_of_week?.toUpperCase() === day.toUpperCase() && e.time_slot_id === slot.id);
                                            return (
                                                <td key={`${day}-${slot.id}`} className="px-2 py-2 border-r border-slate-100 last:border-r-0 h-28 align-top overflow-y-auto max-h-28">
                                                    <div className="flex flex-col gap-1 w-full">
                                                        {entries.map((entry, idx) => {
                                                            const colors = getSubjectColor(entry.subject_name || entry.subject?.name);
                                                            return (
                                                                <div key={idx} className={`p-1.5 rounded-lg border ${colors.bg} ${colors.border}`}>
                                                                    <div className="flex justify-between items-start">
                                                                        <span className="text-[9px] font-black text-slate-800 truncate">Cls {entry.class_number}-{entry.section}</span>
                                                                        <span className="text-[8px] bg-white px-1 rounded shadow-sm text-slate-500 font-bold border border-slate-100">{entry.room_number || ''}</span>
                                                                    </div>
                                                                    <p className="text-[10px] font-black text-indigo-800 truncate leading-tight my-0.5">{entry.subject_name || entry.subject?.name}</p>
                                                                    <p className="text-[8px] text-slate-600 truncate uppercase flex items-center gap-1"><User className="w-2.5 h-2.5 text-slate-400" /> {entry.teacher_name || entry.teacher?.name || 'Unknown'}</p>
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
                                            <td key={`${day}-${slot.id}`} className={clsx("px-2 py-2 border-r border-slate-100 last:border-r-0 transition-all h-28 align-top", entry ? colors.bg : "")}>
                                                {entry ? (
                                                    <div className={clsx("border-2 shadow-sm rounded-xl p-3 h-full flex flex-col gap-2 hover:border-brand-400 transition-all hover:shadow-md", colors.bg, colors.border)}>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className={clsx("p-1.5 rounded-lg border", colors.badge, colors.border)}>
                                                                <BookOpen className={clsx("w-4 h-4", colors.text)} />
                                                            </div>
                                                            {entry.room_number && (
                                                                <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                                                                    <MapPin className="w-2.5 h-2.5" />
                                                                    {entry.room_number}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className={clsx("font-black text-[12px] line-clamp-1 leading-tight mb-1", colors.text)}>{entry.subject_name}</h4>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                                                                <User className="w-3 h-3 text-slate-400" />
                                                                <span className="truncate">{entry.teacher_name}</span>
                                                            </div>
                                                        </div>
                                                        {entry.stream_name && (
                                                            <div className="mt-1 text-[9px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 w-fit font-bold truncate max-w-full">
                                                                {entry.stream_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-50 rounded-xl">
                                                        <span className="text-slate-100 text-xs font-bold uppercase tracking-widest">Free</span>
                                                    </div>
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

            {!selectedClass && (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center shadow-sm">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Select Class</h3>
                    <p className="text-slate-500 max-w-sm text-sm">Select a class from the dropdown above to see the full weekly schedule.</p>
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-[100]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-indigo-700 animate-pulse">Fetching Schedule...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStudentTimetable;
