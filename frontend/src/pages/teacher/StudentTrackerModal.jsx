import React, { useState } from 'react';
import { Modal } from '../../components/ui/index.jsx';
import { Search, Users, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

const StudentTrackerModal = ({ period, onClose, onSave, canEdit }) => {
  // Ensure students are filtered by class/section and are active
  const allStudents = Array.isArray(period.students) ? period.students : [];
  
  const [studentStatuses, setStudentStatuses] = useState(() => {
    const initial = {};
    allStudents.forEach(s => {
      initial[s.id] = {
        lo: s.learning_status || s.lo_status || 'Meeting',
        completed: s.completed !== false && s.homework !== false && s.notebook !== false
      };
    });
    return initial;
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  // MANDATORY SAFE DEFINITION: Fix ReferenceError: notDoneIds is not defined
  const selectedStudents = allStudents.map(s => ({ ...s, completed: studentStatuses[s.id]?.completed }));
  const notDoneIds = selectedStudents?.filter(s => s.completed === false)?.map(s => s.id) || [];
  const notDoneCount = notDoneIds.length;

  const setLOStatus = (studentId, lo) => {
    if (!canEdit) return;
    setStudentStatuses(prev => ({ ...prev, [studentId]: { ...prev[studentId], lo } }));
  };

  const toggleCompletion = (studentId) => {
    if (!canEdit) return;
    setStudentStatuses(prev => ({ ...prev, [studentId]: { ...prev[studentId], completed: !prev[studentId].completed } }));
  };

  const filteredStudents = allStudents.filter(s =>
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber?.toString()?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = () => {
    const updated = allStudents.map(s => ({
      ...s,
      learning_status: studentStatuses[s.id].lo,
      lo_status: studentStatuses[s.id].lo,
      homework: studentStatuses[s.id].completed,
      notebook: studentStatuses[s.id].completed,
      completed: studentStatuses[s.id].completed
    }));
    onSave(updated);
  };

  return (
    <Modal 
      open={true} 
      onClose={onClose} 
      title={`Tracking — ${period.subject} (${period.class})`} 
      size="lg"
    >
      <div className="space-y-4">
        <div className={clsx(
          "flex items-center gap-2 p-3 rounded-lg border",
          canEdit ? "bg-brand-50 border-brand-200" : "bg-slate-50 border-slate-200"
        )}>
          <Users size={16} className={canEdit ? "text-brand-600" : "text-slate-600"} />
          <p className={clsx("text-xs font-medium", canEdit ? "text-brand-700" : "text-slate-700")}>
            {canEdit 
              ? "Track individual student performance and work completion for this topic."
              : "View-only performance data synced from teacher records."}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search student by name or roll..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-xl w-full text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
          />
        </div>

        {/* Student List */}
        <div className="max-h-[450px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredStudents.map((student) => {
            const status = studentStatuses[student.id];
            const isCompleted = status.completed;

            return (
              <div
                key={student.id}
                onClick={() => toggleCompletion(student.id)}
                className={clsx(
                  "flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer group",
                  !isCompleted 
                    ? "border-rose-300 bg-rose-50 shadow-sm shadow-rose-100" 
                    : "border-slate-100 bg-white hover:border-brand-200"
                )}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div 
                    className={clsx(
                      "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-rose-600 text-white shadow-lg shadow-rose-200"
                    )}
                  >
                    {isCompleted ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className={clsx("text-sm font-black transition-colors", !isCompleted ? "text-rose-700" : "text-slate-800")}>
                      {student.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Roll: {student.rollNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border-2",
                    isCompleted 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-100"
                  )}>
                    {isCompleted ? 'Work Done' : 'Not Done'}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredStudents.length === 0 && (
            <div className="py-12 text-center text-slate-400 italic text-sm">
              {searchTerm ? "No matching students found." : "No students found in this class."}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500">
            {notDoneCount > 0 ? (
              <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                {notDoneCount} Students Pending Work
              </span>
            ) : (
              <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                All Students Completed Work
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              className="bg-brand-600 text-white px-8 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all hover:scale-105 active:scale-95"
            >
              Update Tracking
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StudentTrackerModal;
