-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 12, 2026 at 09:39 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `atlas_sams_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_classes`
--

CREATE TABLE `academic_classes` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `class_number` varchar(20) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `class_category` varchar(30) NOT NULL DEFAULT 'primary',
  `description` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `academic_classes`
--

INSERT INTO `academic_classes` (`id`, `name`, `class_number`, `sort_order`, `class_category`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Class 1', '1', 0, 'primary', NULL, '2026-04-12 19:34:00.022', '2026-04-12 19:34:00.022');

-- --------------------------------------------------------

--
-- Table structure for table `acad_class_sections`
--

CREATE TABLE `acad_class_sections` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `stream_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `acad_class_sections`
--

INSERT INTO `acad_class_sections` (`id`, `class_id`, `section_id`, `stream_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NULL, '2026-04-12 19:34:39.850', '2026-04-12 19:34:39.850');

-- --------------------------------------------------------

--
-- Table structure for table `acad_class_streams`
--

CREATE TABLE `acad_class_streams` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `stream_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `acad_class_subjects`
--

CREATE TABLE `acad_class_subjects` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `stream_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `acad_class_subjects`
--

INSERT INTO `acad_class_subjects` (`id`, `class_id`, `subject_id`, `stream_id`, `created_at`, `updated_at`) VALUES
(1, 1, 3, NULL, '2026-04-12 19:34:44.200', '2026-04-12 19:34:44.200');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `class_name` varchar(50) NOT NULL,
  `section` varchar(10) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `class_name`, `section`, `created_at`, `updated_at`) VALUES
(15, '1', 'A', '2026-04-12 19:03:41.441', '2026-04-12 19:03:41.441'),
(16, '1', 'B', '2026-04-12 19:05:04.603', '2026-04-12 19:05:04.603');

-- --------------------------------------------------------

--
-- Table structure for table `homework`
--

CREATE TABLE `homework` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `description` text NOT NULL,
  `assigned_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `homework_submissions`
--

CREATE TABLE `homework_submissions` (
  `id` int(11) NOT NULL,
  `homework_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `status` enum('submitted','pending','late') NOT NULL DEFAULT 'submitted',
  `score` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `learning_outcomes`
--

CREATE TABLE `learning_outcomes` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `teacher_score` decimal(5,2) DEFAULT NULL,
  `principal_score` decimal(5,2) DEFAULT NULL,
  `status` enum('Approaching','Meeting','Exceeding') NOT NULL DEFAULT 'Meeting',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `from_date` date DEFAULT NULL,
  `to_date` date DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `applied_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `user_id`, `type`, `from_date`, `to_date`, `reason`, `status`, `applied_date`, `created_at`, `updated_at`) VALUES
(1, 2, 'Sick', '2024-01-10', '2024-01-11', NULL, 'Pending', '2026-04-07 23:02:41.000', '2026-04-07 23:02:41.000', '2026-04-07 23:02:41.000'),
(2, 5, 'Earned', '2024-02-05', '2024-02-07', 'Family function', 'Approved', '2026-04-09 04:10:01.666', '2026-04-09 04:10:01.666', '2026-04-09 04:10:01.666'),
(3, 4, 'Sick', '2024-01-10', '2024-01-11', 'High fever', 'Approved', '2026-04-09 04:10:01.666', '2026-04-09 04:10:01.666', '2026-04-09 04:10:01.666'),
(4, 3, 'Sick', '2024-01-20', '2024-01-22', 'Viral infection', 'Rejected', '2026-04-09 04:10:01.666', '2026-04-09 04:10:01.666', '2026-04-09 04:10:01.666'),
(5, 6, 'Half Day', '2024-02-02', '2024-02-02', 'Medical appointment', 'Approved', '2026-04-09 04:10:01.667', '2026-04-09 04:10:01.667', '2026-04-09 04:10:01.667'),
(6, 4, 'Casual', '2024-01-25', '2024-01-25', 'Personal work', 'Pending', '2026-04-09 04:10:01.666', '2026-04-09 04:10:01.666', '2026-04-09 04:10:01.666'),
(7, 2, 'Casual', '2024-02-14', '2024-02-15', 'Personal reasons', 'Pending', '2026-04-09 04:10:01.668', '2026-04-09 04:10:01.668', '2026-04-09 04:10:01.668');

-- --------------------------------------------------------

--
-- Table structure for table `observations`
--

CREATE TABLE `observations` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `observed_by` int(11) NOT NULL,
  `observation_date` date DEFAULT NULL,
  `total_score` int(11) DEFAULT NULL,
  `max_score` int(11) NOT NULL DEFAULT 50,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `observations`
--

INSERT INTO `observations` (`id`, `teacher_id`, `observed_by`, `observation_date`, `total_score`, `max_score`, `created_at`, `updated_at`) VALUES
(1, 2, 1, '2024-01-01', 40, 50, '2026-04-07 23:02:41.000', '2026-04-07 23:02:41.000'),
(2, 3, 1, '2024-01-12', 35, 50, '2026-04-09 04:10:01.637', '2026-04-09 04:10:01.637'),
(3, 5, 1, '2024-01-08', 45, 50, '2026-04-09 04:10:01.637', '2026-04-09 04:10:01.637'),
(4, 4, 1, '2024-01-05', 42, 50, '2026-04-09 04:10:01.637', '2026-04-09 04:10:01.637'),
(5, 4, 1, '2023-12-10', 38, 50, '2026-04-09 04:10:01.637', '2026-04-09 04:10:01.637'),
(6, 6, 1, '2024-01-15', 40, 50, '2026-04-09 04:10:01.637', '2026-04-09 04:10:01.637');

-- --------------------------------------------------------

--
-- Table structure for table `performance_scores`
--

CREATE TABLE `performance_scores` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `syllabus_completion_pct` decimal(5,2) DEFAULT NULL,
  `lo_avg_pct` decimal(5,2) DEFAULT NULL,
  `observation_pct` decimal(5,2) DEFAULT NULL,
  `other_score` decimal(5,2) DEFAULT NULL,
  `overall_score` decimal(5,2) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `performance_scores`
--

INSERT INTO `performance_scores` (`id`, `teacher_id`, `syllabus_completion_pct`, `lo_avg_pct`, `observation_pct`, `other_score`, `overall_score`, `created_at`, `updated_at`) VALUES
(1, 2, 50.00, 70.00, 80.00, 75.00, 71.75, '2026-04-07 23:02:41.000', '2026-04-09 04:10:01.747'),
(2, 5, 0.00, 0.00, 90.00, 75.00, 53.25, '2026-04-09 04:10:01.743', '2026-04-09 04:10:01.743'),
(3, 4, 50.00, 70.00, 80.00, 75.00, 71.75, '2026-04-09 04:10:01.744', '2026-04-09 04:10:01.744'),
(4, 6, 50.00, 70.00, 80.00, 75.00, 71.75, '2026-04-09 04:10:01.746', '2026-04-09 04:10:01.746'),
(5, 3, 50.00, 70.00, 70.00, 75.00, 68.75, '2026-04-09 04:10:01.745', '2026-04-09 04:10:01.745');

-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

CREATE TABLE `sections` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `code` varchar(10) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sections`
--

INSERT INTO `sections` (`id`, `name`, `code`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Section A', 'A', NULL, '2026-04-12 19:34:27.967', '2026-04-12 19:34:27.967');

-- --------------------------------------------------------

--
-- Table structure for table `streams`
--

CREATE TABLE `streams` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `roll_no` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `class_id` int(11) NOT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `name`, `created_at`, `updated_at`, `code`, `description`) VALUES
(3, 'English', '2026-04-07 23:02:41.000', '2026-04-12 19:35:00.136', 'Eng', '');

-- --------------------------------------------------------

--
-- Table structure for table `syllabus`
--

CREATE TABLE `syllabus` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `chapter` varchar(100) DEFAULT NULL,
  `topic` varchar(255) NOT NULL,
  `planned_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_subjects`
--

CREATE TABLE `teacher_subjects` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','teacher') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin@sams.com', '$2a$12$Y5F7zR7RRcwhN2GNr9M6gO2hJrPh0R7DcWB2g9WKzyOdkim2Ofk5m', 'admin', NULL, 'active', '2026-04-07 23:02:41.000', '2026-04-09 04:10:01.104'),
(2, 'Teacher One', 'teacher@sams.com', '$2a$12$pu4LkB.pewiYtRe7buz89OCm5AW61IHF91nH3mV7qhnum4dLMYmLO', 'teacher', NULL, 'active', '2026-04-07 23:02:41.000', '2026-04-09 04:10:01.125'),
(3, 'Ramesh Patel', 'ramesh@sams.com', '$2a$12$pu4LkB.pewiYtRe7buz89OCm5AW61IHF91nH3mV7qhnum4dLMYmLO', 'teacher', '9876543213', 'active', '2026-04-09 04:10:01.124', '2026-04-09 04:10:01.124'),
(4, 'Priya Sharma', 'priya@sams.com', '$2a$12$pu4LkB.pewiYtRe7buz89OCm5AW61IHF91nH3mV7qhnum4dLMYmLO', 'teacher', '9876543211', 'active', '2026-04-09 04:10:01.124', '2026-04-09 04:10:01.124'),
(5, 'Anjali Mehta', 'anjali@sams.com', '$2a$12$pu4LkB.pewiYtRe7buz89OCm5AW61IHF91nH3mV7qhnum4dLMYmLO', 'teacher', '9876543212', 'active', '2026-04-09 04:10:01.124', '2026-04-09 04:10:01.124'),
(6, 'Sunita Joshi', 'sunita@sams.com', '$2a$12$pu4LkB.pewiYtRe7buz89OCm5AW61IHF91nH3mV7qhnum4dLMYmLO', 'teacher', '9876543214', 'active', '2026-04-09 04:10:01.124', '2026-04-09 04:10:01.124');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_classes`
--
ALTER TABLE `academic_classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `academic_classes_name_key` (`name`);

--
-- Indexes for table `acad_class_sections`
--
ALTER TABLE `acad_class_sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `acad_class_sections_class_id_section_id_stream_id_key` (`class_id`,`section_id`,`stream_id`),
  ADD KEY `idx_acs_class` (`class_id`),
  ADD KEY `acad_class_sections_section_id_fkey` (`section_id`),
  ADD KEY `acad_class_sections_stream_id_fkey` (`stream_id`);

--
-- Indexes for table `acad_class_streams`
--
ALTER TABLE `acad_class_streams`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `acad_class_streams_class_id_stream_id_key` (`class_id`,`stream_id`),
  ADD KEY `acad_class_streams_stream_id_fkey` (`stream_id`);

--
-- Indexes for table `acad_class_subjects`
--
ALTER TABLE `acad_class_subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `acad_class_subjects_class_id_subject_id_stream_id_key` (`class_id`,`subject_id`,`stream_id`),
  ADD KEY `idx_acsub_class` (`class_id`),
  ADD KEY `acad_class_subjects_subject_id_fkey` (`subject_id`),
  ADD KEY `acad_class_subjects_stream_id_fkey` (`stream_id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `classes_class_name_section_key` (`class_name`,`section`);

--
-- Indexes for table `homework`
--
ALTER TABLE `homework`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hw` (`class_id`,`subject_id`,`teacher_id`),
  ADD KEY `homework_teacher_id_fkey` (`teacher_id`),
  ADD KEY `homework_subject_id_fkey` (`subject_id`);

--
-- Indexes for table `homework_submissions`
--
ALTER TABLE `homework_submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `homework_submissions_homework_id_student_id_key` (`homework_id`,`student_id`),
  ADD KEY `homework_submissions_student_id_fkey` (`student_id`);

--
-- Indexes for table `learning_outcomes`
--
ALTER TABLE `learning_outcomes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lo` (`student_id`,`subject_id`),
  ADD KEY `learning_outcomes_subject_id_fkey` (`subject_id`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_requests_user_id_fkey` (`user_id`);

--
-- Indexes for table `observations`
--
ALTER TABLE `observations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `observations_teacher_id_fkey` (`teacher_id`),
  ADD KEY `observations_observed_by_fkey` (`observed_by`);

--
-- Indexes for table `performance_scores`
--
ALTER TABLE `performance_scores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `performance_scores_teacher_id_key` (`teacher_id`);

--
-- Indexes for table `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sections_code_key` (`code`);

--
-- Indexes for table `streams`
--
ALTER TABLE `streams`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `streams_code_key` (`code`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `students_roll_no_class_id_key` (`roll_no`,`class_id`),
  ADD KEY `idx_student_class` (`class_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `subjects_name_key` (`name`);

--
-- Indexes for table `syllabus`
--
ALTER TABLE `syllabus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_syllabus` (`class_id`,`subject_id`),
  ADD KEY `syllabus_subject_id_fkey` (`subject_id`);

--
-- Indexes for table `teacher_subjects`
--
ALTER TABLE `teacher_subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teacher_subjects_teacher_id_subject_id_class_id_key` (`teacher_id`,`subject_id`,`class_id`),
  ADD KEY `idx_ts` (`teacher_id`,`subject_id`,`class_id`),
  ADD KEY `teacher_subjects_subject_id_fkey` (`subject_id`),
  ADD KEY `teacher_subjects_class_id_fkey` (`class_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`),
  ADD KEY `idx_user_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_classes`
--
ALTER TABLE `academic_classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `acad_class_sections`
--
ALTER TABLE `acad_class_sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `acad_class_streams`
--
ALTER TABLE `acad_class_streams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `acad_class_subjects`
--
ALTER TABLE `acad_class_subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `homework`
--
ALTER TABLE `homework`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `homework_submissions`
--
ALTER TABLE `homework_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `learning_outcomes`
--
ALTER TABLE `learning_outcomes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `observations`
--
ALTER TABLE `observations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `performance_scores`
--
ALTER TABLE `performance_scores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `sections`
--
ALTER TABLE `sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `streams`
--
ALTER TABLE `streams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `syllabus`
--
ALTER TABLE `syllabus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `teacher_subjects`
--
ALTER TABLE `teacher_subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `acad_class_sections`
--
ALTER TABLE `acad_class_sections`
  ADD CONSTRAINT `acad_class_sections_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `academic_classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `acad_class_sections_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `acad_class_sections_stream_id_fkey` FOREIGN KEY (`stream_id`) REFERENCES `streams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `acad_class_streams`
--
ALTER TABLE `acad_class_streams`
  ADD CONSTRAINT `acad_class_streams_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `academic_classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `acad_class_streams_stream_id_fkey` FOREIGN KEY (`stream_id`) REFERENCES `streams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `acad_class_subjects`
--
ALTER TABLE `acad_class_subjects`
  ADD CONSTRAINT `acad_class_subjects_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `academic_classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `acad_class_subjects_stream_id_fkey` FOREIGN KEY (`stream_id`) REFERENCES `streams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `acad_class_subjects_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `homework`
--
ALTER TABLE `homework`
  ADD CONSTRAINT `homework_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `homework_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `homework_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `homework_submissions`
--
ALTER TABLE `homework_submissions`
  ADD CONSTRAINT `homework_submissions_homework_id_fkey` FOREIGN KEY (`homework_id`) REFERENCES `homework` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `homework_submissions_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `learning_outcomes`
--
ALTER TABLE `learning_outcomes`
  ADD CONSTRAINT `learning_outcomes_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `learning_outcomes_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `observations`
--
ALTER TABLE `observations`
  ADD CONSTRAINT `observations_observed_by_fkey` FOREIGN KEY (`observed_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `observations_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `performance_scores`
--
ALTER TABLE `performance_scores`
  ADD CONSTRAINT `performance_scores_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `syllabus`
--
ALTER TABLE `syllabus`
  ADD CONSTRAINT `syllabus_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `syllabus_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `teacher_subjects`
--
ALTER TABLE `teacher_subjects`
  ADD CONSTRAINT `teacher_subjects_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_subjects_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_subjects_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
