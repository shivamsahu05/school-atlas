import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { StatCard } from '../ui';
import { Clock, Users, Download, Loader2, BookOpen } from 'lucide-react';
import { scheduleApi } from '../../api';
import * as XLSX from 'xlsx';

export default function TimetableGrid() {
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState([]);
  const [timetableData, setTimetableData] = useState([]);
  const [filters, setFilters] = useState({ class: 'All', subject: 'All' });

  const loadSchedule = () => {
    setLoading(true);
    scheduleApi.getTimetable().then(res => {
      setTimetableData(res?.data || []);
      setTimeSlots(res?.timeSlots || []);
      setLoading(false);
    }).catch(err => {
      console.error("Timetable Fetch Error:", err);
      setLoading(false);
    });
  };

  useEffect(() => { loadSchedule(); }, []);

  // SYNC LISTENER
  useEffect(() => {
    const handleSync = () => loadSchedule();
    window.addEventListener('syllabus-updated', handleSync);
    return () => window.removeEventListener('syllabus-updated', handleSync);
  }, []);

  const formatTime = (time) => time ? String(time).slice(0, 5) : '--:--';
  const formatClassLabel = (item) => `Class ${item.class_name || '?'}-${item.section_name || '?'}`;

  const uniqueTimeSlots = useMemo(() => {
    if (!timeSlots?.length) return [];
    return Array.from(new Map(timeSlots.map(s => [s.id, s])).values())
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timeSlots]);

  const filteredTimetable = useMemo(() => {
    return (timetableData || []).filter(item => {
      const classId = `${item.class_id}-${item.section_id}`;
      const classMatch = filters.class === 'All' || classId === filters.class;
      const subjectMatch = filters.subject === 'All' || String(item.subject_id) === String(filters.subject);
      return classMatch && subjectMatch;
    });
  }, [timetableData, filters]);

  const filterOptions = useMemo(() => {
    const classes = [];
    const subjects = [];
    const classSeen = new Set();
    const subjectSeen = new Set();

    (timetableData || []).forEach(item => {
      const classId = `${item.class_id}-${item.section_id}`;
      if (item.class_id && !classSeen.has(classId)) {
        classSeen.add(classId);
        classes.push({ id: classId, label: formatClassLabel(item) });
      }
      if (item.subject_id && !subjectSeen.has(item.subject_id)) {
        subjectSeen.add(item.subject_id);
        subjects.push({ id: String(item.subject_id), label: item.subject_name });
      }
    });
    return { classes, subjects };
  }, [timetableData]);

  const assignedClassesCount = useMemo(() => {
    const seen = new Set();
    filteredTimetable.forEach(item => {
      seen.add(`${item.class_id}-${item.section_id}`);
    });
    return seen.size;
  }, [filteredTimetable]);

  const uniqueSubjectsCount = useMemo(() => {
    const seen = new Set();
    filteredTimetable.forEach(item => {
      if (item.subject_id) seen.add(item.subject_id);
    });
    return seen.size;
  }, [filteredTimetable]);

  const exportToExcel = () => {
    try {
      if (!filteredTimetable || filteredTimetable.length === 0) {
        alert("No timetable data available to export.");
        return;
      }
      const data = filteredTimetable.map(item => ({
        Day: item.day,
        Time: `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`,
        Subject: item.subject_name || 'N/A',
        Class: formatClassLabel(item),
        Room: item.room_number || 'N/A'
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Timetable");
      XLSX.writeFile(wb, "Teacher_Timetable.xlsx");
    } catch (err) {
      console.error("Excel Export Error:", err);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter and Export Bar */}
      <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-end gap-2.5 sm:gap-4">
        <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-[9px] sm:text-[11px] font-extrabold text-slate-700 mb-1 ml-1">Class Filter</label>
            <select value={filters.class} onChange={(e) => setFilters(f => ({ ...f, class: e.target.value }))} className="w-full border border-slate-200 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2.5 bg-slate-50/50 text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all">
              <option value="All">All Classes</option>
              {filterOptions.classes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] sm:text-[11px] font-extrabold text-slate-700 mb-1 ml-1">Subject Filter</label>
            <select value={filters.subject} onChange={(e) => setFilters(f => ({ ...f, subject: e.target.value }))} className="w-full border border-slate-200 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2.5 bg-slate-50/50 text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all">
              <option value="All">All Subjects</option>
              {filterOptions.subjects.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <button onClick={exportToExcel} className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 sm:px-5 sm:py-2.5 h-[32px] sm:h-[42px] rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-all shadow-sm shrink-0 cursor-pointer">
          <Download size={12} className="sm:w-3.5 sm:h-3.5" /> Export Excel
        </button>
      </div>

      {/* Timetable Grid Table */}
      <div className="overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-sm overflow-x-auto scrollbar-thin">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 sm:p-4 border-b border-r border-slate-200 text-[10px] sm:text-xs font-black text-slate-600 w-16 sm:w-24 bg-slate-100 sticky left-0 z-20">Day</th>
              {uniqueTimeSlots.map((slot, idx) => (
                <th key={slot.id} className="p-2 sm:p-4 border-b border-r border-slate-200 text-[8px] sm:text-[10px] font-black text-slate-600 min-w-[105px] sm:min-w-[160px]">
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                    <span className="text-brand-600 text-xs sm:text-sm font-black">Period {idx + 1}</span>
                    <span className="text-[8px] sm:text-[9px] text-slate-500 bg-white px-1.5 sm:px-2.5 py-0.5 rounded-full border border-slate-200 font-bold">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((day) => (
              <tr key={day} className="group hover:bg-slate-50/20">
                <td className="p-2 sm:p-4 border-b border-r border-slate-200 font-extrabold text-[10px] sm:text-xs text-slate-700 bg-slate-100 text-center sticky left-0 z-10">{day.charAt(0) + day.slice(1).toLowerCase()}</td>
                {uniqueTimeSlots.map((slot) => {
                  const entry = filteredTimetable.find(e => e.day === day && e.slot_id === slot.id);
                  return (
                    <td key={slot.id} className={clsx("p-1 sm:p-2 border-b border-r border-slate-200 h-20 sm:h-28 align-top transition-all", entry ? "bg-white" : "bg-slate-50/10")}>
                      {entry ? (
                        <div className="border border-brand-100 bg-brand-50/10 shadow-sm rounded-xl sm:rounded-2xl p-1.5 sm:p-3 h-full flex flex-col justify-center sm:justify-between items-center hover:scale-[1.02] hover:bg-brand-50/20 hover:border-brand-300 transition-all duration-200 cursor-default">
                          <div className="font-black text-[9px] sm:text-xs text-brand-900 leading-snug text-center tracking-tight">{entry.subject_name}</div>
                          <div className="text-[8px] sm:text-[9px] font-black text-slate-600 bg-slate-100 px-1 sm:px-2 py-0.5 rounded-md border border-slate-200 mt-1 sm:mt-1.5 tracking-wider">{formatClassLabel(entry)}</div>
                          {entry.room_number ? (
                            <div className="text-[8px] sm:text-[9px] font-semibold text-slate-500 mt-0.5 sm:mt-1">Room {entry.room_number}</div>
                          ) : (
                            <div className="h-2.5" />
                          )}
                        </div>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center opacity-20"><span className="text-slate-300 text-[10px] sm:text-xs font-bold">—</span></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="py-16 flex flex-col items-center justify-center gap-3 text-brand-500"><Loader2 className="animate-spin" size={36} /><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Timetable...</p></div>}
        {!loading && filteredTimetable.length === 0 && <div className="py-16 text-center text-slate-400 font-black uppercase text-xs tracking-widest">No schedule found</div>}
      </div>
    </div>
  );
}
