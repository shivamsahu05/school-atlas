import React from 'react';
import { useAuth } from '../../context/AuthContext';
import TimetableGrid from '../../components/teacher/TimetableGrid';

export default function TeacherTimeTable() {
  const { user } = useAuth();

  if (!user) return <div className="p-4 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-8 animate-fade-in py-2 sm:py-4 px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Time Table</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            Weekly Timetable Overview
          </p>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <TimetableGrid />
      </div>
    </div>
  );
}
