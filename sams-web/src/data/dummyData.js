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
  { id:'S01', name:'Aarav Sharma',  rollNo:'01', class:'Grade 8-A', email:'aarav@school.edu'  },
  { id:'S02', name:'Ananya Patel',  rollNo:'02', class:'Grade 8-A', email:'ananya@school.edu' },
  { id:'S03', name:'Arjun Mehta',   rollNo:'03', class:'Grade 8-A', email:'arjun@school.edu'  },
  { id:'S04', name:'Bhavya Singh',  rollNo:'04', class:'Grade 8-A', email:'bhavya@school.edu' },
  { id:'S05', name:'Chetan Joshi',  rollNo:'05', class:'Grade 8-A', email:'chetan@school.edu' },
  { id:'S06', name:'Deepa Nair',    rollNo:'06', class:'Grade 8-A', email:'deepa@school.edu'  },
  { id:'S07', name:'Eshan Kumar',   rollNo:'07', class:'Grade 8-A', email:'eshan@school.edu'  },
  { id:'S08', name:'Farida Bano',   rollNo:'08', class:'Grade 8-A', email:'farida@school.edu' },
  { id:'S09', name:'Gaurav Rao',    rollNo:'09', class:'Grade 8-A', email:'gaurav@school.edu' },
  { id:'S10', name:'Harini Reddy',  rollNo:'10', class:'Grade 8-A', email:'harini@school.edu' },
  { id:'S11', name:'Ishaan Verma',  rollNo:'11', class:'Grade 8-A', email:'ishaan@school.edu' },
  { id:'S12', name:'Jahnavi Tiwari',rollNo:'12', class:'Grade 8-A', email:'jahnavi@school.edu'},
]

// ── Syllabus ───────────────────────────────────────────────────────────────
export const SYLLABUS_ITEMS = [
  { id:'S001', topic:'Rational Numbers',        chapter:'Chapter 1',  subject:'Mathematics', class:'Grade 8-A', completed:true,  completedDate:'Jan 8',  plannedDate:'Jan 7'  },
  { id:'S002', topic:'Powers and Exponents',    chapter:'Chapter 2',  subject:'Mathematics', class:'Grade 8-A', completed:true,  completedDate:'Jan 12', plannedDate:'Jan 11' },
  { id:'S003', topic:'Linear Equations',        chapter:'Chapter 3',  subject:'Mathematics', class:'Grade 8-A', completed:true,  completedDate:'Jan 15', plannedDate:'Jan 14' },
  { id:'S004', topic:'Quadratic Equations',     chapter:'Chapter 4',  subject:'Mathematics', class:'Grade 8-A', completed:true,  completedDate:'Jan 22', plannedDate:'Jan 21' },
  { id:'S005', topic:'Triangles & Properties',  chapter:'Chapter 5',  subject:'Mathematics', class:'Grade 8-A', completed:true,  completedDate:'Jan 29', plannedDate:'Jan 28' },
  { id:'S006', topic:'Mensuration',             chapter:'Chapter 6',  subject:'Mathematics', class:'Grade 8-A', completed:false, completedDate:'',       plannedDate:'Feb 5'  },
  { id:'S007', topic:'Data Handling',           chapter:'Chapter 7',  subject:'Mathematics', class:'Grade 8-A', completed:false, completedDate:'',       plannedDate:'Feb 12' },
  { id:'S008', topic:'Introduction to Graphs',  chapter:'Chapter 8',  subject:'Mathematics', class:'Grade 8-A', completed:false, completedDate:'',       plannedDate:'Feb 19' },
  { id:'S009', topic:'Playing with Numbers',    chapter:'Chapter 9',  subject:'Mathematics', class:'Grade 8-A', completed:false, completedDate:'',       plannedDate:'Feb 26' },
  { id:'S010', topic:'Factorisation',           chapter:'Chapter 10', subject:'Mathematics', class:'Grade 8-A', completed:false, completedDate:'',       plannedDate:'Mar 4'  },
]

export const SYLLABUS_STATS = { total:10, completed:5, pending:5 }

// School-wide syllabus (for principal)
export const SCHOOL_SYLLABUS = [
  { teacher:'Priya Sharma',  subject:'Mathematics',   class:'Grade 8-A',  done:'5/10', pct:50  },
  { teacher:'Anjali Mehta',  subject:'Science',       class:'Grade 7-B',  done:'7/10', pct:70  },
  { teacher:'Ramesh Patel',  subject:'English',       class:'Grade 9-A',  done:'6/10', pct:60  },
  { teacher:'Sunita Joshi',  subject:'Hindi',         class:'Grade 6-C',  done:'8/10', pct:80  },
  { teacher:'Vikram Singh',  subject:'Social Studies',class:'Grade 10-A', done:'4/10', pct:40  },
  { teacher:'Priya Sharma',  subject:'Mathematics',   class:'Grade 9-B',  done:'6.5/10',pct:65 },
  { teacher:'Anjali Mehta',  subject:'Science',       class:'Grade 8-B',  done:'5.5/10',pct:55 },
]

// ── Homework ───────────────────────────────────────────────────────────────
export const HOMEWORK = [
  { id:'H001', subject:'Mathematics', class:'Grade 8-A', description:'Exercise 3.1 – Q1 to Q10',  assigned:'Mon, Jan 15', due:'Wed, Jan 17', total:42, submitted:38, defaulters:['Aryan Gupta','Priya Patel','Rahul Singh','Sneha Jain'] },
  { id:'H002', subject:'Mathematics', class:'Grade 8-A', description:'Chapter 4 Practice Problems', assigned:'Wed, Jan 17', due:'Fri, Jan 19', total:42, submitted:40, defaulters:['Aryan Gupta','Kavya Sharma'] },
  { id:'H003', subject:'Mathematics', class:'Grade 8-A', description:'Triangle Worksheet',          assigned:'Mon, Jan 22', due:'Wed, Jan 24', total:42, submitted:35, defaulters:['Aryan Gupta','Priya Patel','Rohit Kumar','Ananya Joshi','Dev Patel','Meera Singh','Sahil Verma'] },
  { id:'H004', subject:'Mathematics', class:'Grade 8-A', description:'Revision Test Paper',         assigned:'Fri, Jan 26', due:'Mon, Jan 29', total:42, submitted:42, defaulters:[] },
  { id:'H005', subject:'Mathematics', class:'Grade 8-A', description:'Chapter 2 Ex 2.3',            assigned:'Mon, Jan 8',  due:'Thu, Jan 11', total:42, submitted:30, defaulters:['Aryan Gupta','Priya Patel','Rahul Singh','Sneha Jain','Dev Patel','Meera Singh','Sahil Verma','Tanvi Rao','Kiran Bhat','Nikhil Menon','Pooja Nair','Aditya Kumar'] },
]

// ── Learning Outcomes ──────────────────────────────────────────────────────
export const LO_ENTRIES = [
  { student:'Aarav Sharma',  roll:'01', topic:'Linear Equations', teacherScore:8.5, principalScore:8.0, status:'Exceeding'  },
  { student:'Ananya Patel',  roll:'02', topic:'Linear Equations', teacherScore:7.0, principalScore:7.5, status:'Meeting'    },
  { student:'Arjun Mehta',   roll:'03', topic:'Linear Equations', teacherScore:5.5, principalScore:5.0, status:'Approaching'},
  { student:'Bhavya Singh',  roll:'04', topic:'Linear Equations', teacherScore:9.0, principalScore:8.5, status:'Exceeding'  },
  { student:'Chetan Joshi',  roll:'05', topic:'Linear Equations', teacherScore:6.5, principalScore:6.0, status:'Meeting'    },
  { student:'Deepa Nair',    roll:'06', topic:'Linear Equations', teacherScore:4.5, principalScore:4.0, status:'Approaching'},
  { student:'Eshan Kumar',   roll:'07', topic:'Linear Equations', teacherScore:8.0, principalScore:7.5, status:'Exceeding'  },
  { student:'Farida Bano',   roll:'08', topic:'Linear Equations', teacherScore:7.5, principalScore:7.0, status:'Meeting'    },
  { student:'Gaurav Rao',    roll:'09', topic:'Linear Equations', teacherScore:5.0, principalScore:5.5, status:'Approaching'},
  { student:'Harini Reddy',  roll:'10', topic:'Linear Equations', teacherScore:9.5, principalScore:9.0, status:'Exceeding'  },
  { student:'Ishaan Verma',  roll:'11', topic:'Linear Equations', teacherScore:6.0, principalScore:6.5, status:'Meeting'    },
  { student:'Jahnavi Tiwari',roll:'12', topic:'Linear Equations', teacherScore:7.0, principalScore:7.0, status:'Meeting'    },
]
export const LO_SUMMARY = { approaching:3, meeting:4, exceeding:5 }

// ── Leave ──────────────────────────────────────────────────────────────────
export const LEAVES = [
  { id:'L001', teacher:'Priya Sharma', type:'Sick',     from:'Jan 10', to:'Jan 11', reason:'High fever and doctor advised rest',  status:'Approved', applied:'Jan 9'  },
  { id:'L002', teacher:'Priya Sharma', type:'Casual',   from:'Jan 25', to:'Jan 25', reason:'Personal work',                       status:'Pending',  applied:'Jan 24' },
  { id:'L003', teacher:'Anjali Mehta', type:'Earned',   from:'Feb 5',  to:'Feb 7',  reason:'Family function',                     status:'Approved', applied:'Jan 30' },
  { id:'L004', teacher:'Ramesh Patel', type:'Sick',     from:'Jan 20', to:'Jan 22', reason:'Viral infection',                     status:'Rejected', applied:'Jan 19' },
  { id:'L005', teacher:'Sunita Joshi', type:'Half Day', from:'Feb 2',  to:'Feb 2',  reason:'Medical appointment',                 status:'Approved', applied:'Feb 1'  },
  { id:'L006', teacher:'Vikram Singh', type:'Casual',   from:'Feb 14', to:'Feb 15', reason:'Personal reasons',                   status:'Pending',  applied:'Feb 10' },
]

// ── Schedule ───────────────────────────────────────────────────────────────
export const WEEKLY_SCHEDULE = [
  { day:'Monday',    periods:[
    { no:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', status:'Completed' },
    { no:2, time:'8:45–9:30',   subject:'Mathematics', class:'Grade 9-B', status:'Completed' },
    { no:3, time:'9:45–10:30',  subject:'Mathematics', class:'Grade 7-C', status:'Completed' },
    { no:4, time:'10:30–11:15', subject:'Free Period',  class:'–',         status:'Completed' },
    { no:5, time:'11:30–12:15', subject:'Mathematics', class:'Grade 8-A', status:'Completed' },
    { no:6, time:'12:15–1:00',  subject:'Mathematics', class:'Grade 6-D', status:'Completed' },
  ]},
  { day:'Tuesday',   periods:[
    { no:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', status:'Completed' },
    { no:2, time:'8:45–9:30',   subject:'Mathematics', class:'Grade 8-B', status:'Completed' },
    { no:3, time:'9:45–10:30',  subject:'Free Period',  class:'–',         status:'Completed' },
    { no:4, time:'10:30–11:15', subject:'Mathematics', class:'Grade 9-A', status:'Completed' },
    { no:5, time:'11:30–12:15', subject:'Mathematics', class:'Grade 7-A', status:'Completed' },
    { no:6, time:'12:15–1:00',  subject:'Mathematics', class:'Grade 6-C', status:'Completed' },
  ]},
  { day:'Wednesday', periods:[
    { no:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', status:'Completed' },
    { no:2, time:'8:45–9:30',   subject:'Mathematics', class:'Grade 9-B', status:'Completed' },
    { no:3, time:'9:45–10:30',  subject:'Mathematics', class:'Grade 7-B', status:'Completed' },
    { no:4, time:'10:30–11:15', subject:'Mathematics', class:'Grade 8-C', status:'Pending'   },
    { no:5, time:'11:30–12:15', subject:'Free Period',  class:'–',         status:'Pending'   },
    { no:6, time:'12:15–1:00',  subject:'Mathematics', class:'Grade 6-A', status:'Pending'   },
  ]},
  { day:'Thursday',  periods:[
    { no:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', status:'Pending' },
    { no:2, time:'8:45–9:30',   subject:'Mathematics', class:'Grade 9-A', status:'Pending' },
    { no:3, time:'9:45–10:30',  subject:'Mathematics', class:'Grade 7-C', status:'Pending' },
    { no:4, time:'10:30–11:15', subject:'Mathematics', class:'Grade 8-B', status:'Pending' },
    { no:5, time:'11:30–12:15', subject:'Mathematics', class:'Grade 6-B', status:'Pending' },
    { no:6, time:'12:15–1:00',  subject:'Free Period',  class:'–',         status:'Pending' },
  ]},
  { day:'Friday',    periods:[
    { no:1, time:'8:00–8:45',   subject:'Mathematics', class:'Grade 8-A', status:'Pending' },
    { no:2, time:'8:45–9:30',   subject:'Mathematics', class:'Grade 8-C', status:'Pending' },
    { no:3, time:'9:45–10:30',  subject:'Mathematics', class:'Grade 9-B', status:'Pending' },
    { no:4, time:'10:30–11:15', subject:'Free Period',  class:'–',         status:'Pending' },
    { no:5, time:'11:30–12:15', subject:'Mathematics', class:'Grade 7-A', status:'Pending' },
    { no:6, time:'12:15–1:00',  subject:'Mathematics', class:'Grade 6-D', status:'Pending' },
  ]},
]

// ── Observations ───────────────────────────────────────────────────────────
export const OBSERVATIONS = [
  { id:'O001', teacher:'Priya Sharma', date:'Jan 5, 2024',  score:42, max:50, observedBy:'Dr. Rajesh Kumar',
    criteria:[{name:'Content Mastery',score:9},{name:'Pedagogy',score:8},{name:'Student Engagement',score:8},{name:'Communication',score:9},{name:'Assessment',score:8}] },
  { id:'O002', teacher:'Priya Sharma', date:'Dec 10, 2023', score:38, max:50, observedBy:'Dr. Rajesh Kumar',
    criteria:[{name:'Content Mastery',score:8},{name:'Pedagogy',score:7},{name:'Student Engagement',score:8},{name:'Communication',score:8},{name:'Assessment',score:7}] },
  { id:'O003', teacher:'Anjali Mehta', date:'Jan 8, 2024',  score:45, max:50, observedBy:'Dr. Rajesh Kumar',
    criteria:[{name:'Content Mastery',score:9},{name:'Pedagogy',score:9},{name:'Student Engagement',score:9},{name:'Communication',score:9},{name:'Assessment',score:9}] },
  { id:'O004', teacher:'Ramesh Patel', date:'Jan 12, 2024', score:35, max:50, observedBy:'Dr. Rajesh Kumar',
    criteria:[{name:'Content Mastery',score:7},{name:'Pedagogy',score:7},{name:'Student Engagement',score:7},{name:'Communication',score:7},{name:'Assessment',score:7}] },
  { id:'O005', teacher:'Sunita Joshi', date:'Jan 15, 2024', score:40, max:50, observedBy:'Dr. Rajesh Kumar',
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
