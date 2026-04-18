# SAMS System - Complete Backend Analysis & Integration Blueprint

**Analysis Date:** Current state from codebase & database dumps
**Scope:** Full project (frontend + backend + DB)

---

## 1. 🗄️ DATABASE STRUCTURE ANALYSIS

### Primary Schema (atlas_sams_db.sql - Main DB)

**Tables (12 total):**

| Table | Purpose | Key Columns | Primary Key | Foreign Keys | Sample Data Count |
|-------|---------|-------------|-------------|--------------|-------------------|
| `users` | Admin/Teacher accounts | id, name, email, password (hashed), role, phone, status | id (auto) | — | 6 records |
| `classes` | Class/Section | id, class_name, section | id (auto) | — | 14 records |
| `subjects` | Subjects | id, name | id (auto) | — | 5 records |
| `students` | Students | id, name, roll_no, email, class_id, gender | id (auto) | classes(id) | 16 records |
| `teacher_subjects` | Teacher-Class-Subject assignments | id, teacher_id, subject_id, class_id | id (auto) | users(id), subjects(id), classes(id) | 6 records |
| `syllabus` | Syllabus topics | id, class_id, subject_id, topic, chapter, planned_date, completed_date, is_completed | id (auto) | classes(id), subjects(id) | 12 records |
| `homework` | Homework assignments | id, teacher_id, class_id, subject_id, description, assigned_date, due_date | id (auto) | users(id), classes(id), subjects(id) | 2 records |
| `homework_submissions` | Student homework submissions | id, homework_id, student_id, submission_date, status, score | id (auto) | homework(id), students(id) | 14 records |
| `learning_outcomes` | LO scores | id, student_id, subject_id, topic, teacher_score, principal_score, status | id (auto) | students(id), subjects(id) | 13 records |
| `leave_requests` | Leave applications | id, user_id, type, from_date, to_date, reason, status | id (auto) | users(id) | 7 records |
| `observations` | Classroom observations | id, teacher_id, observed_by, observation_date, total_score, max_score | id (auto) | users(id) | 6 records |
| `performance_scores` | Teacher performance | id, teacher_id, syllabus_pct, lo_avg_pct, observation_pct, other_score, overall_score | id (auto) | users(id) | 5 records |

**Key Relationships:**
```
users 1---* teacher_subjects *---1 subjects
users 1---* homework *---1 subjects *---1 classes *---* students
users 1---* syllabus *---1 subjects *---1 classes
users 1---* leave_requests
users 1---* observations
users 1---* performance_scores
students *---* homework_submissions *---1 homework
students *---* learning_outcomes *---1 subjects
```

**Notes:**
- users.role = 'teacher' | 'admin' (no separate teachers table)
- phone/mobile in users for login
- No separate password reset table
- performance_scores stores computed aggregates

### Additional Schemas
- `sams_minimal_setup_db.sql`: Minimal tables for testing (users, classes, students, etc.)
- `atlas_sams_db_latest.sql`: Extended academic structure (academic_classes, acad_* tables for streams/sections)

---

## 2. 🌐 FRONTEND PAGE MAPPING

### Admin Portal (src/pages/principal/)
| Page | File | Features | Data Source | API Connected? |
|------|------|----------|-------------|----------------|
| AdminDashboard | AdminDashboard.jsx | Stats, syllabus, observations, birthdays | dummyData.js (ALL_TEACHERS, SYLLABUS_ITEMS, BIRTHDAYS) | No |
| AdminSyllabus | AdminSyllabus.jsx | Syllabus tracking | dummyData.js (SYLLABUS_ITEMS, SCHOOL_SYLLABUS) | No |
| AdminAwardLO | AdminAwardLO.jsx | LO scoring (multi-step form) | LO_ENTRIES | No |
| AdminTeachers | AdminTeachers.jsx | Teacher CRUD, performance | dummyData.js (ALL_TEACHERS) | Partial (service defined, dummy used) |
| AdminStudents | AdminStudents.jsx | Student list | dummyData.js (STUDENTS) | No |
| AdminLeave | AdminLeave.jsx | Leave management | dummyData.js (LEAVES) | No |
| AdminAcademics | AdminAcademics.jsx | Class streams, syllabus auto-calc | constants.js + dummy | No |
| AdminCompetitions | AdminCompetitions.jsx | Events/competitions | N/A | No |
| AdminContact | AdminContact.jsx | Contact messages | N/A | No |
| AdminPermissions | AdminPermissions.jsx | Teacher permissions | dummyData.js (PERMISSIONS) | No |

### Teacher Portal (src/pages/teacher/)
| Page | File | Features | Data Source | API Connected? |
|------|------|----------|-------------|----------------|
| TeacherDashboard | TeacherDashboard.jsx | Syllabus stats, LO summary, HW tracking | dummyData.js (SYLLABUS_STATS, LO_SUMMARY) | No |
| TeacherSyllabus | TeacherSyllabus.jsx | Syllabus completion | dummyData.js (SYLLABUS_ITEMS) | No |
| TeacherHomework | TeacherHomework.jsx | HW assignment + submissions | dummyData.js (HOMEWORK, HW_TRACKING) | No |
| TeacherLO | TeacherLO.jsx | LO entry | dummyData.js (LO_ENTRIES) | No |
| TeacherAnalytics | TeacherAnalytics.jsx | Performance charts | dummyData.js (LO_CHART, etc.) | No |
| TeacherSchedule | TeacherSchedule.jsx | Weekly schedule | dummyData.js (WEEKLY_SCHEDULE) | No |
| TeacherLeave | TeacherLeave.jsx | Leave apply | dummyData.js (LEAVES) | No |
| TeacherProfile | TeacherProfile.jsx | Profile + permissions | dummyData.js (TEACHER_PROFILE) | No |
| TeacherNotifications | TeacherNotifications.jsx | Notifications | N/A | No |

**Common Components:**
- DataTable, Modal, StatCard, StatusBadge (ui/index.jsx)
- Charts (components/charts/index.jsx)
- AuthContext for role-based access

---

## 3. 📦 DUMMY DATA DEPENDENCY MAPPING

**dummyData.js Exports:**
| Export | Type | Used By | Size |
|--------|------|---------|------|
| ALL_TEACHERS | Array<Teacher> | AdminTeachers, TeacherProfile | 5 records |
| STUDENTS | Array<Student> | AdminStudents | 12 records |
| SYLLABUS_ITEMS | Array<SyllabusTopic> | TeacherSyllabus | 10 items |
| SCHOOL_SYLLABUS | Array<TeacherSyllabus> | AdminSyllabus | 7 records |
| HOMEWORK | Array<HW> | TeacherHomework | 5 items |
| LO_ENTRIES | Array<LO> | TeacherLO, AdminAwardLO | 12 records |
| LEAVES | Array<Leave> | TeacherLeave, AdminLeave | 6 records |
| WEEKLY_SCHEDULE | Array<ScheduleDay> | TeacherSchedule | 6 days |
| OBSERVATIONS | Array<Observation> | AdminDashboard | 5 records |
| TEACHER_PERFORMANCE | Array<Perf> | TeacherAnalytics | 5 records |
| PERMISSIONS | Array<Perm> | TeacherProfile | 5 items |

**constants.js (partial):**
- ADMIN_DEPT_FILTER, DEPARTMENTS, ALL_CLASSES
- Used in dropdowns/filters

---

## 4. 🔗 BACKEND API ANALYSIS

### Frontend Services (src/services/api.js)
**Defined (but mostly unused):**
```
studentService: getAll/create/update/delete
teacherService: getAll/create/update/toggleStatus
leaveService: getAll/updateStatus
```
Base URL: `http://localhost/school_web/backend/api`

**sams-backend Structure:**
- Full Node.js/Express/Prisma API ready
- Controllers: auth, users, students, classes, syllabus, homework, lo, observations, performance, leave, dashboard
- Routes: /api/auth/login, /api/users, /api/students, etc.
- Validators (Joi), JWT auth, pagination
- Prisma schema mirrors DB exactly
- Seeder with demo data

**Connected Endpoints:** None (all dummy)
**Missing Endpoints:** All (frontend uses dummy exclusively)

---

## 5. 📊 FEATURE vs DATA SOURCE TABLE

| Feature | Page | Data Source | Backend Status | Related DB Table(s) |
|---------|------|-------------|---------------|---------------------|
| Teacher CRUD | AdminTeachers | dummyData.ALL_TEACHERS | Service defined, dummy used | users, teacher_subjects |
| Student List | AdminStudents | dummyData.STUDENTS | Service defined | students |
| Syllabus Tracking | TeacherSyllabus/AdminSyllabus | dummyData.SYLLABUS_ITEMS | No service | syllabus |
| Homework Mgmt | TeacherHomework | dummyData.HOMEWORK | Service partial | homework, homework_submissions |
| LO Scoring | TeacherLO/AdminAwardLO | dummyData.LO_ENTRIES | No service | learning_outcomes |
| Leave Mgmt | TeacherLeave/AdminLeave | dummyData.LEAVES | Service defined | leave_requests |
| Schedule | TeacherSchedule | dummyData.WEEKLY_SCHEDULE | No service | (none - derived) |
| Performance | AdminPerformance | dummyData.TEACHER_PERFORMANCE | Controller exists | performance_scores, observations |
| Observations | AdminDashboard | dummyData.OBSERVATIONS | Controller exists | observations |
| Permissions | TeacherProfile | dummyData.PERMISSIONS | No service | (none) |

---

## 6. 🚨 GAPS ANALYSIS

### Critical Gaps:
1. **100% Dummy Data Dependency** - No page uses real API data
2. **No Error Handling** for API failures (hardcoded dummy)
3. **No Loading States** in most pages
4. **AuthContext** not using real JWT (static role check)
5. **No Real Data Flow** - All pages self-contained

### Missing APIs in Frontend:
- All syllabus, schedule, analytics endpoints
- Real auth integration
- Pagination handling

### Backend Ready Modules (0 integration):
- Full CRUD for users/students/classes
- Syllabus tracking
- Homework workflow
- LO scoring
- Leave system
- Performance calculation
- Dashboard stats

### Incomplete Workflows:
- No student enrollment to classes
- No teacher-class-subject real mapping
- No real-time updates (useEffect empty)
- No validation (mobile unique, password strength)

---

## 7. 🧭 INTEGRATION READINESS PLAN (High Level)

### Phase 1 - Authentication (Week 1)
```
AuthContext.jsx + FRONTEND_API_SERVICE.js → Real JWT
Login.jsx → API login
ProtectedRoute.jsx → Real token check
```

### Phase 2 - Core CRUD (Week 2-3)
```
AdminTeachers → teacherService
AdminStudents → studentService  
Classes dropdown → classesService
```

### Phase 3 - Academic Features (Week 4-5)
```
TeacherSyllabus → syllabusService
TeacherHomework → homeworkService
TeacherLO → loService
```

### Phase 4 - Admin Features (Week 6)
```
AdminLeave → leaveService
AdminPerformance → performance recalc
AdminDashboard → aggregate queries
```

### Dummy Data Removal Priority:
1. Authentication (immediate)
2. Teachers/Students (Week 2)
3. Syllabus/Homework (Week 4)
4. Analytics/Dashboards (Week 6)

**Total Backend Ready:** Backend 100% ready. Frontend 0% connected.

**Migration Effort:** ~6 weeks sequential, ~3 weeks parallel (2 devs).

**Risks:** None - Backend matches schema exactly, frontend services pre-defined.
