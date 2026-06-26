# MODULE DOCUMENTATION - SAMS ATLAS PLATFORM

## 1. Teacher Portal Modules

### 1.1 Teacher Dashboard
* **Purpose**: Provides a bird’s-eye view of a teacher's academic progress, pending tasks, and performance.
* **Routes**: `/teacher/dashboard`
* **API Endpoints**: `GET /api/dashboard/teacher`, `GET /api/lms/intelligence/teacher-dashboard`
* **Data Sources**: `syllabus` completion rates, `homework_submissions` pending grading, `school_events` upcoming.
* **Dependencies**: Relies on LMS Intelligence engine to generate alerts.

### 1.2 My Schedule & Micro Schedule
* **Purpose**: Teachers view their assigned classes (Timetable) and break down their syllabus into weekly/daily topics.
* **API Endpoints**: `GET /api/teacher/schedule`, `POST /api/teacher/schedule/micro-schedule`
* **Workflow**: 
  1. Teacher views the period grid.
  2. Teacher clicks a slot to enter what they will teach.
  3. They mark the topic as "Completed", which updates the global `syllabus` table `is_completed` flag.
* **What breaks if removed**: The entire Syllabus Tracking module and Teacher Performance (Syllabus Completion metric) will fail.

### 1.3 Learning Outcomes (Award LO)
* **Purpose**: Teachers evaluate students on specific topics (Approaching, Meeting, Exceeding).
* **API Endpoints**: `POST /api/teacher-lo/self`, `GET /api/teacher-lo`
* **Workflow**: Teacher selects class/subject -> views topic -> assigns score. 
* **Dependencies**: Depends on the `students` list and `syllabus` topics.

### 1.4 Leave Management (My Leaves)
* **Purpose**: Teachers apply for leaves.
* **API Endpoints**: `POST /api/leave`, `GET /api/leave`
* **Database**: `leave_requests`

---

## 2. Admin Portal Modules

### 2.1 Principal Dashboard
* **Purpose**: Aggregates school-wide metrics, live activity feeds, and critical LMS intelligence alerts.
* **Routes**: `/admin/dashboard`
* **Data Sources**: `dashboardApi.getAdminMetrics()`, `dashboardApi.getHomeworkNotifications()`.
* **Dependencies**: Requires valid connections to almost all system tables to generate live aggregated stats.

### 2.2 System Tools & Academic Architecture
* **Purpose**: Manage the core taxonomy of the school (Classes, Sections, Subjects, Streams).
* **API Endpoints**: `/admin/classes`, `/admin/sections`, `/admin/subjects`, `/admin/subject-assignments`
* **What breaks if removed**: Completely disables the ability to assign students, timetable generation, and syllabus tracking.

### 2.3 Teacher Directory & Bulk Upload
* **Purpose**: Admin adds, updates, blocks, or bulk imports teachers.
* **Workflow**: 
  1. Upload Excel via `multipart/form-data`.
  2. Backend validates duplicate Emails/Phones.
  3. Creates `users` record + `teachers` profile record.
* **Database Tables**: `users`, `teachers`

### 2.4 Student Directory & Bulk Upload
* **Purpose**: Manage student lifecycles (Active, Blocked, Graduated, Failed).
* **Workflow**: Enroll via form or Excel.
* **Dependencies**: Depends heavily on the `classes` table (students cannot be created without a valid class).

### 2.5 Teacher Performance Analysis
* **Purpose**: Automates the calculation of Teacher KPIs based on LMS data.
* **Logic / Calculations**:
  * **Syllabus Completion** (15% weight): Extracted from the Micro Schedule (`is_completed` topics / `total` topics).
  * **LO Achievement** (15% weight): Average of `principal_score` across all LO submissions in `teacher_performance_lo`.
  * **Observation Score** (25% weight): Average of audits in `class_observations` ((score/50)*100).
  * **Participate Score** (10% weight): Manual Admin override.
  * **Other Score** (20% weight): Manual Admin override.
  * **Language Proficiency** (15% weight): Manual Admin override.
* **Workflow**: Admin views calculated metrics, can manually override scores, which saves to `teacher_performance_lo` and `teacher_performance_overrides`.

### 2.6 Classroom Observations
* **Purpose**: Principal physically audits a class and grades the teacher on 5 metrics (Content Mastery, Pedagogy, Student Engagement, Communication, Assessment). Total = 50 marks.
* **Database**: `class_observations`
* **Dependencies**: Feeds directly into Teacher Performance Analysis (25% weight).

### 2.7 Timetable Management
* **Purpose**: Admin uploads a master schedule via Excel.
* **Workflow**: 
  1. Excel parsed.
  2. `time_slots` matched.
  3. Validates against double-booking (e.g., Teacher assigned to 2 classes at the same time).
  4. Records inserted to `teacher_timetable`.

### 2.8 Permissions & Role Management
* **Purpose**: Controls module visibility and API access.
* **Implementation Details**: Uses standard JWT `role` claims (`admin` vs `teacher`). Advanced granular permissions (if any) are handled via `/admin/permissions/grant`.
