import React, { useState } from 'react';
import { Modal } from '../../components/ui/index.jsx';
import { Search, UserX } from 'lucide-react';

const StudentTrackerModal = ({ period, onClose, onSave, canEdit }) => {
  // Track which students are selected as "Not Done"
  const allStudents = period.students || [];
  const [notDoneIds, setNotDoneIds] = useState(() => {
    // Initialize: students already marked as homework=false are pre-selected
    return new Set(allStudents.filter(s => !s.homework).map(s => s.id));
  });
  const [searchTerm, setSearchTerm] = useState('');

  const toggleStudent = (studentId) => {
    if (!canEdit) return;
    setNotDoneIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const filteredStudents = allStudents.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    const updated = allStudents.map(s => ({
      ...s,
      homework: !notDoneIds.has(s.id),
    }));
    onSave(updated);
  };

  return (
    <Modal open={true} onClose={onClose} title={`Select Not Done — ${period.subject} (${period.class})`} size="lg">
      <div className="space-y-4">
        {/* Info */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <UserX size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Click on students who have <strong>not done</strong> their homework. Selected: <strong>{notDoneIds.size}</strong> of {allStudents.length}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-lg w-full text-sm"
          />
        </div>

        {/* Student List — click to select as "Not Done" */}
        <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
          {filteredStudents.map((student) => {
            const isSelected = notDoneIds.has(student.id);
            return (
              <div
                key={student.id}
                onClick={() => toggleStudent(student.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer select-none
                  ${isSelected
                    ? 'border-red-300 bg-red-50 ring-1 ring-red-200'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                  }
                  ${!canEdit ? 'pointer-events-none opacity-70' : ''}
                `}
              >
                {/* Name + Roll */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{student.name}</p>
                  <p className="text-xs text-gray-400">Roll: {student.rollNumber}</p>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                    Not Done
                  </span>
                )}
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
