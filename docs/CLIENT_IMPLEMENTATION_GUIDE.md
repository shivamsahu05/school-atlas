# SAMS ATLAS Platform - Client Implementation Guide

## 1. Introduction

Welcome to the SAMS ATLAS Platform. This guide is your master blueprint for successfully launching and running the system in your school. 

**Purpose of SAMS ATLAS Implementation**
This platform is designed to digitize your entire academic operation—from the Principal's office down to the teacher's daily classroom schedule. Proper implementation guarantees automated performance tracking, clear syllabus monitoring, and zero paperwork.

**Why Correct Setup Sequence is Important**
SAMS ATLAS is highly interconnected. You cannot assign a teacher to a subject if that subject does not exist. You cannot generate a timetable if teachers do not have classes. Following the exact sequence in this guide is mandatory for a smooth launch.

**Risks of Incorrect Setup**
Skipping steps or doing them out of order will lead to "empty" screens, broken performance calculations, missing students, and frustrated teachers. Always follow the Go-Live checklist sequentially.

---

## 2. BEFORE GO-LIVE SETUP (CRITICAL SEQUENCE)

⚠️ **IMPORTANT: This order must be strictly followed before giving login access to any Teacher.**

### Step 1: Manage Academics Setup
1. **Create Classes:** Add all grades (e.g., Grade 1, Grade 10).
2. **Create Sections:** Add all sections (e.g., Section A, Section B).
3. **Create Subjects:** Add all subjects taught in the school.

*Why this must be done first:* This is the foundation of the school. Without this academic framework, you cannot add students or assign teachers.
*Impact if skipped:* The system will be completely empty. No other module will work.

### Step 2: Student Directory Setup
1. **Add Students:** Enter student details via form or bulk Excel upload.
2. **Assign Students to Classes:** Ensure every student is accurately mapped to their specific Class and Section.

*Importance of correct class mapping:* When teachers log in to enter marks or evaluate Learning Outcomes, they will only see students who are correctly mapped to their classes. 

### Step 3: Teacher Directory Setup
1. **Add Teachers:** Create profiles and login credentials for your staff.
2. **Assign Classes & Assign Subjects:** Link each teacher to the specific classes and subjects they teach.

*Teacher-class-subject relationship importance:* This is the most critical link. If a teacher is not mapped to "Grade 5 Mathematics", they will not be able to see the Grade 5 timetable, syllabus, or students. 

### Step 4: Permission Control Setup
1. **Assign module permissions:** Go to Permission Control and grant special access (like Admin duties) to specific Coordinators or senior teachers.
2. **Enable required modules only:** Restrict access to sensitive areas for standard teachers.

*Explanation:* Without proper permissions, teachers will either see too much sensitive data or be blocked from tools they need to do their jobs.

### Step 5: Timetable Setup
1. **Create Teacher Timetable:** Upload the master timetable.
2. **Create Student Timetable:** Ensure classes are fully scheduled.

*Dependency on teacher & class setup:* The timetable module strictly checks if the teacher is assigned to the subject and class. If you skipped Step 3, the timetable upload will fail.

### Step 6: Micro Schedule Setup
1. **Upload syllabus:** Provide the yearly plan for each subject.
2. **Assign Plans:** Ensure the syllabus is locked to the correct class and subject.

*Mapping with teacher assignments:* Once uploaded, the syllabus automatically routes to the dashboard of the teacher assigned to that class (from Step 3), giving them their daily teaching targets.

### Step 7: Learning Outcomes Setup
*Why LO tracking is important:* It helps the Principal objectively see if students are understanding the syllabus, instead of just assuming teaching is happening.
*When to start entering data:* Once the Micro Schedule is active and teachers complete their first week of syllabus topics.

### Step 8: Classroom Observation Setup
*Observation system activation:* Principals can begin using this immediately after the Timetable is live. 
*Role in performance tracking:* Physical classroom observations account for 25% of a teacher's final performance score. It is highly recommended to do at least one observation per teacher per month.

### Step 9: Award LO Scores Setup
*How scoring phase starts:* After teachers evaluate their students in the LO module, the data moves to the "Award LO Scores" module where the Principal gives the final approval and score.

---

## 3. GO-LIVE CHECKLIST

Do not share login credentials with teachers until every box is checked:
- [ ] All classes, sections, and subjects created
- [ ] All students added and mapped to classes
- [ ] All teachers added and assigned to classes/subjects
- [ ] Permissions configured for all staff
- [ ] Master timetable uploaded and active
- [ ] Micro Schedule (Syllabus) uploaded
- [ ] Leave management system active
- [ ] Performance Reports module accessible

---

## 4. DAILY OPERATION FLOW

**Admin Daily Tasks:**
* **Manage leave approvals:** Check the Leave module every morning to approve or reject requests.
* **Check syllabus progress:** Monitor the Dashboard to ensure teachers are updating their Micro Schedules.
* **Monitor attendance & alerts:** Check the Live Activity feed for immediate school updates.

**Teacher Daily Tasks:**
* **Check timetable:** View the daily schedule.
* **Update Micro Schedule:** Mark today's taught topics as "Completed". (Crucial for performance scores).
* **Enter marks / LOs:** Evaluate students based on the day's or week's work.
* **Submit leave requests:** Use the portal instead of paper applications.

---

## 5. MONTHLY / ACADEMIC REVIEW FLOW

At the end of every month, the Principal/Admin should conduct a formal review:
* **Syllabus completion review:** Are teachers behind schedule? Check the Syllabus Report.
* **Observation reviews:** Ensure every teacher has been observed at least once this month.
* **LO score updates:** Finalize all pending Learning Outcome approvals.
* **Performance analysis:** Go to the Teacher Performance module, manually enter the 'Language', 'Participation', and 'Other' scores, and review the final automated KPI ratings.

---

## 6. END OF ACADEMIC YEAR PROCESS (VERY IMPORTANT)

This sequence ensures a clean transition from one academic year to the next.

### Step 1: Freeze Current Academic Data
* Stop all edits. Instruct teachers that no more Micro Schedule or Marks entry is allowed for the current session.

### Step 2: Generate Final Reports
* Download and backup Teacher Performance reports, Student Progress reports, and Syllabus Completion reports for the school archives.

### Step 3: Data Cleanup (SAFE RESET)
* Use the System Tools to initiate the Session Rollover process. Ensure historical data is archived so the system runs fast for the new year.

### Step 4: Academic Year Increment
* Go to System Tools and update the Active Academic Year (e.g., from 2025-26 to 2026-27). This resets the dashboards for a new batch.

### Step 5: Teacher Re-Assignment
* Reassign classes and subjects for teachers based on the new year's requirements. Reset module permissions if leadership roles have changed.

### Step 6: New Student Admission Cycle
* Graduate the oldest class. Promote existing students. Add the incoming fresh batch of students to the system.

⚠️ **IMPORTANT RISKS OF SKIPPING CLEANUP:**
* **Data mixing:** Last year's incomplete syllabus will mix with this year's plan.
* **Wrong performance calculation:** Teachers will be graded on outdated data.
* **Timetable conflicts:** Old schedules will block new schedules from being uploaded.

---

## 7. COMMON MISTAKES (CRITICAL)

Avoid these common operational pitfalls:
* **Creating students before classes:** You will have nowhere to assign them.
* **Assigning teachers without subjects:** The teacher will log in and see a blank portal.
* **Not updating timetable before Micro Schedule:** The system won't know when the syllabus should be taught.
* **Starting syllabus without teacher mapping:** The syllabus will just float in the system and nobody will get credit for teaching it.
* **Not closing old academic year properly:** Causes massive data confusion on Day 1 of the new term.

---

## 8. TROUBLESHOOTING GUIDE

* **Teacher cannot see a module:** You forgot to grant them access. Go to Permission Control and enable it.
* **Students not appearing in class:** The student was likely mapped to the wrong section during bulk upload. Go to Student Directory and edit their profile.
* **Timetable not showing:** The teacher is not assigned to that subject. Go to Teacher Directory -> Assign Subjects.
* **Micro schedule not visible:** The syllabus Excel file failed to upload, or was uploaded for the wrong class.
* **Leave requests not appearing:** Check if the Admin dashboard is filtering out "Pending" requests by mistake.

---

## 9. BEST PRACTICES

* **Always follow the setup sequence:** Never skip Step 1 or Step 2.
* **Always verify permissions:** Log in as a test teacher once to see what they see.
* **Always complete academic year properly:** Follow the Step-by-Step reset guide above.
* **Regular monitoring:** Check the Syllabus Report weekly, not just at the end of the year.

---

## 10. FINAL SUMMARY CHECKLIST

Before declaring the system "Live":
- [ ] System Ready For Use
- [ ] Teachers Fully Active
- [ ] Students Mapped
- [ ] Timetable Active
- [ ] Permissions Verified
- [ ] Syllabus Loaded
- [ ] Performance Tracking Active
