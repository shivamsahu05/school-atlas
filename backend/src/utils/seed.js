// src/utils/seed.js
// Run: node src/utils/seed.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })

const bcrypt = require('bcryptjs')
const prisma = require('../config/db')

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')

async function seed() {
  console.log('🌱 Seeding SAMS database…\n')

  // ── 1. Users ────────────────────────────────────────────────────────────────
  console.log('  👤 Creating users…')
  const adminHash   = await bcrypt.hash('Admin@123',   ROUNDS)
  const teacherHash = await bcrypt.hash('Teacher@123', ROUNDS)

  const admin = await prisma.users.upsert({
    where:  { email: 'admin@sams.com' },
    update: { password: adminHash },
    create: { name: 'Dr. Rajesh Kumar', email: 'admin@sams.com', password: adminHash, role: 'admin', phone: '9876543210' },
  })

  const teachers = await Promise.all([
    prisma.users.upsert({
      where:  { email: 'priya@sams.com' },
      update: { password: teacherHash },
      create: { name: 'Priya Sharma',  email: 'priya@sams.com',  password: teacherHash, role: 'teacher', phone: '9876543211' },
    }),
    prisma.users.upsert({
      where:  { email: 'anjali@sams.com' },
      update: { password: teacherHash },
      create: { name: 'Anjali Mehta',  email: 'anjali@sams.com', password: teacherHash, role: 'teacher', phone: '9876543212' },
    }),
    prisma.users.upsert({
      where:  { email: 'ramesh@sams.com' },
      update: { password: teacherHash },
      create: { name: 'Ramesh Patel',  email: 'ramesh@sams.com', password: teacherHash, role: 'teacher', phone: '9876543213' },
    }),
    prisma.users.upsert({
      where:  { email: 'sunita@sams.com' },
      update: { password: teacherHash },
      create: { name: 'Sunita Joshi',  email: 'sunita@sams.com', password: teacherHash, role: 'teacher', phone: '9876543214' },
    }),
    // Keep existing teacher login working
    prisma.users.upsert({
      where:  { email: 'teacher@sams.com' },
      update: { password: teacherHash },
      create: { name: 'Priya Sharma',  email: 'teacher@sams.com', password: teacherHash, role: 'teacher', phone: '9876543215' },
    }),
  ])

  console.log(`     ✓ ${teachers.length + 1} users created`)

  // ── 2. Classes ──────────────────────────────────────────────────────────────
  console.log('  🏫 Creating classes…')
  const classData = [
    ['Grade 6','A'],['Grade 6','B'],
    ['Grade 7','A'],['Grade 7','B'],
    ['Grade 8','A'],['Grade 8','B'],
    ['Grade 9','A'],['Grade 9','B'],
    ['Grade 10','A'],
  ]
  const classes = await Promise.all(classData.map(([class_name, section]) =>
    prisma.classes.upsert({
      where:  { class_name_section: { class_name, section } },
      update: {},
      create: { class_name, section },
    })
  ))
  console.log(`     ✓ ${classes.length} classes created`)

  // ── 3. Subjects ─────────────────────────────────────────────────────────────
  console.log('  📚 Creating subjects…')
  const subjectNames = ['Mathematics','Science','English','Hindi','Social Studies']
  const subjects = await Promise.all(subjectNames.map(name =>
    prisma.subjects.upsert({ where: { name }, update: {}, create: { name } })
  ))
  console.log(`     ✓ ${subjects.length} subjects created`)

  const cls8a = classes.find(c => c.class_name === 'Grade 8' && c.section === 'A')
  const cls7b  = classes.find(c => c.class_name === 'Grade 7' && c.section === 'B')
  const maths  = subjects.find(s => s.name === 'Mathematics')
  const sci    = subjects.find(s => s.name === 'Science')
  const eng    = subjects.find(s => s.name === 'English')
  const hindi  = subjects.find(s => s.name === 'Hindi')

  // ── 4. Teacher-Subject assignments ──────────────────────────────────────────
  console.log('  🔗 Assigning teachers to subjects/classes…')
  const tAssign = [
    { teacher_id: teachers[0].id, subject_id: maths.id, class_id: cls8a.id },
    { teacher_id: teachers[1].id, subject_id: sci.id,   class_id: cls7b.id  },
    { teacher_id: teachers[2].id, subject_id: eng.id,   class_id: cls8a.id  },
    { teacher_id: teachers[3].id, subject_id: hindi.id, class_id: cls8a.id  },
    { teacher_id: teachers[4].id, subject_id: maths.id, class_id: cls8a.id  }, // teacher@sams.com
  ]
  await Promise.all(tAssign.map(data =>
    prisma.teacher_subjects.upsert({
      where:  { teacher_id_subject_id_class_id: data },
      update: {},
      create: data,
    })
  ))
  console.log('     ✓ Teacher assignments done')

  // ── 5. Students ─────────────────────────────────────────────────────────────
  console.log('  🎓 Creating students…')
  const studentData = [
    { name:'Aarav Sharma',   roll_no:'01', class_id: cls8a.id, gender: 'Male'   },
    { name:'Ananya Patel',   roll_no:'02', class_id: cls8a.id, gender: 'Female' },
    { name:'Arjun Mehta',    roll_no:'03', class_id: cls8a.id, gender: 'Male'   },
    { name:'Bhavya Singh',   roll_no:'04', class_id: cls8a.id, gender: 'Female' },
    { name:'Chetan Joshi',   roll_no:'05', class_id: cls8a.id, gender: 'Male'   },
    { name:'Deepa Nair',     roll_no:'06', class_id: cls8a.id, gender: 'Female' },
    { name:'Eshan Kumar',    roll_no:'07', class_id: cls8a.id, gender: 'Male'   },
    { name:'Farida Bano',    roll_no:'08', class_id: cls8a.id, gender: 'Female' },
    { name:'Gaurav Rao',     roll_no:'09', class_id: cls8a.id, gender: 'Male'   },
    { name:'Harini Reddy',   roll_no:'10', class_id: cls8a.id, gender: 'Female' },
    { name:'Ishaan Verma',   roll_no:'11', class_id: cls8a.id, gender: 'Male'   },
    { name:'Jahnavi Tiwari', roll_no:'12', class_id: cls8a.id, gender: 'Female' },
  ]
  const students = await Promise.all(studentData.map(s =>
    prisma.students.upsert({
      where:  { roll_no_class_id: { roll_no: s.roll_no, class_id: s.class_id } },
      update: {},
      create: s,
    })
  ))
  console.log(`     ✓ ${students.length} students created`)

  // ── 6. Syllabus ─────────────────────────────────────────────────────────────
  console.log('  📖 Creating syllabus items…')
  const syllabusData = [
    { topic:'Rational Numbers',       chapter:'Chapter 1',  is_completed:true,  planned_date:new Date('2024-01-07'), completed_date:new Date('2024-01-08') },
    { topic:'Powers and Exponents',   chapter:'Chapter 2',  is_completed:true,  planned_date:new Date('2024-01-11'), completed_date:new Date('2024-01-12') },
    { topic:'Linear Equations',       chapter:'Chapter 3',  is_completed:true,  planned_date:new Date('2024-01-14'), completed_date:new Date('2024-01-15') },
    { topic:'Quadratic Equations',    chapter:'Chapter 4',  is_completed:true,  planned_date:new Date('2024-01-21'), completed_date:new Date('2024-01-22') },
    { topic:'Triangles & Properties', chapter:'Chapter 5',  is_completed:true,  planned_date:new Date('2024-01-28'), completed_date:new Date('2024-01-29') },
    { topic:'Mensuration',            chapter:'Chapter 6',  is_completed:false, planned_date:new Date('2024-02-05'), completed_date:null },
    { topic:'Data Handling',          chapter:'Chapter 7',  is_completed:false, planned_date:new Date('2024-02-12'), completed_date:null },
    { topic:'Introduction to Graphs', chapter:'Chapter 8',  is_completed:false, planned_date:new Date('2024-02-19'), completed_date:null },
    { topic:'Playing with Numbers',   chapter:'Chapter 9',  is_completed:false, planned_date:new Date('2024-02-26'), completed_date:null },
    { topic:'Factorisation',          chapter:'Chapter 10', is_completed:false, planned_date:new Date('2024-03-04'), completed_date:null },
  ]
  await Promise.all(syllabusData.map(s =>
    prisma.syllabus.create({
      data: { class_id: cls8a.id, subject_id: maths.id, ...s },
    }).catch(() => {}) // skip duplicates on re-seed
  ))
  console.log(`     ✓ ${syllabusData.length} syllabus items created`)

  // ── 7. Homework ─────────────────────────────────────────────────────────────
  console.log('  📝 Creating homework…')
  const hw1 = await prisma.homework.create({
    data: {
      teacher_id:    teachers[0].id,
      class_id:      cls8a.id,
      subject_id:    maths.id,
      description:   'Exercise 3.1 – Q1 to Q10 (Linear Equations)',
      assigned_date: new Date('2024-01-15'),
      due_date:      new Date('2024-01-17'),
    },
  }).catch(async () => prisma.homework.findFirst({ where: { class_id: cls8a.id, subject_id: maths.id } }))

  // Submit 9 of 12 students
  if (hw1) {
    await Promise.all(students.slice(0, 9).map(s =>
      prisma.homework_submissions.upsert({
        where:  { homework_id_student_id: { homework_id: hw1.id, student_id: s.id } },
        update: {},
        create: { homework_id: hw1.id, student_id: s.id, status: 'submitted', submission_date: new Date('2024-01-16') },
      })
    ))
    // 3 pending
    await Promise.all(students.slice(9).map(s =>
      prisma.homework_submissions.upsert({
        where:  { homework_id_student_id: { homework_id: hw1.id, student_id: s.id } },
        update: {},
        create: { homework_id: hw1.id, student_id: s.id, status: 'pending' },
      })
    ))
  }
  console.log('     ✓ Homework + submissions created')

  // ── 8. Learning Outcomes ────────────────────────────────────────────────────
  console.log('  🧠 Creating learning outcomes…')
  const loData = [
    { studentIdx:0,  teacherScore:8.5, principalScore:8.0, status:'Exceeding'   },
    { studentIdx:1,  teacherScore:7.0, principalScore:7.5, status:'Meeting'     },
    { studentIdx:2,  teacherScore:5.5, principalScore:5.0, status:'Approaching' },
    { studentIdx:3,  teacherScore:9.0, principalScore:8.5, status:'Exceeding'   },
    { studentIdx:4,  teacherScore:6.5, principalScore:6.0, status:'Meeting'     },
    { studentIdx:5,  teacherScore:4.5, principalScore:4.0, status:'Approaching' },
    { studentIdx:6,  teacherScore:8.0, principalScore:7.5, status:'Exceeding'   },
    { studentIdx:7,  teacherScore:7.5, principalScore:7.0, status:'Meeting'     },
    { studentIdx:8,  teacherScore:5.0, principalScore:5.5, status:'Approaching' },
    { studentIdx:9,  teacherScore:9.5, principalScore:9.0, status:'Exceeding'   },
    { studentIdx:10, teacherScore:6.0, principalScore:6.5, status:'Meeting'     },
    { studentIdx:11, teacherScore:7.0, principalScore:7.0, status:'Meeting'     },
  ]
  await Promise.all(loData.map(d =>
    prisma.learning_outcomes.create({
      data: {
        student_id:      students[d.studentIdx].id,
        subject_id:      maths.id,
        topic:           'Linear Equations',
        teacher_score:   d.teacherScore,
        principal_score: d.principalScore,
        status:          d.status,
      },
    }).catch(() => {})
  ))
  console.log(`     ✓ ${loData.length} LO records created`)

  // ── 9. Observations ─────────────────────────────────────────────────────────
  console.log('  👁  Creating observations…')
  await Promise.all([
    { teacher_id: teachers[0].id, total_score: 42, date: '2024-01-05' },
    { teacher_id: teachers[0].id, total_score: 38, date: '2023-12-10' },
    { teacher_id: teachers[1].id, total_score: 45, date: '2024-01-08' },
    { teacher_id: teachers[2].id, total_score: 35, date: '2024-01-12' },
    { teacher_id: teachers[3].id, total_score: 40, date: '2024-01-15' },
  ].map(o =>
    prisma.observations.create({
      data: {
        teacher_id:       o.teacher_id,
        observed_by:      admin.id,
        observation_date: new Date(o.date),
        total_score:      o.total_score,
        max_score:        50,
      },
    }).catch(() => {})
  ))
  console.log('     ✓ Observations created')

  // ── 10. Leave Requests ───────────────────────────────────────────────────────
  console.log('  🏖  Creating leave requests…')
  await Promise.all([
    { user_id: teachers[0].id, type:'Sick',     from:'2024-01-10', to:'2024-01-11', status:'Approved', reason:'High fever' },
    { user_id: teachers[0].id, type:'Casual',   from:'2024-01-25', to:'2024-01-25', status:'Pending',  reason:'Personal work' },
    { user_id: teachers[1].id, type:'Earned',   from:'2024-02-05', to:'2024-02-07', status:'Approved', reason:'Family function' },
    { user_id: teachers[2].id, type:'Sick',     from:'2024-01-20', to:'2024-01-22', status:'Rejected', reason:'Viral infection' },
    { user_id: teachers[3].id, type:'Half Day', from:'2024-02-02', to:'2024-02-02', status:'Approved', reason:'Medical appointment' },
    { user_id: teachers[4].id, type:'Casual',   from:'2024-02-14', to:'2024-02-15', status:'Pending',  reason:'Personal reasons' },
  ].map(l =>
    prisma.leave_requests.create({
      data: {
        user_id:   l.user_id,
        type:      l.type,
        from_date: new Date(l.from),
        to_date:   new Date(l.to),
        reason:    l.reason,
        status:    l.status,
      },
    }).catch(() => {})
  ))
  console.log('     ✓ Leave requests created')

  // ── 11. Recalculate all performance scores ───────────────────────────────────
  console.log('  📊 Calculating performance scores…')
  const { recalcPerformance } = require('../controllers/observationsController')
  await Promise.allSettled(teachers.map(t => recalcPerformance(t.id)))
  console.log('     ✓ Performance scores calculated')

  console.log('\n✅ Seeding complete!\n')
  console.log('  Login credentials:')
  console.log('  Admin:   admin@sams.com   / Admin@123')
  console.log('  Teacher: teacher@sams.com / Teacher@123\n')
}

seed()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
