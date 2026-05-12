import React, { useState, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { StatCard } from '../ui';
import { Clock, Users, Download, Loader2 } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <StatCard title="Total Periods" value={filteredTimetable.length} icon={Clock} color="blue" />
        <button onClick={exportToExcel} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-all shadow-sm">
          <Download size={14} /> Export Excel
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Class Filter</label>
          <select value={filters.class} onChange={(e) => setFilters(f => ({ ...f, class: e.target.value }))} className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50/50 text-xs font-bold text-slate-700 outline-none focus:border-brand-500">
            <option value="All">All Classes</option>
            {filterOptions.classes.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject Filter</label>
          <select value={filters.subject} onChange={(e) => setFilters(f => ({ ...f, subject: e.target.value }))} className="w-full border border-slate-100 rounded-xl px-3 py-2 bg-slate-50/50 text-xs font-bold text-slate-700 outline-none focus:border-brand-500">
            <option value="All">All Subjects</option>
            {filterOptions.subjects.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-100 rounded-3xl bg-white shadow-sm overflow-x-auto scrollbar-thin">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 border-b border-r text-[9px] font-black uppercase text-slate-400 w-24 bg-slate-100/30">Day</th>
              {uniqueTimeSlots.map((slot, idx) => (
                <th key={slot.id} className="p-3 border-b border-r text-[9px] font-black uppercase text-slate-500 min-w-[120px] sm:min-w-[140px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-brand-600 text-base">P{idx + 1}</span>
                    <span className="text-[8px] text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((day) => (
              <tr key={day} className="group">
                <td className="p-3 border-b border-r font-black text-[9px] uppercase text-slate-400 bg-slate-50/50 text-center sticky left-0 z-10">{day}</td>
                {uniqueTimeSlots.map((slot) => {
                  const entry = filteredTimetable.find(e => e.day === day && e.slot_id === slot.id);
                  return (
                    <td key={slot.id} className={clsx("p-1.5 border-b border-r h-20 sm:h-24 align-top transition-all", entry ? "bg-white" : "bg-slate-50/10")}>
                      {entry ? (
                          <div className="border border-brand-50 bg-white shadow-sm rounded-xl p-2 h-full flex flex-col justify-center items-center hover:scale-[1.02] transition-transform">
                            <div className="font-black text-[10px] text-slate-800 uppercase leading-tight mb-0.5">{entry.subject_name}</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{formatClassLabel(entry)}</div>
                          </div>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center opacity-10"><span className="text-slate-400 text-xs font-black">—</span></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="py-12 flex flex-col items-center justify-center gap-3 text-brand-500"><Loader2 className="animate-spin" size={32} /><p className="text-[9px] font-black uppercase tracking-widest">Loading...</p></div>}
        {!loading && filteredTimetable.length === 0 && <div className="py-12 text-center text-slate-300 font-black uppercase text-[9px] tracking-widest">No schedule found</div>}
      </div>
    </div>
  );
}
