/**
 * SAMS DATABASE UPGRADE PATCH (FINAL CLEAN VERSION)
 * Target: atlas_sams_db (Existing Production Database)
 * RULE: NO DROP, NO ALTER BREAKING, ONLY SAFE ADDITIONS
 */

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. USERS TABLE ENHANCEMENT (SAFE ADD ONLY)
-- =============================================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS department VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS qualification TEXT NULL,
ADD COLUMN IF NOT EXISTS experience VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS join_date DATE NULL;

-- Safe index (MySQL 8+ supports IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);

-- Auto-fill employee_code if empty (safe backfill)
UPDATE users
SET employee_code = CONCAT('EMP-', id)
WHERE employee_code IS NULL OR employee_code = '';

-- =============================================================================
-- 2. STUDENTS TABLE ENHANCEMENT
-- =============================================================================
ALTER TABLE students
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS dob_month INT NULL,
ADD COLUMN IF NOT EXISTS dob_day INT NULL,
ADD COLUMN IF NOT EXISTS gender ENUM('Male','Female','Other') NULL;

-- Backfill gender safely
UPDATE students
SET gender = 'Male'
WHERE gender IS NULL;

-- =============================================================================
-- 3. SYLLABUS TABLE ENHANCEMENT
-- =============================================================================
ALTER TABLE syllabus
ADD COLUMN IF NOT EXISTS teacher_id INT NULL,
ADD COLUMN IF NOT EXISTS unit VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS week_no INT NULL,
ADD COLUMN IF NOT EXISTS status ENUM('pending','completed') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS planned_date DATE NULL,
ADD COLUMN IF NOT EXISTS completed_date DATE NULL;

-- =============================================================================
-- 4. HOMEWORK TABLE ENHANCEMENT
-- =============================================================================
ALTER TABLE homework
ADD COLUMN IF NOT EXISTS type ENUM('Homework','Notebook','Exam') DEFAULT 'Homework',
ADD COLUMN IF NOT EXISTS status ENUM('Pending','Completed') DEFAULT 'Pending';

-- =============================================================================
-- 5. LEARNING OUTCOMES TABLE ENHANCEMENT
-- =============================================================================
ALTER TABLE learning_outcomes
ADD COLUMN IF NOT EXISTS teacher_id INT NULL,
ADD COLUMN IF NOT EXISTS class_id INT NULL,
ADD COLUMN IF NOT EXISTS principal_score DECIMAL(5,2) NULL;

-- =============================================================================
-- 6. PERMISSIONS TABLE (NEW SAFE TABLE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    module ENUM('syllabus','homework','lo','marks') NOT NULL,
    action VARCHAR(100),
    class_id INT,
    subject_id INT,
    start_date DATE,
    end_date DATE,
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT TRUE,
    can_upload BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- 7. SCHEDULE TABLE (NEW)
-- =============================================================================
CREATE TABLE IF NOT EXISTS schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    day ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
    period_no INT NOT NULL,
    time_slot VARCHAR(50),
    class_id INT,
    subject_id INT,
    topic TEXT,
    status ENUM('pending','completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- 8. NOTIFICATIONS TABLE (NEW)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('homework','syllabus','leave','permission','birthday') NOT NULL,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- 9. INDEXING (PERFORMANCE SAFE)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_class_subject ON homework(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_class_subject ON syllabus(class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_requests(user_id);

-- =============================================================================
-- 10. SAFE SAMPLE DATA (NO DUPLICATES)
-- =============================================================================

-- Teachers enrichment
UPDATE users
SET department = 'Mathematics'
WHERE id = 2 AND department IS NULL;

-- Sample teacher inserts (safe)
INSERT IGNORE INTO users (name, email, password, role, employee_code, department)
VALUES
('Anjali Mehta', 'anjali@school.edu', 'hash', 'teacher', 'EMP-T002', 'Science'),
('Ramesh Patel', 'ramesh@school.edu', 'hash', 'teacher', 'EMP-T003', 'English');

-- Student enrichment
UPDATE students
SET mobile = '9999999999'
WHERE mobile IS NULL AND id = 1;

-- Sample syllabus (safe insert)
INSERT IGNORE INTO syllabus (class_id, subject_id, teacher_id, topic, unit, week_no, status, planned_date)
VALUES
(1, 1, 2, 'Rational Numbers', 'Unit 1', 1, 'completed', '2024-01-07'),
(1, 1, 2, 'Powers and Exponents', 'Unit 1', 2, 'completed', '2024-01-14'),
(1, 1, 2, 'Linear Equations', 'Unit 2', 3, 'pending', '2024-01-21');

-- Permissions sample
INSERT IGNORE INTO permissions (teacher_id, module, action, class_id, subject_id, start_date, end_date)
VALUES
(2, 'lo', 'LO Entry', 1, 1, '2024-01-01', '2024-12-31'),
(2, 'marks', 'Marks Entry', 1, 1, '2023-01-01', '2023-12-31');

-- Schedule sample
INSERT IGNORE INTO schedule (teacher_id, day, period_no, time_slot, class_id, subject_id, topic, status)
VALUES
(2, 'Monday', 1, '8:00-8:45', 1, 1, 'Linear Equations Review', 'completed'),
(2, 'Monday', 2, '8:45-9:30', 1, 1, 'Quadratic Formula', 'completed'),
(2, 'Wednesday', 4, '10:30-11:15', 1, 1, 'Exponents', 'pending');

-- LO sample (safe)
INSERT IGNORE INTO learning_outcomes (teacher_id, student_id, class_id, subject_id, topic, teacher_score, principal_score)
VALUES
(2, 1, 1, 1, 'Linear Equations', 8.5, 8.0),
(2, 2, 1, 1, 'Linear Equations', 7.0, 7.5);

SET FOREIGN_KEY_CHECKS = 1;