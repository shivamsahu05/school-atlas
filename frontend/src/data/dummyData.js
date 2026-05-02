/* ─────────────────────────────────────────────────────────────────────────
   SAMS Dummy Data  –  mirrors DummyDataRepository.kt from the Android app
   Replace all exports with real API calls when backend is ready.
───────────────────────────────────────────────────────────────────────── */

// ── Users ──────────────────────────────────────────────────────────────────
export const TEACHER = {
  id: 'T001', name: 'Priya Sharma', email: 'priya.sharma@school.edu',
  role: 'teacher', subject: 'Mathematics', classAssigned: 'Grade 8-A',
}

export const PRINCIPAL = {
  id: 'P001', name: 'Dr. Rajesh Kumar', email: 'principal@school.edu', role: 'principal',
}

export const ALL_TEACHERS = [
  TEACHER,
  { id:'T002', name:'Anjali Mehta',  email:'anjali@school.edu',  role:'teacher', subject:'Science',       classAssigned:'Grade 7-B' },
  { id:'T003', name:'Ramesh Patel',  email:'ramesh@school.edu',  role:'teacher', subject:'English',       classAssigned:'Grade 9-A' },
  { id:'T004', name:'Sunita Joshi',  email:'sunita@school.edu',  role:'teacher', subject:'Hindi',         classAssigned:'Grade 6-C' },
  { id:'T005', name:'Vikram Singh',  email:'vikram@school.edu',  role:'teacher', subject:'Social Studies',classAssigned:'Grade 10-A'},
]

export const STUDENTS = [
  { id:'S01', name:'Aarav Sharma',  rollNo:'01', class:'Grade 8-A', email:'aarav@school.edu', mobile:'9823456701' },
  { id:'S02', name:'Ananya Patel',  rollNo:'02', class:'Grade 8-A', email:'ananya@school.edu', mobile:'9823456702' },
  { id:'S03', name:'Arjun Mehta',   rollNo:'03', class:'Grade 8-A', email:'arjun@school.edu', mobile:'9823456703' },
  { id:'S04', name:'Bhavya Singh',  rollNo:'04', class:'Grade 8-A', email:'bhavya@school.edu', mobile:'9823456704' },
  { id:'S05', name:'Chetan Joshi',  rollNo:'05', class:'Grade 8-A', email:'chetan@school.edu', mobile:'9823456705' },
  { id:'S06', name:'Deepa Nair',    rollNo:'06', class:'Grade 8-A', email:'deepa@school.edu', mobile:'9823456706' },
  { id:'S07', name:'Eshan Kumar',   rollNo:'07', class:'Grade 8-A', email:'eshan@school.edu', mobile:'9823456707' },
  { id:'S08', name:'Farida Bano',   rollNo:'08', class:'Grade 8-A', email:'farida@school.edu', mobile:'9823456708' },
  { id:'S09', name:'Gaurav Rao',    rollNo:'09', class:'Grade 8-A', email:'gaurav@school.edu', mobile:'9823456709' },
  { id:'S10', name:'Harini Reddy',  rollNo:'10', class:'Grade 8-A', email:'harini@school.edu', mobile:'9823456710' },
  { id:'S11', name:'Ishaan Verma',  rollNo:'11', class:'Grade 8-A', email:'ishaan@school.edu', mobile:'9823456711' },
  { id:'S12', name:'Jahnavi Tiwari',rollNo:'12', class:'Grade 8-A', email:'jahnavi@school.edu', mobile:'9823456712' },
]

// ── Syllabus ───────────────────────────────────────────────────────────────
export const SYLLABUS_ITEMS = [
  { id:'SYL001', topic:'Rational Numbers',        chapter:'Chapter 1',  subject:'Mathematics', class:'Grade 8-A', completed:true,  completedDate:'2024-01-08', plannedDate:'2024-01-07'  },
  { id:'SYL002', topic:'Powers and Exponents',    chapter:'Chapter 2',  subject:'Mathematics', class:'Grade 8-A', completed:true,  completedDate:'2024-01-12', plannedDate:'2024-01-11' },
  { id:'SYL003', topic:'Linear Equations',        chapter:'Chapter 3',  subject:'Mathematics', class:'Grade 8-A', completed:true,  completedDate:'2024-01-15', plannedDate:'2024-01-14' },
  { id:'SYL004', topic:'Quadratic Equations',     chapter:'Chapter 4',  subject:'Mathematics', class:'Grade 8-A', completed:true,  completedDate:'2024-01-22', plannedDate:'2024-01-21' },
  { id:'SYL005', topic:'Triangles & Properties',  chapter:'Chapter 5',  subject:'Mathematics', class:'Grade 8-A', completed:true,  completedDate:'2024-01-29', plannedDate:'2024-01-28' },
  { id:'SYL006', topic:'Mensuration',             chapter:'Chapter 6',  subject:'Mathematics', class:'Grade 8-A', completed:false, completedDate:'',           plannedDate:'2024-02-05'  },
  { id:'SYL007', topic:'Data Handling',           chapter:'Chapter 7',  subject:'Mathematics', class:'Grade 8-A', completed:false, completedDate:'',           plannedDate:'2024-02-12' },
  { id:'SYL008', topic:'Introduction to Graphs',  chapter:'Chapter 8',  subject:'Mathematics', class:'Grade 8-A', completed:false, completedDate:'',           plannedDate:'2024-02-19' },
  { id:'SYL009', topic:'Playing with Numbers',    chapter:'Chapter 9',  subject:'Mathematics', class:'Grade 8-A', completed:false, completedDate:'',           plannedDate:'2024-02-26' },
  { id:'SYL010', topic:'Factorisation',           chapter:'Chapter 10', subject:'Mathematics', class:'Grade 8-A', completed:false, completedDate:'',           plannedDate:'2024-03-04'  },
]

export const SYLLABUS_STATS = { total:10, completed:5, pending:5 }

// School-wide syllabus (for principal)
export const SCHOOL_SYLLABUS = [
  { teacher:'Priya Sharma',  subject:'Mathematics',   class:'Grade 8-A',  currentWeek: 3, expectedWeek: 5, pct:50, month: 'April' },
  { teacher:'Anjali Mehta',  subject:'Science',       class:'Grade 7-B',  currentWeek: 4, expectedWeek: 4, pct:70, month: 'April' },
  { teacher:'Ramesh Patel',  subject:'English',       class:'Grade 9-A',  currentWeek: 4, expectedWeek: 5, pct:60, month: 'April' },
  { teacher:'Sunita Joshi',  subject:'Hindi',         class:'Grade 6-C',  currentWeek: 5, expectedWeek: 5, pct:80, month: 'March' },
  { teacher:'Vikram Singh',  subject:'Social Studies',class:'Grade 10-A', currentWeek: 2, expectedWeek: 5, pct:40, month: 'April' },
  { teacher:'Priya Sharma',  subject:'Mathematics',   class:'Grade 9-B',  currentWeek: 5, expectedWeek: 5, pct:65, month: 'March' },
  { teacher:'Anjali Mehta',  subject:'Science',       class:'Grade 8-B',  currentWeek: 3, expectedWeek: 5, pct:55, month: 'April' },
]

// ── Homework ───────────────────────────────────────────────────────────────
export const HOMEWORK = [
  { id:'H001', subject:'Mathematics', class:'Grade 8-A', description:'Exercise 3.1 – Q1 to Q10',  assigned:'2024-01-15', due:'2024-01-17', total:42, submitted:38, defaulters:['Aryan Gupta','Priya Patel','Rahul Singh','Sneha Jain'] },
  { id:'H002', subject:'Mathematics', class:'Grade 8-A', description:'Chapter 4 Practice Problems', assigned:'2024-01-17', due:'2024-01-19', total:42, submitted:40, defaulters:['Aryan Gupta','Kavya Sharma'] },
  { id:'H003', subject:'Mathematics', class:'Grade 8-A', description:'Triangle Worksheet',          assigned:'2024-01-22', due:'2024-01-24', total:42, submitted:35, defaulters:['Aryan Gupta','Priya Patel','Rohit Kumar','Ananya Joshi','Dev Patel','Meera Singh','Sahil Verma'] },
  { id:'H004', subject:'Mathematics', class:'Grade 8-A', description:'Revision Test Paper',         assigned:'2024-01-26', due:'2024-01-29', total:42, submitted:42, defaulters:[] },
  { id:'H005', subject:'Mathematics', class:'Grade 8-A', description:'Chapter 2 Ex 2.3',            assigned:'2024-01-08', due:'2024-01-11', total:42, submitted:30, defaulters:['Aryan Gupta','Priya Patel','Rahul Singh','Sneha Jain','Dev Patel','Meera Singh','Sahil Verma','Tanvi Rao','Kiran Bhat','Nikhil Menon','Pooja Nair','Aditya Kumar'] },
]

// ── Learning Outcomes ──────────────────────────────────────────────────────
export const LO_ENTRIES = [
  { id:'LO01', studentId:'S01', student:'Aarav Sharma',  roll:'01', mobile:'9823456701', topic:'Linear Equations', teacherScore:8.5, principalScore:8.0, status:'Exceeding'  },
  { id:'LO02', studentId:'S02', student:'Ananya Patel',  roll:'02', mobile:'9823456702', topic:'Linear Equations', teacherScore:7.0, principalScore:7.5, status:'Meeting'    },
  { id:'LO03', studentId:'S03', student:'Arjun Mehta',   roll:'03', mobile:'9823456703', topic:'Linear Equations', teacherScore:5.5, principalScore:5.0, status:'Approaching'},
  { id:'LO04', studentId:'S04', student:'Bhavya Singh',  roll:'04', mobile:'9823456704', topic:'Linear Equations', teacherScore:9.0, principalScore:8.5, status:'Exceeding'  },
  { id:'LO05', studentId:'S05', student:'Chetan Joshi',  roll:'05', mobile:'9823456705', topic:'Linear Equations', teacherScore:6.5, principalScore:6.0, status:'Meeting'    },
  { id:'LO06', studentId:'S06', student:'Deepa Nair',    roll:'06', mobile:'9823456706', topic:'Linear Equations', teacherScore:4.5, principalScore:4.0, status:'Approaching'},
  { id:'LO07', studentId:'S07', student:'Eshan Kumar',   roll:'07', mobile:'9823456707', topic:'Linear Equations', teacherScore:8.0, principalScore:7.5, status:'Exceeding'  },
  { id:'LO08', studentId:'S08', student:'Farida Bano',   roll:'08', mobile:'9823456708', topic:'Linear Equations', teacherScore:7.5, principalScore:7.0, status:'Meeting'    },
  { id:'LO09', studentId:'S09', student:'Gaurav Rao',    roll:'09', mobile:'9823456709', topic:'Linear Equations', teacherScore:5.0, principalScore:5.5, status:'Approaching'},
  { id:'LO10', studentId:'S10', student:'Harini Reddy',  roll:'10', mobile:'9823456710', topic:'Linear Equations', teacherScore:9.5, principalScore:9.0, status:'Exceeding'  },
  { id:'LO11', studentId:'S11', student:'Ishaan Verma',  roll:'11', mobile:'9823456711', topic:'Linear Equations', teacherScore:6.0, principalScore:6.5, status:'Meeting'    },
  { id:'LO12', studentId:'S12', student:'Jahnavi Tiwari',roll:'12', mobile:'9823456712', topic:'Linear Equations', teacherScore:7.0, principalScore:7.0, status:'Meeting'    },
]
export const LO_SUMMARY = { approaching:3, meeting:4, exceeding:5 }

// ── Leave ──────────────────────────────────────────────────────────────────
export const LEAVES = [
  { id:'L001', teacher:'Priya Sharma', type:'Sick',     from:'2024-01-10', to:'2024-01-11', reason:'High fever and doctor advised rest',  status:'Approved', applied:'2024-01-09'  },
  { id:'L002', teacher:'Priya Sharma', type:'Casual',   from:'2024-01-25', to:'2024-01-25', reason:'Personal work',                       status:'Pending',  applied:'2024-01-24' },
  { id:'L003', teacher:'Anjali Mehta', type:'Earned',   from:'2024-02-05', to:'2024-02-07', reason:'Family function',                     status:'Approved', applied:'2024-01-30' },
  { id:'L004', teacher:'Ramesh Patel', type:'Sick',     from:'2024-01-20', to:'2024-01-22', reason:'Viral infection',                     status:'Rejected', applied:'2024-01-19' },
  { id:'L005', teacher:'Sunita Joshi', type:'Half Day', from:'2024-02-02', to:'2024-02-02', reason:'Medical appointment',                 status:'Approved', applied:'2024-02-01'  },
  { id:'L006', teacher:'Vikram Singh', type:'Casual',   from:'2024-02-14', to:'2024-02-15', reason:'Personal reasons',                    status:'Pending',  applied:'2024-02-10' },
  { id:'L007', teacher:'Sunita Joshi', type:'Sick',     from:'2026-04-16', to:'2026-04-17', reason:'Suffering from viral fever',             status:'Approved', applied:'2026-04-15' },
  { id:'L008', teacher:'Ramesh Patel', type:'Casual',   from:'2026-04-16', to:'2026-04-16', reason:'Family emergency',                       status:'Approved', applied:'2026-04-16' },
  { id:'L009', teacher:'Anjali Mehta', type:'Earned',   from:'2026-04-15', to:'2026-04-18', reason:'Out of station',                         status:'Approved', applied:'2026-04-10' },
  { id:'L010', teacher:'Priya Sharma', type:'Forced Leave', from:'2026-04-14', to:'2026-04-14', reason:'Unauthorized absence – not present during scheduled class hours', status:'Approved', applied:'2026-04-14', isForced: true, deductionDays: 1 },
]

// ── Schedule ───────────────────────────────────────────────────────────────
// ── Schedule (Flat Backend-Ready Format) ──────────────────────────────────
export const WEEKLY_SCHEDULE = [
  { 
    day:'Monday',
    periods:[
      { id:'P101', periodNo:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', topic:'Linear Equations Review', status:'completed' },
      { id:'P102', periodNo:2, time:'8:45–9:30',   subject:'Mathematics', class:'Grade 9-B', topic:'Quadratic Formula', status:'completed' },
      { id:'P103', periodNo:3, time:'9:45–10:30',  subject:'Mathematics', class:'Grade 7-C', topic:'Basic Algebra', status:'completed' },
      { id:'P104', periodNo:4, time:'10:30–11:15', subject:'Free Period',  class:'–',         topic:'Planning', status:'completed' },
      { id:'P105', periodNo:5, time:'11:30–12:15', subject:'Mathematics', class:'Grade 8-A', topic:'Exercise 4.2', status:'completed' },
      { id:'P106', periodNo:6, time:'12:15–1:00',  subject:'Mathematics', class:'Grade 6-D', topic:'Fractions Intro', status:'completed' },
    ]
  },
  { 
    day:'Tuesday',
    periods:[
      { id:'P201', periodNo:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', topic:'Theorem 1.1', status:'completed' },
      { id:'P202', periodNo:2, time:'8:45–9:30',   subject:'Mathematics', class:'Grade 8-B', topic:'Mensuration', status:'completed' },
      { id:'P203', periodNo:3, time:'9:45–10:30',  subject:'Free Period',  class:'–',         topic:'Grading', status:'completed' },
      { id:'P204', periodNo:4, time:'10:30–11:15', subject:'Mathematics', class:'Grade 9-A', topic:'Square Roots', status:'completed' },
      { id:'P205', periodNo:5, time:'11:30–12:15', subject:'Mathematics', class:'Grade 7-A', topic:'Ratio & Proportion', status:'completed' },
      { id:'P206', periodNo:6, time:'12:15–1:00',  subject:'Mathematics', class:'Grade 6-C', topic:'Decimals', status:'completed' },
    ]
  },
  { 
    day:'Wednesday',
    periods:[
      { id:'P301', periodNo:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', topic:'Practical Geometry', status:'completed' },
      { id:'P302', periodNo:2, time:'8:45–9:30',   subject:'Mathematics', class:'Grade 9-B', topic:'Triangles', status:'completed' },
      { id:'P303', periodNo:3, time:'9:45–10:30',  subject:'Mathematics', class:'Grade 7-B', topic:'Integers', status:'completed' },
      { id:'P304', periodNo:4, time:'10:30–11:15', subject:'Mathematics', class:'Grade 8-C', topic:'Exponents', status:'pending' },
      { id:'P305', periodNo:5, time:'11:30–12:15', subject:'Free Period',  class:'–',         topic:'Admin Work', status:'pending' },
      { id:'P306', periodNo:6, time:'12:15–1:00',  subject:'Mathematics', class:'Grade 6-A', topic:'Counting', status:'pending' },
    ]
  },
  { 
    day:'Thursday',
    periods:[
      { id:'P401', periodNo:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', topic:'Topic B', status:'pending' },
      { id:'P402', periodNo:2, time:'8:45–9:30',   subject:'Mathematics', class:'Grade 9-A', topic:'Topic C', status:'pending' },
      { id:'P403', periodNo:3, time:'9:45–10:30',  subject:'Mathematics', class:'Grade 7-C', topic:'Topic D', status:'pending' },
      { id:'P404', periodNo:4, time:'10:30–11:15', subject:'Mathematics', class:'Grade 8-B', topic:'Topic E', status:'pending' },
      { id:'P405', periodNo:5, time:'11:30–12:15', subject:'Mathematics', class:'Grade 6-B', topic:'Topic F', status:'pending' },
      { id:'P406', periodNo:6, time:'12:15–1:00',  subject:'Free Period',  class:'–',         topic:'Rest', status:'pending' },
    ]
  },
  { 
    day:'Friday',
    periods:[
      { id:'P501', periodNo:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', topic:'Topic G', status:'pending' },
      { id:'P502', periodNo:2, time:'8:45–9:30',   subject:'Mathematics', class:'Grade 8-C', topic:'Topic H', status:'pending' },
      { id:'P503', periodNo:3, time:'9:45–10:30',  subject:'Mathematics', class:'Grade 9-B', topic:'Topic I', status:'pending' },
      { id:'P504', periodNo:4, time:'10:30–11:15', subject:'Free Period',  class:'–',         topic:'Notes Prep', status:'pending' },
      { id:'P505', periodNo:5, time:'11:30–12:15', subject:'Mathematics', class:'Grade 7-A', topic:'Topic J', status:'pending' },
      { id:'P506', periodNo:6, time:'12:15–1:00',  subject:'Mathematics', class:'Grade 6-D', topic:'Topic K', status:'pending' },
    ]
  },
  { 
    day:'Saturday',
    periods:[
      { id:'P601', periodNo:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', topic:'Revision', status:'pending' },
      { id:'P602', periodNo:2, time:'8:45–9:30',   subject:'Lab Session',  class:'Grade 8-A', topic:'Practical', status:'pending' },
      { id:'P603', periodNo:3, time:'9:45–10:30',  subject:'Extra Class',  class:'Grade 10-A',topic:'Special Lect', status:'pending' },
    ]
  },
]

// ── Observations ───────────────────────────────────────────────────────────
export const OBSERVATIONS = [
  { id:'O001', teacher:'Priya Sharma', date:'2024-01-05',  score:42, max:50, observedBy:'Dr. Rajesh Kumar',
    criteria:[{name:'Content Mastery',score:9},{name:'Pedagogy',score:8},{name:'Student Engagement',score:8},{name:'Communication',score:9},{name:'Assessment',score:8}] },
  { id:'O002', teacher:'Priya Sharma', date:'2023-12-10', score:38, max:50, observedBy:'Dr. Rajesh Kumar',
    criteria:[{name:'Content Mastery',score:8},{name:'Pedagogy',score:7},{name:'Student Engagement',score:8},{name:'Communication',score:8},{name:'Assessment',score:7}] },
  { id:'O003', teacher:'Anjali Mehta', date:'2024-01-08',  score:45, max:50, observedBy:'Dr. Rajesh Kumar',
    criteria:[{name:'Content Mastery',score:9},{name:'Pedagogy',score:9},{name:'Student Engagement',score:9},{name:'Communication',score:9},{name:'Assessment',score:9}] },
  { id:'O004', teacher:'Ramesh Patel', date:'2024-01-12', score:35, max:50, observedBy:'Dr. Rajesh Kumar',
    criteria:[{name:'Content Mastery',score:7},{name:'Pedagogy',score:7},{name:'Student Engagement',score:7},{name:'Communication',score:7},{name:'Assessment',score:7}] },
  { id:'O005', teacher:'Sunita Joshi', date:'2024-01-15', score:40, max:50, observedBy:'Dr. Rajesh Kumar',
    criteria:[{name:'Content Mastery',score:8},{name:'Pedagogy',score:8},{name:'Student Engagement',score:8},{name:'Communication',score:8},{name:'Assessment',score:8}] },
]

// ── Teacher Performance ────────────────────────────────────────────────────
export const TEACHER_PERFORMANCE = [
  { teacher:ALL_TEACHERS[0], syllabus:88, lo:85, observation:84, other:90, language:82 },
  { teacher:ALL_TEACHERS[1], syllabus:92, lo:90, observation:90, other:88, language:94 },
  { teacher:ALL_TEACHERS[2], syllabus:75, lo:78, observation:70, other:72, language:80 },
  { teacher:ALL_TEACHERS[3], syllabus:80, lo:82, observation:76, other:85, language:78 },
  { teacher:ALL_TEACHERS[4], syllabus:70, lo:72, observation:68, other:75, language:70 },
].map(p => ({
  ...p,
  overall: p.syllabus*0.15 + p.lo*0.20 + p.observation*0.30 + p.other*0.20 + p.language*0.15,
}))

// ── Chart Data ─────────────────────────────────────────────────────────────
export const ATTENDANCE_CHART = [
  {month:'Apr',pct:95},{month:'May',pct:92},{month:'Jun',pct:88},{month:'Jul',pct:90},
  {month:'Aug',pct:93},{month:'Sep',pct:91},{month:'Oct',pct:94},{month:'Nov',pct:89},
  {month:'Dec',pct:87},{month:'Jan',pct:92},
]
export const MARKS_CHART = [
  {exam:'Unit 1',pct:78},{exam:'Unit 2',pct:82},{exam:'Unit 3',pct:75},
  {exam:'Mid-Term',pct:80},{exam:'Unit 4',pct:85},{exam:'Unit 5',pct:83},{exam:'Final',pct:81},
]
export const LO_CHART = [
  {chapter:'Ch.1',pct:72},{chapter:'Ch.2',pct:78},{chapter:'Ch.3',pct:85},
  {chapter:'Ch.4',pct:80},{chapter:'Ch.5',pct:88},
]
export const OBS_CHART = [
  {name:'Priya S.',score:84},{name:'Anjali M.',score:90},{name:'Ramesh P.',score:70},
  {name:'Sunita J.',score:80},{name:'Vikram S.',score:68},
]

// ── School Stats ───────────────────────────────────────────────────────────
export const SCHOOL_STATS = {
  totalTeachers: 25, totalStudents: 620, totalClasses: 18,
  syllabusCompletion: 68, avgAttendance: 91, avgPerformance: 82,
}

export const MARKS_OVERVIEW = [
  { class:'Grade 6-A', subject:'Mathematics',   exam:'Unit 1',    avg:'75%', pct:75 },
  { class:'Grade 7-B', subject:'Science',       exam:'Mid-Term',  avg:'80%', pct:80 },
  { class:'Grade 8-A', subject:'Mathematics',   exam:'Unit 2',    avg:'78%', pct:78 },
  { class:'Grade 9-A', subject:'English',       exam:'Unit 1',    avg:'82%', pct:82 },
  { class:'Grade 10-A',subject:'Social Studies',exam:'Mid-Term',  avg:'71%', pct:71 },
]

// ── Weekly Syllabus Tracking ───────────────────────────────────────────────
export const WEEKLY_SYLLABUS = [
  { week:'1–7',   teacher:'Priya Sharma', subject:'Mathematics',   class:'Grade 8-A',  completed:5,  total:6,  pct:83 },
  { week:'1–7',   teacher:'Priya Sharma', subject:'Mathematics',   class:'Grade 9-B',  completed:4,  total:6,  pct:67 },
  { week:'1–7',   teacher:'Anjali Mehta', subject:'Science',       class:'Grade 7-B',  completed:6,  total:6,  pct:100},
  { week:'1–7',   teacher:'Anjali Mehta', subject:'Science',       class:'Grade 8-B',  completed:4,  total:6,  pct:67 },
  { week:'1–7',   teacher:'Ramesh Patel', subject:'English',       class:'Grade 9-A',  completed:3,  total:6,  pct:50 },
  { week:'1–7',   teacher:'Sunita Joshi', subject:'Hindi',         class:'Grade 6-C',  completed:5,  total:6,  pct:83 },
  { week:'1–7',   teacher:'Vikram Singh', subject:'Social Studies',class:'Grade 10-A', completed:2,  total:6,  pct:33 },
]

export const WEEK_RANGES = ['1–7', '8–14', '15–21', '22–28', '29–35']

// ── Birthdays ─────────────────────────────────────────────────────────────
export const BIRTHDAYS = [
  { id:'BD01', name:'Aarav Sharma',   type:'student', class:'Grade 8-A', role:'Student', month:4,  day:11 },
  { id:'BD02', name:'Ananya Patel',   type:'student', class:'Grade 8-A', role:'Student', month:4,  day:11 },
  { id:'BD03', name:'Arjun Mehta',    type:'student', class:'Grade 8-A', role:'Student', month:4,  day:15 },
  { id:'BD04', name:'Bhavya Singh',   type:'student', class:'Grade 8-A', role:'Student', month:4,  day:20 },
  { id:'BD05', name:'Deepa Nair',     type:'student', class:'Grade 7-B', role:'Student', month:4,  day:15 },
  { id:'BD06', name:'Anjali Mehta',   type:'teacher', class:'Grade 7-B', role:'Science',   month:4,  day:15 },
  { id:'BD07', name:'Eshan Kumar',    type:'student', class:'Grade 9-A', role:'Student', month:4,  day:17 },
  { id:'BD08', name:'Rahul Verma',    type:'student', class:'Grade 8-A', role:'Student', month:4,  day:16 },
  { id:'BD09', name:'Vikram Singh',   type:'teacher', class:'Grade 10-A', role:'Social Studies', month:4, day:16 },
  { id:'BD13', name:'Priya Sharma',   type:'teacher', class:'Grade 8-A', role:'Mathematics',   month:4,  day:11 },
]

export const WEEKLY_HOMEWORK = [
  { id: 'WH01', month: 'April', week: '1', subject: 'Mathematics', class: 'Grade 8-A', teacher: 'Priya Sharma', description: 'April Week 1 Homework', assigned: '2026-04-01', due: '2026-04-07', total: 42, submitted: 30, defaulters: ['Aryan Gupta', 'Priya Patel', 'Rahul Singh', 'Sneha Jain', 'Dev Patel'] },
  { id: 'WH02', month: 'April', week: '1', subject: 'Science', class: 'Grade 7-B', teacher: 'Anjali Mehta', description: 'April Week 1 Homework', assigned: '2026-04-01', due: '2026-04-07', total: 40, submitted: 38, defaulters: ['Deepa Nair'] },
  { id: 'WH03', month: 'April', week: '2', subject: 'Mathematics', class: 'Grade 8-A', teacher: 'Priya Sharma', description: 'April Week 2 Homework', assigned: '2026-04-08', due: '2026-04-14', total: 42, submitted: 35, defaulters: ['Sneha Jain', 'Priya Patel', 'Dev Patel'] },
  { id: 'WH04', month: 'March', week: '4', subject: 'English', class: 'Grade 9-A', teacher: 'Ramesh Patel', description: 'March Week 4 Homework', assigned: '2026-03-22', due: '2026-03-28', total: 45, submitted: 40, defaulters: ['Eshan Kumar'] },
  { id: 'WH05', month: 'April', week: '1', subject: 'Hindi', class: 'Grade 6-C', teacher: 'Sunita Joshi', description: 'April Week 1 Homework', assigned: '2026-04-01', due: '2026-04-07', total: 38, submitted: 38, defaulters: [] },
  { id: 'WH06', month: 'April', week: '1', subject: 'Social Studies', class: 'Grade 10-A', teacher: 'Vikram Singh', description: 'April Week 1 Homework', assigned: '2026-04-01', due: '2026-04-07', total: 50, submitted: 42, defaulters: ['Arjun Mehta', 'Bhavya Singh', 'Chetan Joshi'] }
]

export const WEEKLY_NOTEBOOK = [
  { id: 'NB01', month: 'April', week: '1', subject: 'Mathematics', class: 'Grade 8-A', teacher: 'Priya Sharma', description: 'April Week 1 Notebook', assigned: '2026-04-01', due: '2026-04-07', total: 42, submitted: 32, defaulters: ['Aarav Sharma', 'Arjun Mehta', 'Aarya Verma', 'Rohit Kumar'] },
  { id: 'NB02', month: 'April', week: '1', subject: 'Science', class: 'Grade 7-B', teacher: 'Anjali Mehta', description: 'April Week 1 Notebook', assigned: '2026-04-01', due: '2026-04-07', total: 40, submitted: 35, defaulters: ['Deepa Nair', 'Eshan Kumar', 'Farida Bano'] },
  { id: 'NB03', month: 'April', week: '2', subject: 'Mathematics', class: 'Grade 8-A', teacher: 'Priya Sharma', description: 'April Week 2 Notebook', assigned: '2026-04-08', due: '2026-04-14', total: 42, submitted: 38, defaulters: ['Aarav Sharma', 'Rahul Singh'] },
  { id: 'NB04', month: 'March', week: '4', subject: 'English', class: 'Grade 9-A', teacher: 'Ramesh Patel', description: 'March Week 4 Notebook', assigned: '2026-03-22', due: '2026-03-28', total: 45, submitted: 41, defaulters: ['Ishaan Verma'] },
]

// ── HW / Notebook / Exam Tracking ────────────────────────────────────────
export const HW_TRACKING = [
  { id:'TK01', class:'Grade 8-A', subject:'Mathematics',   type:'Homework',  description:'Ex 3.1 Q1-Q10',            assigned:'2024-01-15', due:'2024-01-17', total:42, submitted:38, pct:90, status:'Completed' },
  { id:'TK02', class:'Grade 8-A', subject:'Mathematics',   type:'Homework',  description:'Chapter 4 Practice',       assigned:'2024-01-17', due:'2024-01-19', total:42, submitted:40, pct:95, status:'Completed' },
  { id:'TK03', class:'Grade 8-A', subject:'Mathematics',   type:'Homework',  description:'Triangle Worksheet',       assigned:'2024-01-22', due:'2024-01-24', total:42, submitted:35, pct:83, status:'Pending'   },
  { id:'TK04', class:'Grade 8-A', subject:'Mathematics',   type:'Notebook',  description:'Chapter 1-3 Notes',        assigned:'2024-01-10', due:'2024-01-20', total:42, submitted:42, pct:100,status:'Completed' },
  { id:'TK05', class:'Grade 8-A', subject:'Mathematics',   type:'Notebook',  description:'Chapter 4-5 Notes',        assigned:'2024-01-25', due:'2024-02-05', total:42, submitted:30, pct:71, status:'Pending'   },
  { id:'TK06', class:'Grade 8-A', subject:'Mathematics',   type:'Exam',      description:'Unit Test 1',              assigned:'2024-01-12', due:'2024-01-12', total:42, submitted:42, pct:100,status:'Completed' },
]

// ── Teacher Permissions ────────────────────────────────────────────────────
export const PERMISSIONS = [
  { id:'PM01', action:'Marks Entry',    class:'Grade 8-A', subject:'Mathematics',   from:'2024-01-01', to:'2024-03-31', daysLeft:52 },
  { id:'PM02', action:'Upload Syllabus',class:'Grade 8-A', subject:'Mathematics',   from:'2024-01-01', to:'2024-03-31', daysLeft:52 },
  { id:'PM03', action:'Marks Entry',    class:'Grade 9-B', subject:'Mathematics',   from:'2024-01-01', to:'2024-01-31', daysLeft:-5 },
  { id:'PM04', action:'Homework Entry', class:'Grade 8-A', subject:'Mathematics',   from:'2024-01-01', to:'2024-02-28', daysLeft:23 },
  { id:'PM05', action:'LO Entry',       class:'Grade 8-A', subject:'Mathematics',   from:'2024-01-01', to:'2024-04-15', daysLeft:3  },
]

// ── Marks Entry ────────────────────────────────────────────────────────────
export const MARKS_ENTRY = [
  { id:'MK01', student:'Aarav Sharma',   roll:'01', class:'Grade 8-A', subject:'Mathematics', type:'Homework', max:10, obtained:8,  date:'2024-01-17' },
  { id:'MK02', student:'Ananya Patel',   roll:'02', class:'Grade 8-A', subject:'Mathematics', type:'Homework', max:10, obtained:9,  date:'2024-01-17' },
  { id:'MK17', student:'Aarav Sharma',   roll:'01', class:'Grade 8-A', subject:'Mathematics', type:'Exam', max:50, obtained:42, date:'2024-01-12' },
]

// ── Teacher Profile ────────────────────────────────────────────────────────
export const TEACHER_PROFILE = {
  id: 'T001',
  name: 'Priya Sharma',
  mobile: '+91 98765 43210',
  email: 'priya.sharma@school.edu',
  department: 'Mathematics',
  qualification: 'M.Sc. Mathematics, B.Ed.',
  experience: '8 years',
  joinDate: '2016-06-15',
  classes: ['Grade 8-A', 'Grade 9-B'],
  subjects: ['Mathematics'],
  employeeCode: 'EMP-T001',
}
