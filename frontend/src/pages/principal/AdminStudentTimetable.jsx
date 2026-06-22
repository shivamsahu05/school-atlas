import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import { GraduationCap, Users, MapPin, User, BookOpen, LayoutGrid } from 'lucide-react';

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
    const [selectedClassId, setSelectedClassId] = useState('');   // academic_classes.id
    const [selectedClassNum, setSelectedClassNum] = useState(''); // class_number stored in timetable
    const [selectedClassLabel, setSelectedClassLabel] = useState('');
    const [selectedSection, setSelectedSection] = useState('');   // section code like 'A'
    const [timeSlots, setTimeSlots] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState(''); // 'all_classes' | 'class' | 'section'

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    const SUBJECT_COLORS = [
        { key: 'science', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
        { key: 'math', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
        { key: 'english', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
        { key: 'social', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
        { key: 'hindi', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
        { key: 'computer', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
        { key: 'art', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
        { key: 'phys', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800' },
        { key: 'telugu', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' },
    ];
    const DEFAULT_COLOR = { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800' };

    const getSubjectColor = (subject) => {
        if (!subject) return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-700' };
        const sub = subject.toLowerCase();
        return SUBJECT_COLORS.find(m => sub.includes(m.key)) || DEFAULT_COLOR;
    };

    const formatTime = (ts) => {
        if (!ts || ts === '-') return '';
        if (!ts.includes(':')) return ts;
        const [h, m] = ts.split(':');
        const hr = parseInt(h);
        if (isNaN(hr)) return ts;
        return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
    };

    useEffect(() => { fetchClasses(); fetchTimeSlots(); }, []);

    const fetchClasses = async () => {
        try {
            const r = await fetch(`${API_URL}/api/admin/classes`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const d = await r.json();
            if (d.success) {
                const list = d.data || d.classes || [];
                const sorted = [...list].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
                setClasses(sorted);
            }
        } catch (e) { console.error('Error:', e); }
    };

    const fetchTimeSlots = async () => {
        try {
            const r = await fetch(`${API_URL}/api/admin/time-slots`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const d = await r.json();
            if (d.success) setTimeSlots(d.data || d.timeSlots || []);
        } catch (e) { console.error('Error:', e); }
    };

    const fetchClassSections = async (classId) => {
        try {
            const r = await fetch(`${API_URL}/api/admin/class-sections/${classId}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const d = await r.json();
            if (d.success) setSections(d.data || d.sections || []);
        } catch (e) { console.error('Error:', e); }
    };

    const fetchTimetable = async (classNum, section) => {
        if (!classNum) return;
        setLoading(true);
        try {
            let url;
            if (classNum === 'ALL') {
                url = `${API_URL}/api/admin/teacher/all`;
            } else {
                url = `${API_URL}/api/admin/class-timetable?classNumber=${encodeURIComponent(classNum)}`;
                if (section && section !== 'ALL') {
                    url += `&section=${encodeURIComponent(section)}`;
                }
            }
            const r = await fetch(url, { headers: { 'Authorization': `Bearer ${getToken()}` } });
            const d = await r.json();
            if (d.success) setTimetable(d.timetable || d.data || []);
            else { setTimetable([]); toast.error(d.message || 'No data found'); }
        } catch (e) {
            console.error('Error:', e);
            toast.error('Failed to fetch timetable');
            setTimetable([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = (e) => {
        const val = e.target.value;
        setSelectedSection('');
        setSections([]);
        setTimetable([]);

        if (!val) {
            setSelectedClassId('');
            setSelectedClassNum('');
            setSelectedClassLabel('');
            setViewMode('');
            return;
        }

        if (val === 'ALL') {
            setSelectedClassId('ALL');
            setSelectedClassNum('ALL');
            setSelectedClassLabel('All Classes');
            setViewMode('all_classes');
            fetchTimetable('ALL');
            return;
        }

        const cls = classes.find(c => String(c.id) === String(val));
        if (cls) {
            setSelectedClassId(cls.id);
            setSelectedClassNum(cls.class_number);
            setSelectedClassLabel(cls.name);
            setViewMode('class');
            fetchClassSections(cls.id);
            // Fetch all sections timetable for this class
            fetchTimetable(cls.class_number, 'ALL');
        }
    };

    const handleSectionChange = (e) => {
        const val = e.target.value;
        setSelectedSection(val);
        if (val === 'ALL' || val === '') {
            setViewMode('class');
            fetchTimetable(selectedClassNum, 'ALL');
        } else {
            setViewMode('section');
            fetchTimetable(selectedClassNum, val);
        }
    };

    // For ALL classes view: get entries by day+slot
    const getAllEntries = (day, slotId) =>
        timetable.filter(e => e.day_of_week?.toUpperCase() === day && e.time_slot_id === slotId);

    // For class/section view: get single entry per day+slot
    const getEntry = (day, slotId) =>
        timetable.find(e => e.day_of_week?.toUpperCase() === day && e.time_slot_id === slotId);

    // When showing all sections of a class: entries grouped by day+slot, multiple sections shown
    const isMultiSectionView = viewMode === 'class' && selectedClassId && selectedClassId !== 'ALL';
    const isAllClassesView = viewMode === 'all_classes';
    const isSectionView = viewMode === 'section';

    const hasData = timetable.length > 0;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 text-white shadow-xl">
                <div className="relative z-10">
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <GraduationCap className="w-8 h-8" />
                        Student Timetable
                    </h1>
                    <p className="mt-1 text-indigo-100 text-sm font-medium">View weekly schedule for students by class and section</p>
                </div>
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-10 blur-3xl" />
            </div>

            {/* Selection Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Class */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Class</label>
                    <select
                        value={selectedClassId}
                        onChange={handleClassChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                    >
                        <option value="">Choose Class...</option>
                        <option value="ALL">🌟 View All Classes / Full Timetable</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                </div>

                {/* Section — only show when a specific class is selected */}
                {selectedClassId && selectedClassId !== 'ALL' && (
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Section</label>
                        <select
                            value={selectedSection}
                            onChange={handleSectionChange}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="ALL">All Sections</option>
                            {sections.map(s => (
                                <option key={s.section_id || s.id} value={s.section_name || s.name || s.code || s.section_code}>
                                    {s.section_name || s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Info badge */}
                {selectedClassId && (
                    <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2.5 rounded-xl border border-indigo-100 col-span-1">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {selectedClassId === 'ALL' ? '★' : (selectedClassNum || '?')}
                        </div>
                        <div>
                            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest leading-none">Viewing</p>
                            <p className="font-bold text-slate-800 text-sm leading-tight">
                                {selectedClassId === 'ALL' ? 'All Classes' : selectedClassLabel}
                                {selectedSection && selectedSection !== 'ALL'
                                    ? ` › ${selectedSection.replace(/^Section\s+/i, '').trim()}`
                                    : selectedClassId !== 'ALL' ? ' › All Sections' : ''}
                            </p>
                        </div>
                    </div>
                )}

                {/* Record count */}
                {hasData && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <LayoutGrid size={14} className="text-indigo-400" />
                        <span><strong className="text-indigo-600">{timetable.length}</strong> entries found</span>
                    </div>
                )}
            </div>

            {/* Timetable */}
            {selectedClassId ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-sm font-bold text-indigo-700 animate-pulse">Fetching Schedule...</p>
                        </div>
                    ) : !hasData ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <BookOpen size={48} className="text-slate-200 mb-4" />
                            <h3 className="text-lg font-bold text-slate-600 mb-1">No Timetable Found</h3>
                            <p className="text-sm text-slate-400 max-w-sm">
                                No schedule entries exist for this selection. Go to
                                <a href="/admin/timetable" className="text-indigo-600 font-bold mx-1">Admin Timetable</a>
                                to add entries.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto scrollbar-thin">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                                        <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-32 border-r-2 border-slate-200 bg-slate-50 sticky left-0 z-10">
                                            Day / Time
                                        </th>
                                        {timeSlots.map(slot => (
                                            <th key={slot.id} className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[160px] border-r border-slate-100 last:border-r-0">
                                                {slot.is_break ? (
                                                    <span className="text-amber-600">BREAK</span>
                                                ) : (
                                                    <div className="flex flex-col gap-0.5 font-bold text-slate-700">
                                                        <span>{formatTime(slot.start_time)}</span>
                                                        <span className="text-[9px] text-slate-400 font-medium">{formatTime(slot.end_time)}</span>
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {days.map((day, i) => (
                                        <tr key={day} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                            <td className="px-3 py-4 text-xs font-bold text-center whitespace-nowrap border-r-2 border-slate-200 sticky left-0 bg-inherit z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-slate-600">
                                                {day.charAt(0) + day.slice(1).toLowerCase()}
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

                                                // ALL CLASSES or MULTI-SECTION view: show multiple entries
                                                if (isAllClassesView || isMultiSectionView) {
                                                    const entries = getAllEntries(day, slot.id);
                                                    return (
                                                        <td key={`${day}-${slot.id}`} className="px-2 py-2 border-r border-slate-100 last:border-r-0 align-top min-h-[7rem]">
                                                            <div className="flex flex-col gap-1 w-full">
                                                                {entries.length === 0 ? (
                                                                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-50 rounded-xl">
                                                                        <span className="text-slate-100 text-xs font-bold uppercase tracking-widest">Free</span>
                                                                    </div>
                                                                ) : entries.map((entry, idx) => {
                                                                    const colors = getSubjectColor(entry.subject_name);
                                                                    return (
                                                                        <div key={idx} className={`p-2 rounded-lg border ${colors.bg} ${colors.border}`}>
                                                                            {isAllClassesView && (
                                                                                <div className="text-[9px] font-black text-slate-500 mb-0.5">
                                                                                    Cls {entry.class_number}{entry.section ? `-${entry.section}` : ''}
                                                                                </div>
                                                                            )}
                                                                            {isMultiSectionView && entry.section && (
                                                                                <div className="text-[9px] font-black text-indigo-600 mb-0.5 bg-indigo-50 px-1.5 py-0.5 rounded w-fit border border-indigo-100">
                                                                                    {entry.section.replace(/^Section\s+/i, '').trim()}
                                                                                </div>
                                                                            )}
                                                                            <p className={`text-[10px] font-black truncate leading-tight ${colors.text}`}>{entry.subject_name}</p>
                                                                            <p className="text-[8px] text-slate-500 truncate flex items-center gap-1">
                                                                                <User className="w-2.5 h-2.5 inline shrink-0" />
                                                                                {entry.teacher_name || 'Unknown'}
                                                                            </p>
                                                                            {entry.room_number && (
                                                                                <p className="text-[8px] text-slate-400 flex items-center gap-0.5">
                                                                                    <MapPin className="w-2 h-2" /> {entry.room_number}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                    );
                                                }

                                                // SINGLE SECTION view
                                                const entry = getEntry(day, slot.id);
                                                const colors = getSubjectColor(entry?.subject_name);
                                                return (
                                                    <td key={`${day}-${slot.id}`} className={clsx('px-2 py-2 border-r border-slate-100 last:border-r-0 h-28 align-top', entry ? colors.bg : '')}>
                                                        {entry ? (
                                                            <div className={clsx('border-2 shadow-sm rounded-xl p-3 h-full flex flex-col gap-2 hover:shadow-md transition-all', colors.bg, colors.border)}>
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className={clsx('p-1.5 rounded-lg border', colors.badge, colors.border)}>
                                                                        <BookOpen className={clsx('w-4 h-4', colors.text)} />
                                                                    </div>
                                                                    {entry.room_number && (
                                                                        <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                                                                            <MapPin className="w-2.5 h-2.5" /> {entry.room_number}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className={clsx('font-black text-[12px] line-clamp-1 leading-tight mb-1', colors.text)}>{entry.subject_name}</h4>
                                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                                                                        <User className="w-3 h-3 text-slate-400" />
                                                                        <span className="truncate">{entry.teacher_name}</span>
                                                                    </div>
                                                                </div>
                                                                {entry.stream_name && (
                                                                    <div className="text-[9px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 w-fit font-bold truncate max-w-full">
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
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center shadow-sm">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Select a Class</h3>
                    <p className="text-slate-500 max-w-sm text-sm">Choose a class from the dropdown above to view the weekly schedule.</p>
                </div>
            )}
        </div>
    );
};

export default AdminStudentTimetable;
