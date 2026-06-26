# TESTING GUIDE - SAMS ATLAS PLATFORM

## 1. Overview
This guide provides test cases and testing workflows designed for QA engineers and developers. Since the system relies heavily on connected data (Academic Setup -> Teachers -> Timetable -> Syllabus), testing must generally follow a sequential workflow.

## 2. Core Workflow Testing (Integration Test Flow)
To verify the system is functioning end-to-end, follow this exact sequence:

1. **System Initialization (Admin)**
   - Add a Class (`POST /api/admin/classes`)
   - Add a Section (`POST /api/admin/sections`)
   - Add a Subject (`POST /api/admin/subjects`)
   - Assign the Subject to the Class/Section (`POST /api/admin/subject-assignments`).

2. **User Onboarding (Admin)**
   - Bulk Upload Teachers via Excel. Verify duplicates are blocked.
   - Bulk Upload Students via Excel. Ensure they are mapped to the correct `class_id`.

3. **Academic Setup (Admin)**
   - Upload Master Timetable. 
   - *Negative Test*: Try to double-book a teacher. The system should throw a Conflict Error.
   - Assign syllabus plans via `Upload Syllabus`.

4. **Teacher Execution (Teacher)**
   - Login as the newly created Teacher.
   - Navigate to `My Schedule`.
   - Ensure the Timetable uploaded by the Admin appears here.
   - Update a topic as "Completed".

5. **Performance & Analytics Verification (Admin)**
   - Login as Admin.
   - Go to `Teacher Performance`.
   - Verify that the Syllabus Completion metric has increased from 0% based on the Teacher's action.

## 3. Module-Specific Test Cases

### Teacher Bulk Upload (`/api/teachers/bulk-upload`)
* **Positive**: Upload a valid Excel file with 5 new teachers. Expect success message and DB insertion.
* **Negative**: Upload file missing mandatory `Email` or `Password` columns. Expect Validation Error.
* **Edge Case**: Upload an Excel file containing an Email and Phone that already exists in the database. Expect specific conflict error message detailing the row number and the duplicate fields.

### Timetable Conflict Resolution
* **Positive**: Upload valid timetable.
* **Edge Case**: Upload timetable where Teacher A is scheduled in Grade 1 and Grade 2 for Period 1. Expect API to flag a `time_slot_id` conflict.

### Classroom Observations (`/api/observations`)
* **Positive**: Principal submits Observation with valid numbers (10/10/10/10/10). Expect total to equal 50.
* **Negative**: Try submitting text characters instead of numbers for scores. Expect validation failure.

### Performance Calculations
* **Positive**: Teacher completes 5/10 syllabus topics (50%), gets 40/50 in Observation (80%), and gets Exceeding (100%) in LO. 
  * Ensure the Overall Score strictly follows the weightage formula: `(Syll*0.15) + (LO*0.15) + (Obs*0.25) + Admin Overrides`.
* **Edge Case**: Calculate performance for a newly hired teacher who has NO observations and NO syllabus assigned. Ensure the system handles divide-by-zero gracefully and defaults scores to 0.

## 4. Permission & Security Testing
* **Negative Test (Authentication)**: Attempt to call `/api/admin/classes` without a JWT in the `Authorization` header. Expect 401 Unauthorized.
* **Negative Test (Authorization)**: Obtain a JWT by logging in as a `teacher`. Attempt to call `/api/admin/classes`. Expect 403 Forbidden because of the `roleCheck(['admin'])` middleware constraint.
* **Cross-Origin Testing**: Attempt to make API calls from `http://malicious-site.com`. Expect CORS block by the Express Server.
