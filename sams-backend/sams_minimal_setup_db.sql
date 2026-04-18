-- ⚠️ This file will create ALL tables (NO database creation included)
-- ⚠️ Only minimal data is inserted (login + few students)

SET FOREIGN_KEY_CHECKS = 0;

-- ================= USERS =================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','teacher') NOT NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================= CLASSES =================
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50),
    section VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================= SUBJECTS =================
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================= STUDENTS =================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    roll_no VARCHAR(20),
    class_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- ================= TEACHER SUBJECT =================
CREATE TABLE IF NOT EXISTS teacher_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    subject_id INT,
    class_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================= SYLLABUS =================
CREATE TABLE IF NOT EXISTS syllabus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT,
    subject_id INT,
    topic VARCHAR(255),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- ================= HOMEWORK =================
CREATE TABLE IF NOT EXISTS homework (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    class_id INT,
    subject_id INT,
    description TEXT,
    assigned_date DATE,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= HOMEWORK SUBMISSIONS =================
CREATE TABLE IF NOT EXISTS homework_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    homework_id INT,
    student_id INT,
    status ENUM('submitted','pending','late'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= LEARNING OUTCOMES =================
CREATE TABLE IF NOT EXISTS learning_outcomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    subject_id INT,
    topic VARCHAR(255),
    teacher_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= OBSERVATIONS =================
CREATE TABLE IF NOT EXISTS observations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    observed_by INT,
    total_score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= PERFORMANCE =================
CREATE TABLE IF NOT EXISTS performance_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    overall_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= LEAVE =================
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    type VARCHAR(50),
    from_date DATE,
    to_date DATE,
    status ENUM('Pending','Approved','Rejected'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SET FOREIGN_KEY_CHECKS = 1;

-- ================= MINIMAL DATA =================

-- USERS (LOGIN WORKING)
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@sams.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9l/5q5q5q5q5q5q5q5q5q', 'admin'),
('Teacher', 'teacher@sams.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9l/5q5q5q5q5q5q5q5q5q', 'teacher');

-- CLASS
INSERT INTO classes (class_name, section) VALUES
('Grade 8', 'A');

-- STUDENTS (ONLY 3)
INSERT INTO students (name, roll_no, class_id) VALUES
('Aarav Sharma','1',1),
('Ananya Patel','2',1),
('Rahul Verma','3',1);

-- SUBJECT
INSERT INTO subjects (name) VALUES
('Mathematics');

-- TEACHER MAPPING
INSERT INTO teacher_subjects (teacher_id, subject_id, class_id) VALUES
(2,1,1);