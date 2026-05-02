import React, { useState } from 'react';
import { Modal } from '../../components/ui/index.jsx';
import { Search, Users } from 'lucide-react';

const StudentTrackerModal = ({ period, onClose, onSave, canEdit }) => {
  const allStudents = Array.isArray(period.students) ? period.students : [];
  const [studentStatuses, setStudentStatuses] = useState(() => {
    const initial = {};
    allStudents.forEach(s => {
      initial[s.id] = s.learning_status || s.lo_status || 'Meeting';
    });
    return initial;
  });
  
  const [searchTerm, setSearchTerm] = useState('');

  const setStatus = (studentId, status) => {
    if (!canEdit) return;
    setStudentStatuses(prev => ({ ...prev, [studentId]: status }));
  };

  const filteredStudents = allStudents.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    const updated = allStudents.map(s => ({
      ...s,
      learning_status: studentStatuses[s.id],
      lo_status: studentStatuses[s.id],
      homework: studentStatuses[s.id] !== 'Approaching' 
    }));
    onSave(updated);
  };

  return (
    <Modal 
      open={true} 
      onClose={onClose} 
      title={`LO Performance Tracking — ${period.subject} (${period.class})`} 
      size="lg"
    >
      <div className="space-y-4">
        {canEdit ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
            <Users size={16} className="text-indigo-600 flex-shrink-0" />
            <p className="text-xs text-indigo-700">
              Set the <strong>Learning Outcome (LO)</strong> level for each student for this topic.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <Users size={16} className="text-slate-600 flex-shrink-0" />
            <p className="text-xs text-slate-700 font-medium">View Only — Performance data synced from Weekly Plan.</p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-xl w-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Student List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredStudents.map((student) => {
            const currentStatus = studentStatuses[student.id];
            return (
              <div
                key={student.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all
                  ${currentStatus === 'Exceeding' ? 'border-emerald-200 bg-emerald-50/20' : 
                    currentStatus === 'Approaching' ? 'border-rose-200 bg-rose-50/20' : 
                    'border-slate-100 bg-white'}
                `}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{student.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Roll: {student.rollNumber}</p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-100">
                  {['Approaching', 'Meeting', 'Exceeding'].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setStatus(student.id, lvl)}
                      disabled={!canEdit}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${
                        currentStatus === lvl 
                          ? (lvl === 'Exceeding' ? 'bg-emerald-500 text-white shadow-sm' :
                             lvl === 'Approaching' ? 'bg-rose-500 text-white shadow-sm' :
                             'bg-indigo-500 text-white shadow-sm')
                          : 'text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {lvl.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredStudents.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">
              No students found
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Save ({notDoneIds.size} not done)
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default StudentTrackerModal;
