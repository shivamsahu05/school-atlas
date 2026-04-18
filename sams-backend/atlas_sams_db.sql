CREATE DATABASE IF NOT EXISTS atlas_sams_db;
USE atlas_sams_db;

-- ================= USERS =================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','teacher') NOT NULL,
    phone VARCHAR(20),
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role)
);

-- ================= CLASSES =================
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(class_name, section)
);

-- ================= SUBJECTS =================
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================= STUDENTS =================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_no VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    class_id INT NOT NULL,
    gender ENUM('Male','Female','Other'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE (roll_no, class_id),
    INDEX idx_student_class (class_id)
);

-- ================= TEACHER SUBJECT =================
CREATE TABLE teacher_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE (teacher_id, subject_id, class_id),
    INDEX idx_ts (teacher_id, subject_id, class_id)
);

-- ================= SYLLABUS =================
CREATE TABLE syllabus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    chapter VARCHAR(100),
    topic VARCHAR(255) NOT NULL,
    planned_date DATE,
    completed_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_syllabus (class_id, subject_id)
);

-- ================= HOMEWORK =================
CREATE TABLE homework (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    description TEXT NOT NULL,
    assigned_date DATE,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_hw (class_id, subject_id, teacher_id)
);

-- ================= HOMEWORK SUBMISSIONS =================
CREATE TABLE homework_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    homework_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('submitted','pending','late') DEFAULT 'submitted',
    score INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(homework_id, student_id)
);

-- ================= LEARNING OUTCOMES =================
CREATE TABLE learning_outcomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    topic VARCHAR(255),
    teacher_score DECIMAL(5,2),
    principal_score DECIMAL(5,2),
    status ENUM('Approaching','Meeting','Exceeding') DEFAULT 'Meeting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_lo (student_id, subject_id)
);

-- ================= OBSERVATIONS =================
CREATE TABLE observations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    observed_by INT NOT NULL,
    observation_date DATE,
    total_score INT,
    max_score INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (observed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ================= PERFORMANCE =================
CREATE TABLE performance_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    syllabus_completion_pct DECIMAL(5,2),
    lo_avg_pct DECIMAL(5,2),
    observation_pct DECIMAL(5,2),
    other_score DECIMAL(5,2),
    overall_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (teacher_id)
);

-- ================= LEAVE =================
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50),
    from_date DATE,
    to_date DATE,
    reason TEXT,
    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================= DUMMY DATA =================

-- NOTE: bcrypt hash for password "Admin@123" and "Teacher@123"
INSERT INTO users (name, email, password, role) VALUES
('Admin', 'admin@sams.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9l/5q5q5q5q5q5q5q5q5q', 'admin'),
('Teacher One', 'teacher@sams.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9l/5q5q5q5q5q5q5q5q5q', 'teacher');

INSERT INTO classes (class_name, section) VALUES
('Grade 1','A'),('Grade 2','A'),('Grade 3','A'),('Grade 4','A'),('Grade 5','A'),
('Grade 6','A'),('Grade 7','A'),('Grade 8','A'),('Grade 9','A'),('Grade 10','A');

INSERT INTO subjects (name) VALUES
('Mathematics'),('Science'),('English'),('Hindi');

INSERT INTO students (name, roll_no, class_id) VALUES
('Student 1','1',1),('Student 2','2',1),('Student 3','3',2),('Student 4','4',2);

INSERT INTO teacher_subjects (teacher_id, subject_id, class_id) VALUES
(2,1,8),(2,2,8);

INSERT INTO syllabus (class_id, subject_id, topic, is_completed) VALUES
(8,1,'Algebra',1),(8,1,'Geometry',0);

INSERT INTO homework (teacher_id, class_id, subject_id, description, assigned_date, due_date) VALUES
(2,8,1,'Solve exercise 1','2024-01-01','2024-01-05');

INSERT INTO homework_submissions (homework_id, student_id, status) VALUES
(1,1,'submitted'),(1,2,'pending');

INSERT INTO learning_outcomes (student_id, subject_id, topic, teacher_score) VALUES
(1,1,'Algebra',8.5);

INSERT INTO observations (teacher_id, observed_by, observation_date, total_score) VALUES
(2,1,'2024-01-01',40);

INSERT INTO performance_scores (teacher_id, overall_score) VALUES
(2,85.5);

INSERT INTO leave_requests (user_id, type, from_date, to_date) VALUES
(2,'Sick','2024-01-10','2024-01-11');