import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Clock } from 'lucide-react';
import { teachersApi, syllabusApi } from '../../api';

export default function AdminSyllabusReport() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('All');
  const [syllabusData, setSyllabusData] = useState([]);

  // Fetch all teachers on mount
  useEffect(() => {
    teachersApi.getAll()
      .then(res => {
        const list = res.data?.items || res.items || [];
        setTeachers(list);
      })
      .catch(err => console.error('Error fetching teachers:', err));
  }, []);

  // Fetch syllabus data whenever selected teacher changes
  useEffect(() => {
    setLoading(true);
    const params = {
      teacher_id: selectedTeacherId === 'All' ? null : selectedTeacherId
    };
    syllabusApi.getPlan(params)
      .then(res => {
        setSyllabusData(Array.isArray(res) ? res : (res?.data || []));
      })
      .catch(err => {
        console.error('Error fetching syllabus data:', err);
        setSyllabusData([]);
      })
      .finally(() => setLoading(false));
  }, [selectedTeacherId]);

  // Compute stats dynamically
  const reportData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Group by Class + Section + Subject
    const groups = {};
    syllabusData.forEach(item => {
      // Find clean class, section and subject names
      const className = item.class_name || (typeof item.class === 'object' ? item.class?.class_name : item.class) || '—';
      const sectionName = item.section_name || (typeof item.class === 'object' ? item.class?.section : item.section) || '—';
      const subjectName = item.subject_name || (typeof item.subject === 'object' ? item.subject?.name : item.subject) || '—';
      const key = `${className}-${sectionName}-${subjectName}`;

      if (!groups[key]) {
        groups[key] = {
          class: className,
          section: sectionName,
          subject: subjectName,
          items: []
        };
      }
      groups[key].items.push(item);
    });

    const rowsTillToday = [];
    const rowsYearly = [];

    let overallPlannedTillToday = 0;
    let overallCompletedTillToday = 0;

    Object.values(groups).forEach(g => {
      // 1. TILL TODAY
      let plannedTillToday = 0;
      let completedTillToday = 0;

      // 2. YEARLY
      let totalYearly = 0;
      let completedYearly = 0;

      g.items.forEach(item => {
        const periods = Number(item.periods || 0);
        const isCompleted = item.is_completed || item.status === 'completed';

        // Check if planned_end_date exists and is <= today
        const plannedEnd = item.planned_end_date ? new Date(item.planned_end_date) : null;
        const isPlannedTillToday = plannedEnd && plannedEnd <= today;

        if (isPlannedTillToday) {
          plannedTillToday += periods;
          if (isCompleted) {
            completedTillToday += periods;
          }
        }

        totalYearly += periods;
        if (isCompleted) {
          completedYearly += periods;
        }
      });

      // Calculate till today row
      if (plannedTillToday > 0) {
        const completionPct = Math.round((completedTillToday / plannedTillToday) * 100);
        const pendingPeriods = Math.max(0, plannedTillToday - completedTillToday);
        
        let status = 'DELAYED';
        let statusColor = 'text-rose-600 bg-rose-50 border-rose-100';
        if (completionPct >= 90) {
          status = 'ON TIME';
          statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
        } else if (completionPct >= 70) {
          status = 'SLIGHTLY DELAY';
          statusColor = 'text-amber-600 bg-amber-50 border-amber-100';
        }

        rowsTillToday.push({
          class: g.class,
          section: g.section,
          subject: g.subject,
          planned: plannedTillToday,
          completed: completedTillToday,
          percent: completionPct,
          pending: pendingPeriods,
          status,
          statusColor
        });

        overallPlannedTillToday += plannedTillToday;
        overallCompletedTillToday += completedTillToday;
      }

      // Calculate yearly row
      if (totalYearly > 0) {
        const completionPct = Math.round((completedYearly / totalYearly) * 100);
        rowsYearly.push({
          class: g.class,
          section: g.section,
          subject: g.subject,
          totalPlanned: totalYearly,
          completed: completedYearly,
          percent: completionPct
        });
      }
    });

    const overallPct = overallPlannedTillToday > 0 
      ? Math.round((overallCompletedTillToday / overallPlannedTillToday) * 100)
      : 0;

    return {
      rowsTillToday,
      rowsYearly,
      overallPct,
      overallCompleted: overallCompletedTillToday,
      overallPending: Math.max(0, overallPlannedTillToday - overallCompletedTillToday)
    };
  }, [syllabusData]);

  const selectedTeacherName = useMemo(() => {
    if (selectedTeacherId === 'All') return 'All Teachers';
    const t = teachers.find(item => Number(item.id) === Number(selectedTeacherId));
    return t ? t.name : 'Unknown';
  }, [selectedTeacherId, teachers]);

  return (
    <div className="space-y-6 animate-fade-in p-1.5 sm:p-6 pb-16 max-w-7xl mx-auto print:p-0">
      
      {/* Top Filter Panel - Hidden in Print Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Clock className="text-brand-600 w-6 h-6 sm:w-8 sm:h-8" />
            Syllabus Completion Report
          </h1>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Real-time tracking of syllabus pacing and delays
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 shadow-sm min-w-[200px] flex-1 sm:flex-initial">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Choose Teacher:</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="w-full bg-transparent border-none text-xs font-semibold text-slate-700 outline-none cursor-pointer focus:ring-0 py-0.5"
            >
              <option value="All">All Teachers</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Generating Syllabus Completion Metrics...</span>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-10 bg-white p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-md print:border-none print:shadow-none print:p-0">
          
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4 border-b-2 border-slate-100 pb-4 sm:pb-6">
            <div className="space-y-1">
              <div className="text-[9px] sm:text-xs font-black text-blue-600 uppercase tracking-widest">Academic Report</div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight uppercase">Syllabus Completion Report</h2>
              <div className="text-xs sm:text-sm font-bold text-slate-600 flex items-center gap-1.5">
                <span>Name of the teacher:</span>
                <span className="text-indigo-600 underline decoration-indigo-200 decoration-2 font-black">{selectedTeacherName}</span>
              </div>
            </div>
            <div className="text-left sm:text-right text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Generated On: {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>

          {/* TABLE 1: TILL TODAY */}
          <div className="space-y-3">
            <div className="bg-slate-900 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl text-center font-black uppercase tracking-wider text-xs sm:text-sm shadow-sm">
              Syllabus Completion Status Till Today
            </div>
            
            <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-[10px] sm:text-xs min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="bg-slate-800 text-white border-b border-slate-700">
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider">Class</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider">Section</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider">Subject</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider text-center">Planned Till Today</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider text-center">Completed</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider text-center">Completion %</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider text-center">Pending</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {reportData.rowsTillToday.length > 0 ? reportData.rowsTillToday.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold text-slate-800">{r.class}</td>
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-semibold text-slate-600">{r.section}</td>
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold text-slate-700">{r.subject}</td>
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 text-center font-bold text-slate-600 bg-slate-50/30">{r.planned}</td>
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 text-center font-bold text-emerald-600 bg-emerald-50/20">{r.completed}</td>
                      <td className={`px-2.5 sm:px-5 py-2 sm:py-3.5 text-center font-extrabold ${
                        r.percent >= 90 ? 'text-emerald-600' : r.percent >= 70 ? 'text-amber-600' : 'text-rose-600'
                      }`}>{r.percent}%</td>
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 text-center font-bold text-slate-500">{r.pending}</td>
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 text-center">
                        <span className={`inline-flex px-1.5 sm:px-3 py-0.5 sm:py-1 rounded text-[8px] sm:text-[9px] font-black uppercase border tracking-wider ${r.statusColor}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="px-2.5 sm:px-5 py-8 text-center text-slate-400 font-bold uppercase tracking-widest">
                        No syllabus entries found for this teacher
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: YEARLY */}
          <div className="space-y-3">
            <div className="bg-slate-900 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl text-center font-black uppercase tracking-wider text-xs sm:text-sm shadow-sm">
              Syllabus Completion Status Yearly
            </div>
            
            <div className="overflow-x-auto rounded-lg sm:rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-[10px] sm:text-xs min-w-[500px] sm:min-w-0">
                <thead>
                  <tr className="bg-slate-800 text-white border-b border-slate-700">
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider">Class</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider">Section</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider">Subject</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider text-center">Planned Yearly</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider text-center">Total Completed</th>
                    <th className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold uppercase tracking-wider text-center">Percentage Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {reportData.rowsYearly.length > 0 ? reportData.rowsYearly.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold text-slate-800">{r.class}</td>
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-semibold text-slate-600">{r.section}</td>
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 font-bold text-slate-700">{r.subject}</td>
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 text-center font-bold text-slate-600 bg-slate-50/30">{r.totalPlanned}</td>
                      <td className="px-2.5 sm:px-5 py-2 sm:py-3.5 text-center font-bold text-emerald-600 bg-emerald-50/20">{r.completed}</td>
                      <td className={`px-2.5 sm:px-5 py-2 sm:py-3.5 text-center font-extrabold ${
                        r.percent >= 90 ? 'text-emerald-600' : r.percent >= 70 ? 'text-amber-600' : 'text-rose-600'
                      }`}>{r.percent}%</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-2.5 sm:px-5 py-8 text-center text-slate-400 font-bold uppercase tracking-widest">
                        No syllabus entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: PIE CHART & OVERALL STATS */}
          {syllabusData.length > 0 && (
            <div className="pt-6 border-t border-slate-100 flex flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest">
                  Overall Syllabus Completion Percentage Till Today
                </h3>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 w-full justify-center">
                {/* CSS Conic Gradient Pie Chart */}
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.05)] border-4 border-white flex items-center justify-center flex-shrink-0">
                  <div 
                    className="absolute inset-0 rounded-full transition-all duration-500"
                    style={{
                      background: `conic-gradient(#10b981 0% ${reportData.overallPct}%, #ef4444 ${reportData.overallPct}% 100%)`
                    }}
                  />
                  {/* Inner cut-out for donut look */}
                  <div className="absolute w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">{reportData.overallPct}%</span>
                    <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-wider">Completed</span>
                  </div>
                </div>

                {/* Legend & Summary Box */}
                <div className="space-y-4 w-full sm:w-auto max-w-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-8 text-[10px] sm:text-xs font-bold text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                        <span>COMPLETED</span>
                      </div>
                      <span className="text-emerald-600 font-black">{reportData.overallPct}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-8 text-[10px] sm:text-xs font-bold text-slate-600">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded bg-rose-500" />
                        <span>PENDING</span>
                      </div>
                      <span className="text-rose-600 font-black">{100 - reportData.overallPct}%</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl px-4 py-2.5 text-center bg-slate-50/50 shadow-inner">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Summary</span>
                    <span className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-wide">
                      Overall Completion: <span className="text-emerald-600 font-black text-xs sm:text-sm">{reportData.overallPct}%</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
