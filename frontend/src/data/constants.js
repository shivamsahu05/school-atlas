/**
 * SAMS Global Constants
 * Centralized data to avoid duplicate declarations and build errors.
 */

export const MONTHS = [
  'All', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const ALL_CLASSES = [
  'All', 'Grade 6-C', 'Grade 7-B', 'Grade 8-A', 'Grade 9-A', 'Grade 10-A'
];

export const DEPARTMENTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'
];

export const SUBJECTS = [...DEPARTMENTS, 'Secondary Subjects', 'Physical Education', 'Arts'];

export const ADMIN_DEPT_FILTER = ['All', ...DEPARTMENTS];

export const PERFORMANCE_WEIGHTS = [
  { label: 'Syllabus Completion', key: 'syllabus', w: '15%', color: 'bg-brand-500' },
  { label: 'LO Achievement', key: 'lo', w: '20%', color: 'bg-emerald-500' },
  { label: 'Classroom Observation', key: 'observation', w: '30%', color: 'bg-teal-500' },
  { label: 'Other Contributions', key: 'other', w: '20%', color: 'bg-amber-500' },
  { label: 'Language Contribution', key: 'language', w: '15%', color: 'bg-purple-500' },
];

export const OBSERVATION_CRITERIA = [
  'Content Mastery', 'Pedagogy', 'Student Engagement', 'Communication', 'Assessment'
];

export const COLOR_MAP = {
  blue: 'bg-brand-50 text-brand-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-rose-50 text-rose-600',
  teal: 'bg-teal-50 text-teal-600',
  purple: 'bg-purple-50 text-purple-600',
};
