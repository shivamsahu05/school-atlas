// src/data/mockAPI.js
import { ALL_TEACHERS } from './dummyData';

// Mock teachers with permissions
const teachers = {
  'priya@school.com': {
    id: 't1',
    name: 'Priya Sharma',
    email: 'priya@school.com',
    role: 'teacher',
    employeeId: 'TCH001',
    joinedDate: '2020-06-15',
    assignedClasses: ['8A', '9B', '3A', '4B'],
    assignedSubjects: ['Mathematics', 'Science', 'Computer'],
    permissions: {
      scheduleEdit: { enabled: true, expiryDate: '2025-12-31' },
      homeworkCreate: { enabled: true, expiryDate: '2025-06-30' },
      homeworkEdit: { enabled: true, expiryDate: '2025-06-30' },
      studentTracking: { enabled: true, expiryDate: '2025-12-31' },
      leaveApply: { enabled: true, expiryDate: null },
      loEdit: { enabled: false, expiryDate: null },
      marksEntry: { enabled: true, expiryDate: '2025-06-30' },
      addStudent: { enabled: true, expiryDate: '2025-12-31' },
    }
  },
  'rahul@school.com': {
    id: 't2',
    name: 'Rahul Mehta',
    email: 'rahul@school.com',
    role: 'teacher',
    employeeId: 'TCH002',
    assignedClasses: ['10A', '10B'],
    assignedSubjects: ['English', 'Social Studies'],
    permissions: {
      scheduleEdit: { enabled: false, expiryDate: null },
      homeworkCreate: { enabled: true, expiryDate: '2025-05-15' },
      studentTracking: { enabled: true, expiryDate: '2025-05-15' },
      leaveApply: { enabled: true, expiryDate: null },
    }
  },
  'admin@school.com': {
    id: 'a1',
    name: 'Admin User',
    email: 'admin@school.com',
    role: 'admin',
    employeeId: 'ADM001',
    assignedClasses: [],
    assignedSubjects: [],
    permissions: {}
  }
};

// Helper to generate dummy students
const generateStudents = (className) => {
  const baseNames = {
    '8A': ['Rahul', 'Priya', 'Amit', 'Neha', 'Rohan'],
    '9B': ['Anjali', 'Vikram', 'Sneha', 'Karan', 'Pooja'],
    '10A': ['Arjun', 'Divya', 'Ravi', 'Sonia', 'Kiran'],
    '10B': ['Manoj', 'Lata', 'Sunil', 'Anita', 'Raj'],
    '3A': ['Aarav', 'Ishita', 'Reyansh', 'Anaya', 'Vihaan'],
    '4B': ['Kabir', 'Myra', 'Advik', 'Saanvi', 'Arhaan']
  };
  const names = baseNames[className] || ['Student1', 'Student2'];
  return names.map(name => ({
    id: Math.random().toString(36).substr(2, 5),
    name,
    rollNumber: `R${Math.floor(Math.random()*100)}`,
    homework: Math.random() > 0.5,
    notebook: Math.random() > 0.5,
  }));
};

// Generate schedule data
export const getTeacherOrDefault = (teacherId) => {
  const found = Object.values(teachers).find(t => t.id === teacherId);
  if (found) return found;
  return Object.values(teachers).find(t => t.role === 'teacher');
};

const generateSchedule = (teacherId) => {
  const teacher = getTeacherOrDefault(teacherId);
  if (!teacher) return [];
  const schedule = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [1,2,3,4,5,6];
  teacher.assignedClasses.forEach(cls => {
    teacher.assignedSubjects.forEach(sub => {
      days.forEach(day => {
        const period = periods[Math.floor(Math.random() * periods.length)];
        if (!schedule.find(s => s.day === day && s.period === period && s.class === cls)) {
          schedule.push({
            id: `${day}-${period}-${cls}-${sub}`,
            day,
            period,
            subject: sub,
            class: cls,
            chapter: `Chapter ${Math.floor(Math.random()*10)+1}`,
            topics: `Topics for ${sub}`,
            status: ['Completed', 'Pending', 'In Progress'][Math.floor(Math.random()*3)],
            students: generateStudents(cls),
          });
        }
      });
    });
  });
  return schedule.slice(0, 30);
};

// Homework mock data
const generateHomework = (teacherId) => {
  const teacher = getTeacherOrDefault(teacherId);
  if (!teacher) return [];
  return teacher.assignedClasses.flatMap(cls => 
    teacher.assignedSubjects.map(sub => ({
      id: `hw-${cls}-${sub}-${Date.now() + Math.random()}`,
      description: `${sub} Assignment`,
      class: cls,
      subject: sub,
      due: new Date(Date.now() + Math.random()*7*86400000).toISOString().split('T')[0],
      total: 30,
      submitted: Math.floor(Math.random()*30),
      defaulters: generateStudents(cls).filter(s => !s.homework).map(s => s.name),
    }))
  );
};

// LO entries
const generateLOEntries = (teacherId) => {
  const teacher = getTeacherOrDefault(teacherId);
  if (!teacher) return [];
  return teacher.assignedClasses.flatMap(cls =>
    generateStudents(cls).map(s => ({
      studentId: s.id,
      rollNumber: s.rollNumber,
      name: s.name,
      class: cls,
      subject: teacher.assignedSubjects[0],
      topic: 'Linear Equations',
      teacherScore: Math.floor(Math.random()*40)+60,
      principalScore: Math.floor(Math.random()*40)+60,
      status: ['Approaching', 'Meeting', 'Exceeding'][Math.floor(Math.random()*3)],
      mobile: `98765${Math.floor(Math.random()*100000)}`,
    }))
  );
};

// ---------- NEW: Weekly Syllabus Data ----------
const generateWeeklySyllabus = (classId, subject) => {
  const classStudents = generateStudents(classId);
  
  if (subject.toLowerCase().includes('computer')) {
    return [
      { id: '1', month: 'April', week: 'Week 1 (1–7)', periods: 5, chapter: 'Ch-1 A Computer System (Hardware)', status: 'Pending', periodsNeeded: 5, learningStatus: 'Meeting', homeworkStatus: 'Complete', students: JSON.parse(JSON.stringify(classStudents)) },
      { id: '2', month: 'April', week: 'Week 2 (8–14)', periods: 5, chapter: 'Input Devices', status: 'Pending', periodsNeeded: 5, learningStatus: 'Meeting', homeworkStatus: 'Complete', students: JSON.parse(JSON.stringify(classStudents)) },
      { id: '3', month: 'April', week: 'Week 3 (15–21)', periods: 5, chapter: 'Output & Processing Devices', status: 'Pending', periodsNeeded: 5, learningStatus: 'Meeting', homeworkStatus: 'Complete', students: JSON.parse(JSON.stringify(classStudents)) },
      { id: '4', month: 'April', week: 'Week 4 (22–28)', periods: 5, chapter: 'Software, IPO', status: 'Pending', periodsNeeded: 5, learningStatus: 'Meeting', homeworkStatus: 'Complete', students: JSON.parse(JSON.stringify(classStudents)) },
      { id: '5', month: 'April', week: 'Week 5 (29–30)', periods: 5, chapter: 'Basic Functions of Computer', status: 'Pending', periodsNeeded: 5, learningStatus: 'Meeting', homeworkStatus: 'Complete', students: JSON.parse(JSON.stringify(classStudents)) },
    ];
  }
  return [
    { id: '1', month: 'April', week: 'Week 1 (1–7)', periods: 4, chapter: 'Introduction', status: 'Pending', periodsNeeded: 4, learningStatus: 'Meeting', homeworkStatus: 'Complete', students: JSON.parse(JSON.stringify(classStudents)) },
    { id: '2', month: 'April', week: 'Week 2 (8–14)', periods: 4, chapter: 'Core Concepts', status: 'Pending', periodsNeeded: 4, learningStatus: 'Meeting', homeworkStatus: 'Complete', students: JSON.parse(JSON.stringify(classStudents)) },
    { id: '3', month: 'April', week: 'Week 3 (15–21)', periods: 4, chapter: 'Advanced Topics', status: 'Pending', periodsNeeded: 4, learningStatus: 'Meeting', homeworkStatus: 'Complete', students: JSON.parse(JSON.stringify(classStudents)) },
    { id: '4', month: 'April', week: 'Week 4 (22–28)', periods: 4, chapter: 'Review & Practice', status: 'Pending', periodsNeeded: 4, learningStatus: 'Meeting', homeworkStatus: 'Complete', students: JSON.parse(JSON.stringify(classStudents)) },
  ];
};

// ---------- API Functions ----------
export const mockLogin = async (email, password) => {
  await new Promise(r => setTimeout(r, 500));
  const teacher = teachers[email];
  if (!teacher || password !== 'password') throw new Error('Invalid credentials');
  return { token: `mock-token-${teacher.id}`, user: teacher };
};

export const mockFetchTeacherData = async (token) => {
  await new Promise(r => setTimeout(r, 300));
  const id = token.split('-')[2];
  const teacher = Object.values(teachers).find(t => t.id === id);
  return teacher;
};

export const getDashboardData = async (teacherId) => {
  const schedule = generateSchedule(teacherId);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = schedule.filter(s => s.day === today);
  return {
    stats: {
      loMeeting: 65,
      loExceeding: 20,
      loApproaching: 15,
      attendanceChart: [
        { month: 'Jan', pct: 92 }, { month: 'Feb', pct: 88 }
      ]
    },
    birthdays: { today: [], week: [] },
    celebrations: [],
    performance: { isTopPerformer: true, isLowPerformer: false },
    notifications: [],
    schedule: { completed: 2, total: todaySchedule.length, day: today },
    syllabus: { completed: 8, total: 12, percentage: 67 },
    homework: { defaulterCount: 5 }
  };
};

export const fetchSchedule = async (teacherId, filters) => {
  await new Promise(r => setTimeout(r, 300));
  let schedule = generateSchedule(teacherId);
  if (filters.class !== 'All') schedule = schedule.filter(s => s.class === filters.class);
  if (filters.subject !== 'All') schedule = schedule.filter(s => s.subject === filters.subject);
  return schedule;
};

export const updatePeriodStatus = async (periodId, status) => ({ success: true });
export const updateStudentProgress = async (periodId, students) => ({ success: true });
export const bulkMarkCompleted = async (teacherId, filters) => ({ success: true });

export const fetchHomework = async (teacherId, filters) => {
  await new Promise(r => setTimeout(r, 300));
  let hw = generateHomework(teacherId);
  if (filters.class !== 'All') hw = hw.filter(h => h.class === filters.class);
  if (filters.subject !== 'All') hw = hw.filter(h => h.subject === filters.subject);
  return hw;
};

export const addHomework = async (homework) => ({ success: true, id: Date.now() });
export const updateHomework = async (id, homework) => ({ success: true });
export const deleteHomework = async (id) => ({ success: true });

export const fetchLOData = async (teacherId, filters) => {
  await new Promise(r => setTimeout(r, 300));
  let entries = generateLOEntries(teacherId);
  if (filters.class !== 'All') entries = entries.filter(e => e.class === filters.class);
  if (filters.subject !== 'All') entries = entries.filter(e => e.subject === filters.subject);
  return entries;
};

export const fetchAnalytics = async (teacherId, filters) => {
  return {
    attendance: 91, marks: 81, loScore: 84, observations: []
  };
};

export const fetchLeaves = async (teacherId) => {
  return [];
};

export const applyLeave = async (leaveData) => ({ success: true, id: Date.now() });

export const fetchDashboardData = async () => {
  return {};
};

export const fetchNotifications = async () => {
  return [];
};

export const fetchStudentPerformance = async (filters) => {
  return [];
};

export const fetchWeeklySyllabus = async (teacherId, classId, subject) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return generateWeeklySyllabus(classId, subject);
};

export const updateWeeklyPlan = async (rowId, updates) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
};

// ---------- NEW: Completion Report Data ----------
export const fetchCompletionReport = async ({ teacherId, class: classFilter, section: sectionFilter, subject: subjectFilter, week: weekFilter }) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const teacher = teacherId ? getTeacherOrDefault(teacherId) : null;
  let allowedClasses = teacher ? teacher.assignedClasses : ['8A', '9B', '10A', '10B', '3A', '4B'];
  let allowedSubjects = teacher ? teacher.assignedSubjects : ['Mathematics', 'Science', 'English', 'Computer', 'Social Studies'];
  
  if (classFilter && classFilter !== 'All') {
    if (sectionFilter && sectionFilter !== 'All') {
      allowedClasses = allowedClasses.filter(c => c === `${classFilter}${sectionFilter}`);
    } else {
      allowedClasses = allowedClasses.filter(c => c.startsWith(classFilter));
    }
  }
  if (subjectFilter && subjectFilter !== 'All') {
    allowedSubjects = allowedSubjects.filter(s => s === subjectFilter);
  }
  
  const reportData = [];
  
  allowedClasses.forEach(cls => {
    allowedSubjects.forEach(sub => {
      const weeklyPlans = generateWeeklySyllabus(cls, sub);
      
      weeklyPlans.forEach(plan => {
        if (weekFilter && weekFilter !== 'All') {
          const weekLower = weekFilter.toLowerCase();
          const planWeekLower = plan.week.toLowerCase();
          if (weekFilter === 'Current') {
            if (!planWeekLower.includes('week 1')) return;
          } else if (weekFilter === 'Last Week') {
            if (!planWeekLower.includes('week 4')) return;
          } else {
            if (!planWeekLower.includes(weekLower)) return;
          }
        }
        
        const classMatch = cls.match(/^(\d+)([A-Z])$/);
        const className = classMatch ? classMatch[1] : cls;
        const sectionName = classMatch ? classMatch[2] : '';
        
        (plan.students || []).forEach(student => {
          reportData.push({
            id: `${cls}-${sub}-${plan.id}-${student.id}`,
            studentName: student.name,
            class: className,
            section: sectionName,
            subject: sub,
            week: plan.week,
            homeworkComplete: student.homework || false,
            notebookComplete: student.notebook || false,
            teacherChecked: Math.random() > 0.3, 
            lastUpdated: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
          });
        });
      });
    });
  });
  
  return reportData;
};