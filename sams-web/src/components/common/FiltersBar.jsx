import React from 'react';

const FiltersBar = ({ filters, onChange, classes, subjects, showWeek = false, showMonth = false }) => {
  const uniqueClasses = [...new Set(classes.map(c => c.replace(/[A-Z]$/, '')))];
  const currentClass = filters.class === 'All' ? 'All' : filters.class.replace(/[A-Z]$/, '');
  const currentSection = filters.class === 'All' ? 'All' : filters.class.replace(/^[0-9]+/, '');

  const availableSections = filters.class === 'All' || currentClass === 'All' 
    ? [] 
    : classes.filter(c => c.startsWith(currentClass)).map(c => c.replace(currentClass, ''));

  return (
    <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-xl shadow-sm border">
      <select
        value={currentClass}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'All') onChange({ ...filters, class: 'All' });
          else {
            const firstAvailable = classes.find(c => c.startsWith(val));
            onChange({ ...filters, class: firstAvailable });
          }
        }}
        className="border rounded-lg px-3 py-2 text-sm"
      >
        <option value="All">All Classes</option>
        {uniqueClasses.map(c => <option key={c} value={c}>Class {c}</option>)}
      </select>

      <select
        value={currentSection}
        disabled={currentClass === 'All'}
        onChange={(e) => {
          onChange({ ...filters, class: currentClass + e.target.value });
        }}
        className="border rounded-lg px-3 py-2 text-sm disabled:opacity-50"
      >
        <option value="All" disabled={currentClass !== 'All'}>Section</option>
        {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
      </select>
      <select
        value={filters.subject}
        onChange={(e) => onChange({ ...filters, subject: e.target.value })}
        className="border rounded-lg px-3 py-2 text-sm"
      >
        <option value="All">All Subjects</option>
        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {showWeek && (
        <select
          value={filters.week}
          onChange={(e) => onChange({ ...filters, week: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="Current">Current Week</option>
          <option value="Week1">Week 1</option>
          <option value="Week2">Week 2</option>
          <option value="Week3">Week 3</option>
          <option value="Week4">Week 4</option>
        </select>
      )}
      {showMonth && (
        <select
          value={filters.month}
          onChange={(e) => onChange({ ...filters, month: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="All">All Months</option>
          <option value="January">January</option>
          <option value="February">February</option>
          <option value="March">March</option>
        </select>
      )}
    </div>
  );
};

export default FiltersBar;
