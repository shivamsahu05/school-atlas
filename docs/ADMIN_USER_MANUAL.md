# SAMS ATLAS Platform - Admin User Manual

## Introduction

### What is SAMS ATLAS?
SAMS ATLAS (School Academic Management System) is an all-in-one digital platform built to simplify the daily operations of your school. It bridges the gap between administration and teaching by bringing everything into one unified dashboard.

### Purpose of the System
The platform replaces manual paperwork and scattered spreadsheets. It allows the Principal and Administrative team to centrally manage classes, teachers, students, syllabuses, timetables, and teacher performance. 

### Benefits of using the Platform
* **Real-Time Tracking:** Instantly see which teacher is teaching what topic today.
* **Paperless Audits:** Conduct classroom observations on your tablet or computer.
* **Automated Performance:** Teacher KPIs and scores are calculated automatically based on their daily activities.
* **Centralized Communication:** Send notices, manage leave requests, and track events effortlessly.

---

## Getting Started

### Login
1. Open your web browser and navigate to the SAMS ATLAS login page.
2. Enter your **Admin Username** and **Password**.
3. Click the **Login** button.

[SCREENSHOT TO BE ADDED]

### Logout
1. Click on your profile icon located at the top-right corner of the dashboard.
2. Select **Logout** from the dropdown menu.
3. You will be redirected back to the login screen.

### Password Guidelines
* Always keep your admin password secure. Do not share it with teaching staff.
* If you forget your password, contact your system deployment provider to reset it.

### Session Management
* For security, the system will keep you logged in while active. If you step away from your desk, it is highly recommended to click **Logout** to prevent unauthorized access to sensitive student and teacher data.

---

## Recommended First-Time Setup

To ensure the platform works perfectly, the initial setup **must** follow this exact sequence. Missing a step will cause issues later (e.g., you cannot assign a teacher to a class if the class doesn't exist yet).

**Step 1: Manage Academics**
* Create Classes -> Create Sections -> Create Subjects.

**Step 2: Student Directory**
* Add Students into their respective classes and sections.

**Step 3: Teacher Directory**
* Add Teachers and assign them the Classes and Subjects they will be teaching.

**Step 4: Permission Control**
* Assign special module permissions to specific staff members if required.

**Step 5: Timetable Creation**
* Upload the master Teacher Timetable.

**Step 6: Micro Schedule Setup**
* Upload the yearly Syllabus plans so teachers know what to teach.

**Step 7: Learning Outcomes**
* Monitor how teachers are grading student understanding.

**Step 8: Classroom Observation**
* Begin auditing teacher performance physically in classrooms.

**Step 9: Teacher Performance**
* Review the automatically generated performance reports at the end of the month.

**Why is this sequence important?**
The SAMS ATLAS platform is highly interconnected. A timetable requires teachers and subjects. Teachers require classes. Therefore, the foundation (Academics) must be built first before adding people (Teachers/Students), and people must be added before assigning daily tasks (Syllabus/Timetable).

---

## ADMIN MODULES

### Dashboard
#### Purpose
To provide a live, real-time overview of the school's daily operations.
#### When To Use
Every morning and throughout the day to monitor school health.
#### Step-by-Step Instructions
1. Click on **Dashboard** in the left menu.
2. View the summary cards at the top for quick numbers (Total Teachers, Active Classes).
3. Scroll down to view the **Live Activity Feed** for real-time teacher actions.
#### Expected Result
You will see up-to-date statistics and alerts.
#### Important Notes
The Dashboard data updates automatically as teachers complete tasks on their portals.
[SCREENSHOT TO BE ADDED]

### Manage Academics
#### Purpose
To set up the foundational structure of the school: Classes, Sections, Subjects, and Streams.
#### When To Use
At the start of a new academic year, or when a new subject is introduced.
#### Step-by-Step Instructions
1. Click **Manage Academics** in the menu.
2. Go to the **Classes** tab and click **Add New Class**.
3. Go to the **Sections** tab and click **Add New Section**.
4. Go to the **Subjects** tab to define subjects.
5. Finally, use the assignment screen to link subjects to specific classes.
#### Common Mistakes
Forgetting to map a subject to a class. A subject must be mapped before it appears in the teacher's portal.
[SCREENSHOT TO BE ADDED]

### Student Directory
#### Purpose
To maintain a digital record of all enrolled students.
#### When To Use
During admission season, or when a student transfers.
#### Step-by-Step Instructions
1. Click **Student Directory**.
2. To add one student, click **Add Student** and fill in their details (Name, Roll No, Class).
3. To add many students, click **Bulk Import**, download the Excel template, fill it out, and upload it.
#### Expected Result
Students will appear in the directory and will be visible to their assigned teachers.
#### Common Mistakes
Uploading an Excel file without following the exact column format provided in the template.
[SCREENSHOT TO BE ADDED]

### Teacher Directory
#### Purpose
To manage staff profiles, credentials, and their subject assignments.
#### When To Use
When a new teacher is hired or leaves the school.
#### Step-by-Step Instructions
1. Click **Teacher Directory**.
2. Click **Add Teacher** or use the **Bulk Import** feature.
3. Once added, click the **Assign Classes/Subjects** button next to their name to define what they teach.
#### Expected Result
The teacher can now log in using their email and password, and they will only see the classes assigned to them.
#### Important Notes
If a teacher is marked as "Inactive", they will immediately lose access to the system.
[SCREENSHOT TO BE ADDED]

### Timetable (Teacher & Student)
#### Purpose
To digitize the weekly schedule so teachers know where they need to be.
#### When To Use
After all teachers and subjects are assigned, usually at the beginning of the term.
#### Step-by-Step Instructions
1. Click **Timetable Management**.
2. Download the Master Timetable Excel template.
3. Fill in the schedule using exact Teacher IDs and Subject Codes.
4. Click **Upload Excel**.
#### Troubleshooting
If the system detects a conflict (e.g., Teacher A is assigned to two different classes at 9:00 AM), it will reject the upload and highlight the error. Fix the error in the Excel file and re-upload.
[SCREENSHOT TO BE ADDED]

### Micro Schedule
#### Purpose
To break down the yearly syllabus into actionable daily/weekly topics for teachers.
#### When To Use
At the start of the term.
#### Step-by-Step Instructions
1. Click **Micro Schedule**.
2. Select the Class and Subject.
3. Upload the syllabus plan.
#### Expected Result
Teachers will see these topics in their daily portal and can mark them as "Completed" after teaching them.
[SCREENSHOT TO BE ADDED]

### Syllabus Status & Report
#### Purpose
To track how far along each teacher is in completing their assigned syllabus.
#### When To Use
Weekly or monthly to ensure academic pacing is on track.
#### Step-by-Step Instructions
1. Click **Syllabus Report**.
2. Filter by Class or Teacher to view completion percentages.
[SCREENSHOT TO BE ADDED]

### Learning Outcomes (Award LO Scores)
#### Purpose
To review how well students are understanding the syllabus, and for the Principal to provide final approval on grading.
#### When To Use
After a chapter or term ends and teachers have submitted their initial evaluations.
#### Step-by-Step Instructions
1. Click **Award LO Scores**.
2. Review the scores submitted by the teacher.
3. Add your own Principal Score to finalize the evaluation.
[SCREENSHOT TO BE ADDED]

### Classroom Observation
#### Purpose
To record physical classroom audits conducted by the Principal or Coordinators.
#### When To Use
When you visit a classroom to evaluate a teacher's performance.
#### Step-by-Step Instructions
1. Open SAMS ATLAS on your tablet or laptop.
2. Click **Classroom Observation**.
3. Select the Teacher you are observing.
4. Grade them on Content Mastery, Pedagogy, Student Engagement, Communication, and Assessment (out of 10 points each).
5. Click **Submit**.
#### Expected Result
The score out of 50 will automatically feed into the Teacher's Monthly Performance Dashboard.
[SCREENSHOT TO BE ADDED]

### Teacher Performance
#### Purpose
To view a completely automated, objective KPI score for every teacher based on their activities.
#### When To Use
End of the month for appraisals or reviews.
#### Step-by-Step Instructions
1. Click **Teacher Performance**.
2. View the leaderboard. The Overall Score is calculated using: Syllabus Completion (15%), LO Achievement (15%), Observation (25%), Language (15%), Participation (10%), Other (20%).
3. Click a teacher's name to manually override the "Participation", "Language", or "Other" scores.
[SCREENSHOT TO BE ADDED]

### Events & Notices
#### Purpose
To broadcast announcements or schedule competitions.
#### When To Use
When you need to inform staff of an upcoming holiday, meeting, or sports event.
#### Step-by-Step Instructions
1. Click **Events & Notices**.
2. Click **Create Event**.
3. Fill in the title, date, and description. 
#### Expected Result
The notice will instantly appear on every Teacher's dashboard.
[SCREENSHOT TO BE ADDED]

### Leave Approval
#### Purpose
To manage staff absence requests digitally.
#### When To Use
Daily, to check for pending requests.
#### Step-by-Step Instructions
1. Click **Leave Approval**.
2. Review pending requests.
3. Click **Approve** or **Reject**.
[SCREENSHOT TO BE ADDED]

### Permission Control
#### Purpose
To give specific teachers access to special administrative modules.
#### When To Use
When promoting a teacher to a Coordinator role.
#### Step-by-Step Instructions
1. Click **Permission Control**.
2. Select the Teacher.
3. Check the boxes next to the modules they should be allowed to access.
[SCREENSHOT TO BE ADDED]

---

## ADMIN DAILY WORKFLOW (SOPs)

### Daily Tasks
1. Log in and review the **Dashboard** Live Activity Feed for urgent alerts.
2. Check the **Leave Approval** module and process pending requests so teachers know their status.
3. Check **Messages** or **Follow-ups** for any communication requiring your attention.

### Weekly Tasks
1. Review the **Syllabus Report** to identify any classes that are falling behind schedule.
2. Conduct at least 2 **Classroom Observations** and log them into the system.
3. Post any upcoming **Events & Notices** for the following week.

### Monthly Tasks
1. Open the **Teacher Performance** module.
2. Input manual scores for Language, Participation, and Other categories for all staff.
3. Review the finalized Monthly Performance Leaderboard.
4. Use the **Award LO Scores** module to finalize student learning outcomes submitted by teachers.

### Academic Session Setup (Yearly)
1. Use **System Tools** to initiate a Session Rollover.
2. Update **Manage Academics** if new subjects or classes are being introduced.
3. Upload the new master **Timetable**.
4. Upload the new **Micro Schedule** (Syllabus).

### New Teacher Joining Process
1. Go to **Teacher Directory** -> Add Teacher.
2. Provide them with their login credentials (Email and Password).
3. Assign them to their Classes and Subjects.
4. Ensure their timetable slots are updated in the master schedule.

### Student Transfer Process
1. Go to **Student Directory**.
2. Search for the student.
3. Change their status from "Active" to "Graduated" or "Transferred". This removes them from active class rosters without deleting their historical data.

---

## ADMIN FAQ

**Q: I cannot log in. What should I do?**
A: Ensure your caps lock is off and you are using the correct email. If the issue persists, contact your IT support to reset the Admin password.

**Q: A Teacher says they cannot see their classes. Why?**
A: You likely forgot to assign them. Go to the **Teacher Directory**, locate the teacher, and click "Assign Classes/Subjects" to link them to their specific grade.

**Q: When I bulk upload an Excel file, it says "Failed". Why?**
A: This usually happens if you changed the column headers in the template, or if you are trying to upload an Email or Phone number that already belongs to another user in the system. Check the error message carefully.

**Q: The Teacher Performance score says 0% for Syllabus Completion.**
A: This means the teacher has not been marking their topics as "Completed" in their Micro Schedule portal. Remind them to log in daily and update their progress.

**Q: Can I delete a Class?**
A: **CAUTION:** Deleting a class will permanently delete all students, syllabus data, and homework associated with that class. It is highly recommended to never delete a class once the academic year has started.
