-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 02, 2026 at 05:54 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

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
(4, 'Class 1', '1', 1, 'primary', NULL, '2026-04-28 06:36:29.664', '2026-04-28 06:36:29.664'),
(5, 'Class 2', '2', 0, 'primary', NULL, '2026-04-28 07:11:28.426', '2026-04-28 07:11:28.426'),
(6, 'Class 3', '3', 3, 'primary', NULL, '2026-04-30 05:11:44.150', '2026-04-30 05:11:44.150'),
(7, 'Class 4', '4', 4, 'primary', NULL, '2026-05-01 08:17:50.929', '2026-05-01 08:17:50.929');

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
(15, 4, 2, NULL, '2026-04-28 06:37:00.319', '2026-04-28 06:37:00.319'),
(16, 5, 2, NULL, '2026-04-28 07:11:34.684', '2026-04-28 07:11:34.684'),
(17, 6, 2, NULL, '2026-05-01 07:21:46.647', '2026-05-01 07:21:46.647'),
(18, 7, 2, NULL, '2026-05-01 08:20:53.030', '2026-05-01 08:20:53.030');

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
(16, 4, 8, NULL, '2026-04-28 06:37:16.601', '2026-04-28 06:37:16.601'),
(18, 4, 1, NULL, '2026-04-28 07:01:46.711', '2026-04-28 07:01:46.711'),
(19, 5, 5, NULL, '2026-04-28 07:11:39.779', '2026-04-28 07:11:39.779'),
(20, 5, 4, NULL, '2026-04-28 07:11:40.808', '2026-04-28 07:11:40.808'),
(21, 6, 4, NULL, '2026-04-30 05:11:54.382', '2026-04-30 05:11:54.382'),
(22, 6, 3, NULL, '2026-04-30 05:11:55.272', '2026-04-30 05:11:55.272'),
(23, 6, 8, NULL, '2026-04-30 05:11:56.176', '2026-04-30 05:11:56.176'),
(24, 6, 1, NULL, '2026-04-30 05:11:56.831', '2026-04-30 05:11:56.831'),
(25, 6, 5, NULL, '2026-04-30 05:11:57.742', '2026-04-30 05:11:57.742'),
(26, 6, 6, NULL, '2026-04-30 05:11:58.872', '2026-04-30 05:11:58.872'),
(27, 7, 7, NULL, '2026-05-01 08:17:57.964', '2026-05-01 08:17:57.964'),
(28, 7, 1, NULL, '2026-05-01 08:17:59.997', '2026-05-01 08:17:59.997');

-- --------------------------------------------------------

--
-- Table structure for table `acad_sections`
--

CREATE TABLE `acad_sections` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `code` varchar(10) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `acad_sections`
--

INSERT INTO `acad_sections` (`id`, `name`, `code`, `description`, `created_at`, `updated_at`) VALUES
(2, 'section A', 'A', NULL, '2026-04-28 06:08:29.248', '2026-04-28 06:08:29.248'),
(3, 'Section B', 'B', NULL, '2026-04-28 06:08:41.107', '2026-04-28 06:08:41.107');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` int(11) NOT NULL,
  `class_name` varchar(50) NOT NULL,
  `section` varchar(10) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `class_name`, `section`, `created_at`, `updated_at`) VALUES
(1, 'Class 1', 'section A', '2026-04-28 13:02:48.088', '2026-04-28 13:02:48.088'),
(2, 'Class 2', 'section A', '2026-04-28 13:03:13.472', '2026-04-28 13:03:13.472'),
(3, 'class 4', 'section A', '2026-05-01 14:56:05.481', '2026-05-01 14:56:05.481');

-- --------------------------------------------------------

--
-- Table structure for table `class_observations`
--

CREATE TABLE `class_observations` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `observer_id` int(11) DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `total_score` int(11) DEFAULT NULL,
  `content_mastery` int(11) DEFAULT NULL,
  `pedagogy` int(11) DEFAULT NULL,
  `student_engagement` int(11) DEFAULT NULL,
  `communication` int(11) DEFAULT NULL,
  `assessment` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `class_observations`
--

INSERT INTO `class_observations` (`id`, `teacher_id`, `observer_id`, `class_id`, `subject_id`, `total_score`, `content_mastery`, `pedagogy`, `student_engagement`, `communication`, `assessment`, `created_at`) VALUES
(1, 7, 1, NULL, NULL, 36, 5, 9, 8, 6, 8, '2026-04-24 22:21:07'),
(2, 3, 1, NULL, NULL, 36, 5, 10, 8, 7, 6, '2026-04-25 16:07:30'),
(3, 5, 1, NULL, NULL, 50, 10, 10, 10, 10, 10, '2026-05-01 23:37:43'),
(4, 6, 1, NULL, NULL, 50, 10, 10, 10, 10, 10, '2026-05-02 21:15:09'),
(5, 6, 1, NULL, NULL, 32, 5, 5, 5, 8, 9, '2026-05-02 21:16:18');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `status` varchar(20) DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `full_name`, `email`, `subject`, `message`, `status`, `created_at`) VALUES
(2, 'sks', 'test@gmail.com', 'test', 'hello', 'replied', '2026-04-27 16:09:49');

-- --------------------------------------------------------

--
-- Table structure for table `event_participants`
--

CREATE TABLE `event_participants` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `student_name` varchar(100) NOT NULL,
  `student_class` varchar(50) DEFAULT NULL,
  `roll_no` varchar(20) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_participants`
--

INSERT INTO `event_participants` (`id`, `event_id`, `student_name`, `student_class`, `roll_no`, `created_at`) VALUES
(1, 2, 'adsf', 'adf', 'asdf', '2026-05-01 17:11:46.528');

-- --------------------------------------------------------

--
-- Table structure for table `event_winners`
--

CREATE TABLE `event_winners` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `participant_id` int(11) NOT NULL,
  `position` enum('first','second','third') NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_winners`
--

INSERT INTO `event_winners` (`id`, `event_id`, `participant_id`, `position`, `remarks`, `created_at`) VALUES
(1, 2, 1, 'first', '', '2026-05-01 17:13:55.742');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `user_id`, `type`, `from_date`, `to_date`, `reason`, `status`, `applied_date`, `created_at`, `updated_at`) VALUES
(7, 7, 'Casual Leave', '2026-04-23', '2026-04-30', 'avdgv', 'Approved', '2026-04-19 12:30:32.861', '2026-04-19 12:30:32.861', '2026-05-01 19:20:37.268'),
(8, 6, 'Casual Leave', '2026-04-26', '2026-04-28', 'asdf', 'Approved', '2026-04-25 08:22:15.480', '2026-04-25 08:22:15.480', '2026-05-01 19:20:36.171'),
(9, 6, 'Casual Leave', '2026-04-28', '2026-04-28', 'asdf', 'Approved', '2026-04-27 16:11:21.671', '2026-04-27 16:11:21.671', '2026-05-01 19:20:34.397'),
(10, 6, 'Unpaid Leave', '2026-05-04', '2026-05-04', 'adsfasdf', 'Approved', '2026-05-01 18:53:32.324', '2026-05-01 18:53:32.324', '2026-05-01 19:20:33.084');

-- --------------------------------------------------------

--
-- Table structure for table `micro_schedule`
--

CREATE TABLE `micro_schedule` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `class_number` varchar(20) NOT NULL,
  `section` varchar(10) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `month` varchar(50) NOT NULL,
  `week` varchar(100) NOT NULL,
  `topic` text DEFAULT NULL,
  `periods_planned` int(11) DEFAULT 0,
  `periods_completed` int(11) DEFAULT 0,
  `learning_status` varchar(50) DEFAULT 'Meeting',
  `homework` varchar(50) DEFAULT 'Complete',
  `students_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`students_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `homework_status` enum('ASSIGNED','COMPLETED','PENDING') DEFAULT 'PENDING',
  `completed_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `micro_schedule`
--

INSERT INTO `micro_schedule` (`id`, `teacher_id`, `class_number`, `section`, `subject_id`, `month`, `week`, `topic`, `periods_planned`, `periods_completed`, `learning_status`, `homework`, `students_data`, `created_at`, `updated_at`, `homework_status`, `completed_at`) VALUES
(1, 6, '1', 'A', 5, 'May', 'All', 'abc', 2, 0, 'In Progress', 'Complete', NULL, '2026-05-01 07:48:36', '2026-05-01 07:48:36', 'PENDING', NULL),
(2, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 5, 0, 'Meeting', 'Incomplete', NULL, '2026-05-01 07:49:17', '2026-05-01 07:49:17', 'PENDING', NULL),
(3, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 5, 0, 'Meeting', 'Incomplete', NULL, '2026-05-01 07:49:25', '2026-05-01 07:49:25', 'PENDING', NULL),
(4, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 5, 0, 'Meeting', 'Incomplete', NULL, '2026-05-01 07:50:29', '2026-05-01 07:50:29', 'PENDING', NULL),
(5, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 5, 0, 'Meeting', 'Incomplete', NULL, '2026-05-01 07:53:42', '2026-05-01 07:53:42', 'PENDING', NULL),
(6, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 5, 0, 'Meeting', 'Complete', NULL, '2026-05-01 07:55:49', '2026-05-01 07:55:49', 'PENDING', NULL),
(7, 6, '1', 'A', 5, 'May', 'All', 'abc', 2, 0, 'Completed', 'Complete', NULL, '2026-05-01 07:57:36', '2026-05-01 07:57:36', 'PENDING', NULL),
(8, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 5, 0, 'Meeting', 'Complete', NULL, '2026-05-01 07:57:59', '2026-05-01 07:57:59', 'PENDING', NULL),
(9, 6, '1', 'A', 5, 'May', 'All', 'abc', 3, 0, 'In Progress', 'Complete', NULL, '2026-05-01 07:58:16', '2026-05-01 07:58:16', 'PENDING', NULL),
(10, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 0, 0, 'Meeting', 'Incomplete', NULL, '2026-05-01 07:58:45', '2026-05-01 07:58:45', 'PENDING', NULL),
(11, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 0, 0, 'Meeting', 'Incomplete', NULL, '2026-05-01 07:59:22', '2026-05-01 07:59:22', 'PENDING', NULL),
(12, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 0, 0, 'Meeting', 'Incomplete', NULL, '2026-05-01 08:00:02', '2026-05-01 08:00:02', 'PENDING', NULL),
(13, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 0, 0, 'Meeting', 'Incomplete', NULL, '2026-05-01 08:15:29', '2026-05-01 08:15:29', 'PENDING', NULL),
(14, 6, '3', 'A', 6, 'All', 'All', 'intoducessss adfadsfadsf', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 08:15:57', '2026-05-01 08:15:57', 'PENDING', NULL),
(15, 6, '4', 'A', 1, 'May', 'All', 'adsf', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 08:22:45', '2026-05-01 08:22:45', 'PENDING', NULL),
(16, 6, '4', 'A', 1, 'May', 'All', 'adsf', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 08:35:41', '2026-05-01 08:35:41', 'PENDING', NULL),
(17, 6, '2', 'A', 5, 'All', 'All', 'asdfasdflkh kladshfk asdfkljhadsfkahsdf', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 08:36:11', '2026-05-01 08:36:11', 'PENDING', NULL),
(18, 6, '4', 'A', 1, 'May', 'All', 'calculation', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 08:39:00', '2026-05-01 08:39:00', 'PENDING', NULL),
(19, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 2, 0, 'In Progress', 'Complete', NULL, '2026-05-01 14:38:47', '2026-05-01 14:38:47', 'PENDING', NULL),
(20, 6, '2', 'A', 5, 'All', 'All', 'asdfasdflkh kladshfk asdfkljhadsfkahsdf', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 15:01:28', '2026-05-01 15:01:28', 'PENDING', NULL),
(21, 6, '2', 'A', 6, 'April', 'All', 'akjsdfhaaaa', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 15:01:59', '2026-05-01 15:01:59', 'PENDING', NULL),
(22, 6, '2', 'A', 5, 'April', 'All', 'asdfasdflkh kladshfk asdfkljhadsfkahsdf', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 15:42:58', '2026-05-01 15:42:58', 'PENDING', NULL),
(23, 6, '1', 'A', 5, 'May', 'All', 'abc', 3, 0, 'Completed', 'Complete', NULL, '2026-05-01 15:49:47', '2026-05-01 15:49:47', 'PENDING', NULL),
(24, 6, '1', 'A', 5, 'May', 'All', 'abc', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 15:55:29', '2026-05-01 15:55:29', 'PENDING', NULL),
(33, 6, '1', 'A', 5, 'All', 'All', 'intoruction', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 16:07:12', '2026-05-01 16:07:12', 'PENDING', NULL),
(34, 6, '1', 'A', 5, 'All', 'All', 'intoruction', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 16:07:46', '2026-05-01 16:07:46', 'PENDING', NULL),
(35, 6, '2', 'A', 5, 'All', 'All', 'asdfasdflkh kladshfk asdfkljhadsfkahsdf', 0, 0, 'Meeting', 'Incomplete', NULL, '2026-05-01 16:12:02', '2026-05-01 16:12:02', 'PENDING', NULL),
(36, 6, '2', 'A', 5, 'April', 'All', 'asdfasdflkh kladshfk asdfkljhadsfkahsdf', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 16:12:44', '2026-05-01 16:12:44', 'PENDING', NULL),
(37, 6, '2', 'A', 5, 'April', 'All', 'asdfasdflkh kladshfk asdfkljhadsfkahsdf', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 16:13:26', '2026-05-01 16:13:26', 'PENDING', NULL),
(38, 6, '1', 'A', 5, 'All', 'All', 'intoruction', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 16:39:13', '2026-05-01 16:39:13', 'PENDING', NULL),
(39, 6, '1', 'A', 5, 'All', 'All', 'abc', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 16:39:13', '2026-05-01 16:39:13', 'PENDING', NULL),
(40, 6, '3', 'A', 6, 'All', 'All', 'intoducessss adfadsfadsf', 0, 0, 'In Progress', 'Complete', NULL, '2026-05-01 16:39:53', '2026-05-01 16:39:53', 'PENDING', NULL),
(41, 6, '3', 'A', 6, 'May', 'All', 'intoducessss adfadsfadsf', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 16:40:44', '2026-05-01 16:40:44', 'PENDING', NULL),
(42, 6, '1', 'A', 5, 'All', 'All', 'intoruction', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 18:21:32', '2026-05-01 18:21:32', 'PENDING', NULL),
(43, 6, '1', 'A', 5, 'All', 'All', 'abc', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 18:21:32', '2026-05-01 18:21:32', 'PENDING', NULL),
(44, 6, '1', 'A', 5, 'May', 'All', 'intoruction', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 18:22:14', '2026-05-01 18:22:14', 'PENDING', NULL),
(45, 6, '1', 'A', 5, 'May', 'All', 'abc', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 18:22:14', '2026-05-01 18:22:14', 'PENDING', NULL),
(46, 6, '1', 'A', 5, 'May', 'All', 'intoruction', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 18:22:23', '2026-05-01 18:22:23', 'PENDING', NULL),
(47, 6, '1', 'A', 5, 'May', 'All', 'abc', 0, 0, 'Completed', 'Incomplete', NULL, '2026-05-01 18:22:23', '2026-05-01 18:22:23', 'PENDING', NULL),
(48, 6, '1', 'A', 5, 'May', 'All', 'intoruction', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 18:22:27', '2026-05-01 18:22:27', 'PENDING', NULL),
(49, 6, '1', 'A', 5, 'May', 'All', 'abc', 0, 0, 'Completed', 'Incomplete', NULL, '2026-05-01 18:22:27', '2026-05-01 18:22:27', 'PENDING', NULL),
(50, 6, '1', 'A', 6, 'May', 'All', 'java', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 18:35:36', '2026-05-01 18:35:36', 'PENDING', NULL),
(51, 6, '1', 'A', 6, 'May', 'All', 'java', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 18:36:34', '2026-05-01 18:36:34', 'PENDING', NULL),
(52, 6, '1', 'A', 6, 'May', 'All', 'java', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 18:36:39', '2026-05-01 18:36:39', 'PENDING', NULL),
(53, 6, '1', 'A', 6, 'May', 'All', 'java', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 18:37:20', '2026-05-01 18:37:20', 'PENDING', NULL),
(54, 6, '1', 'A', 6, 'May', 'All', 'java', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 18:40:54', '2026-05-01 18:40:54', 'PENDING', NULL),
(55, 6, '1', 'A', 6, 'May', 'All', 'java', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 18:40:58', '2026-05-01 18:40:58', 'PENDING', NULL),
(56, 6, '1', 'A', 5, 'May', 'All', 'intoruction', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 18:41:46', '2026-05-01 18:41:46', 'PENDING', '2026-05-01'),
(57, 6, '1', 'A', 5, 'May', 'All', 'abc', 0, 0, 'Completed', 'Incomplete', NULL, '2026-05-01 18:41:46', '2026-05-01 18:41:46', 'PENDING', '2026-05-01'),
(58, 6, '1', 'A', 5, 'May', 'All', 'intoruction', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 18:41:54', '2026-05-01 18:41:54', 'PENDING', '2026-05-01'),
(59, 6, '1', 'A', 5, 'May', 'All', 'abc', 0, 0, 'Completed', 'Complete', NULL, '2026-05-01 18:41:54', '2026-05-01 18:41:54', 'PENDING', '2026-05-01'),
(60, 6, '1', 'A', 6, 'May', 'All', 'java', 0, 0, 'Meeting', 'Incomplete', NULL, '2026-05-01 18:42:18', '2026-05-01 18:42:18', 'PENDING', NULL),
(61, 6, '1', 'A', 6, 'May', 'All', 'java', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 18:42:45', '2026-05-01 18:42:45', 'PENDING', NULL),
(62, 6, '1', 'A', 6, 'May', 'All', 'java', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 18:44:39', '2026-05-01 18:44:39', 'PENDING', NULL),
(63, 6, '1', 'A', 6, 'May', 'All', 'java', 0, 0, 'In Progress', 'Complete', NULL, '2026-05-01 18:44:47', '2026-05-01 18:44:47', 'PENDING', NULL),
(64, 6, '2', 'A', 5, 'April', 'All', 'asdfasdflkh kladshfk asdfkljhadsfkahsdf', 0, 0, 'Meeting', 'Complete', NULL, '2026-05-01 18:52:42', '2026-05-01 18:52:42', 'PENDING', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `micro_schedule_student_status`
--

CREATE TABLE `micro_schedule_student_status` (
  `id` int(11) NOT NULL,
  `schedule_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `status` enum('PENDING','COMPLETED','NOT_SUBMITTED') DEFAULT 'PENDING',
  `submitted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `micro_schedule_student_status`
--

INSERT INTO `micro_schedule_student_status` (`id`, `schedule_id`, `student_id`, `status`, `submitted_at`) VALUES
(1, 1, 22, 'COMPLETED', NULL),
(2, 1, 24, 'COMPLETED', NULL),
(3, 2, 26, 'PENDING', NULL),
(4, 2, 26, 'COMPLETED', NULL),
(5, 2, 26, 'PENDING', NULL),
(6, 2, 26, 'COMPLETED', NULL),
(7, 2, 26, 'COMPLETED', NULL),
(8, 1, 22, 'COMPLETED', NULL),
(9, 1, 24, 'COMPLETED', NULL),
(10, 2, 26, 'COMPLETED', NULL),
(11, 1, 22, 'COMPLETED', NULL),
(12, 1, 24, 'COMPLETED', NULL),
(13, 2, 26, 'PENDING', NULL),
(14, 2, 26, 'COMPLETED', NULL),
(15, 2, 26, 'COMPLETED', NULL),
(16, 2, 26, 'COMPLETED', NULL),
(17, 14, 26, 'COMPLETED', NULL),
(18, 17, 25, 'COMPLETED', NULL),
(19, 2, 26, 'PENDING', NULL),
(20, 17, 25, 'COMPLETED', NULL),
(21, 21, 25, 'COMPLETED', NULL),
(22, 22, 25, 'COMPLETED', NULL),
(23, 1, 22, 'COMPLETED', NULL),
(24, 1, 24, 'COMPLETED', NULL),
(25, 1, 22, 'COMPLETED', NULL),
(26, 1, 24, 'COMPLETED', NULL),
(43, 33, 22, 'COMPLETED', NULL),
(44, 33, 24, 'COMPLETED', NULL),
(45, 33, 22, 'COMPLETED', NULL),
(46, 33, 24, 'COMPLETED', NULL),
(47, 17, 25, 'PENDING', NULL),
(48, 22, 25, 'PENDING', NULL),
(49, 22, 25, 'PENDING', NULL),
(50, 33, 22, 'COMPLETED', NULL),
(51, 33, 24, 'COMPLETED', NULL),
(52, 33, 22, 'COMPLETED', NULL),
(53, 33, 24, 'COMPLETED', NULL),
(54, 14, 26, 'PENDING', NULL),
(55, 2, 26, 'PENDING', NULL),
(56, 33, 22, 'PENDING', NULL),
(57, 33, 24, 'COMPLETED', NULL),
(58, 33, 22, 'COMPLETED', NULL),
(59, 33, 24, 'COMPLETED', NULL),
(60, 1, 22, 'PENDING', NULL),
(61, 1, 24, 'COMPLETED', NULL),
(62, 1, 22, 'PENDING', NULL),
(63, 1, 24, 'PENDING', NULL),
(64, 1, 22, 'PENDING', NULL),
(65, 1, 24, 'COMPLETED', NULL),
(66, 1, 22, 'PENDING', NULL),
(67, 1, 24, 'PENDING', NULL),
(68, 1, 22, 'PENDING', NULL),
(69, 1, 24, 'COMPLETED', NULL),
(70, 1, 22, 'PENDING', NULL),
(71, 1, 24, 'PENDING', NULL),
(72, 50, 22, 'PENDING', NULL),
(73, 50, 24, 'PENDING', NULL),
(74, 50, 22, 'PENDING', NULL),
(75, 50, 24, 'PENDING', NULL),
(76, 50, 22, 'PENDING', NULL),
(77, 50, 24, 'PENDING', NULL),
(78, 50, 22, 'PENDING', NULL),
(79, 50, 24, 'PENDING', NULL),
(80, 50, 22, 'PENDING', NULL),
(81, 50, 24, 'PENDING', NULL),
(82, 50, 22, 'PENDING', NULL),
(83, 50, 24, 'PENDING', NULL),
(84, 1, 22, 'PENDING', NULL),
(85, 1, 24, 'COMPLETED', NULL),
(86, 1, 22, 'PENDING', NULL),
(87, 1, 24, 'PENDING', NULL),
(88, 1, 22, 'PENDING', NULL),
(89, 1, 24, 'COMPLETED', NULL),
(90, 1, 22, 'PENDING', NULL),
(91, 1, 24, 'PENDING', NULL),
(92, 50, 22, 'COMPLETED', NULL),
(93, 50, 24, 'COMPLETED', NULL),
(94, 50, 22, 'COMPLETED', NULL),
(95, 50, 24, 'COMPLETED', NULL),
(96, 50, 22, 'COMPLETED', NULL),
(97, 50, 24, 'COMPLETED', NULL),
(98, 50, 22, 'COMPLETED', NULL),
(99, 50, 24, 'COMPLETED', NULL),
(100, 22, 25, 'PENDING', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `micro_schedule_tracking`
--

CREATE TABLE `micro_schedule_tracking` (
  `id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `class_number` varchar(50) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `section_name` varchar(50) DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `task_type` varchar(50) DEFAULT NULL,
  `topic` text DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tracking_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `micro_schedule_tracking`
--

INSERT INTO `micro_schedule_tracking` (`id`, `class_id`, `class_number`, `section_id`, `section_name`, `subject_id`, `student_id`, `teacher_id`, `task_type`, `topic`, `status`, `remarks`, `created_at`, `updated_at`, `tracking_date`) VALUES
(1, NULL, '1', NULL, 'A', 5, 22, 6, 'Homework', 'intoruction', 'NOT_COMPLETED', '', '2026-05-01 18:21:32', '2026-05-01 18:29:15', '2026-05-01'),
(3, NULL, '1', NULL, 'A', 5, 22, 6, 'Homework', 'abc', 'NOT_COMPLETED', '', '2026-05-01 18:22:14', '2026-05-01 18:29:15', '2026-05-01'),
(4, NULL, '1', NULL, 'A', 5, 24, 6, 'Homework', 'abc', 'NOT_COMPLETED', '', '2026-05-01 18:22:14', '2026-05-01 18:29:15', '2026-05-01'),
(11, 4, '1', 2, 'A', 6, 22, 6, 'Homework', 'java', 'COMPLETED', '', '2026-05-01 18:35:36', '2026-05-01 18:44:47', '2026-05-02'),
(12, 4, '1', 2, 'A', 6, 24, 6, 'Homework', 'java', 'COMPLETED', '', '2026-05-01 18:35:36', '2026-05-01 18:44:47', '2026-05-02'),
(23, 4, '1', 2, 'A', 5, 22, 6, 'Homework', 'intoruction', 'NOT_COMPLETED', '', '2026-05-01 18:41:46', '2026-05-01 18:41:54', '2026-05-02'),
(24, 4, '1', 2, 'A', 5, 22, 6, 'Homework', 'abc', 'NOT_COMPLETED', '', '2026-05-01 18:41:46', '2026-05-01 18:41:54', '2026-05-02'),
(25, 4, '1', 2, 'A', 5, 24, 6, 'Homework', 'abc', 'NOT_COMPLETED', '', '2026-05-01 18:41:46', '2026-05-01 18:41:54', '2026-05-02'),
(29, 5, '2', 2, 'A', 5, 25, 6, 'Homework', 'asdfasdflkh kladshfk asdfkljhadsfkahsdf', 'NOT_COMPLETED', '', '2026-05-01 18:52:42', '2026-05-01 18:52:42', '2026-05-02');

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id` int(11) NOT NULL,
  `module_key` varchar(100) NOT NULL,
  `module_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `modules`
--

INSERT INTO `modules` (`id`, `module_key`, `module_name`, `created_at`) VALUES
(1, 'SYLLABUS_UPLOAD', 'Syllabus Upload', '2026-04-25 08:34:54'),
(2, 'MARKS_ENTRY', 'Marks Entry', '2026-04-25 08:34:54'),
(3, 'HOMEWORK_ENTRY', 'Homework Entry', '2026-04-25 08:34:54'),
(4, 'LO_ENTRY', 'LO Entry', '2026-04-25 08:34:54'),
(5, 'MICRO_SCHEDULE', 'Micro Schedule', '2026-04-25 10:50:18'),
(6, 'students_management', 'Students Management', '2026-05-01 16:52:44');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `role_target` varchar(50) NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `group_key` varchar(100) DEFAULT NULL,
  `event_type` varchar(50) DEFAULT NULL,
  `target_user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `message`, `role_target`, `reference_id`, `status`, `is_read`, `created_at`, `updated_at`, `group_key`, `event_type`, `target_user_id`) VALUES
(1, 'leave', 'Your leave request has been approved', 'teacher', 9, 'pending', 0, '2026-05-01 19:19:18', '2026-05-01 19:19:18', 'leave-update-9', 'leave_approved', 6),
(2, 'leave', 'Your leave request has been rejected', 'teacher', 10, 'pending', 0, '2026-05-01 19:19:58', '2026-05-01 19:19:58', 'leave-update-10', 'leave_rejected', 6),
(3, 'leave', 'Your leave request has been rejected', 'teacher', 8, 'pending', 0, '2026-05-01 19:20:00', '2026-05-01 19:20:00', 'leave-update-8', 'leave_rejected', 6),
(4, 'leave', 'Your leave request has been rejected', 'teacher', 9, 'pending', 0, '2026-05-01 19:20:01', '2026-05-01 19:20:01', 'leave-update-9', 'leave_rejected', 6),
(5, 'leave', 'Your leave request has been approved', 'teacher', 10, 'pending', 0, '2026-05-01 19:20:33', '2026-05-01 19:20:33', 'leave-update-10', 'leave_approved', 6),
(6, 'leave', 'Your leave request has been approved', 'teacher', 8, 'pending', 0, '2026-05-01 19:20:36', '2026-05-01 19:20:36', 'leave-update-8', 'leave_approved', 6),
(7, 'leave', 'Your leave request has been approved', 'teacher', 7, 'pending', 0, '2026-05-01 19:20:37', '2026-05-01 19:20:37', 'leave-update-7', 'leave_approved', 7);

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
  `updated_at` datetime(3) NOT NULL,
  `criteria_scores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`criteria_scores`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `observations`
--

INSERT INTO `observations` (`id`, `teacher_id`, `observed_by`, `observation_date`, `total_score`, `max_score`, `created_at`, `updated_at`, `criteria_scores`) VALUES
(6, 7, 1, '2026-04-24', 36, 50, '2026-04-24 22:21:07.000', '2026-04-24 22:21:07.000', '[{\"name\":\"Content Mastery\",\"score\":5},{\"name\":\"Pedagogy\",\"score\":9},{\"name\":\"Student Engagement\",\"score\":8},{\"name\":\"Communication\",\"score\":6},{\"name\":\"Assessment\",\"score\":8}]'),
(7, 3, 1, '2026-04-25', 36, 50, '2026-04-25 16:07:30.000', '2026-04-25 16:07:30.000', '[{\"name\":\"Content Mastery\",\"score\":5},{\"name\":\"Pedagogy\",\"score\":10},{\"name\":\"Student Engagement\",\"score\":8},{\"name\":\"Communication\",\"score\":7},{\"name\":\"Assessment\",\"score\":6}]'),
(8, 5, 1, '2026-05-01', 50, 50, '2026-05-01 23:37:43.000', '2026-05-01 23:37:43.000', '[{\"name\":\"Content Mastery\",\"score\":10},{\"name\":\"Pedagogy\",\"score\":10},{\"name\":\"Student Engagement\",\"score\":10},{\"name\":\"Communication\",\"score\":10},{\"name\":\"Assessment\",\"score\":10}]');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `performance_scores`
--

INSERT INTO `performance_scores` (`id`, `teacher_id`, `syllabus_completion_pct`, `lo_avg_pct`, `observation_pct`, `other_score`, `overall_score`, `created_at`, `updated_at`) VALUES
(2, 5, 0.00, 0.00, 100.00, 75.00, 56.25, '2026-04-15 06:43:07.764', '2026-05-01 23:37:43.000'),
(3, 3, 0.00, 0.00, 72.00, 75.00, 47.85, '2026-04-15 06:43:07.764', '2026-04-25 16:07:30.000'),
(4, 6, 33.00, 0.00, 82.00, 75.00, 55.80, '2026-04-15 06:43:07.765', '2026-05-02 21:16:18.000'),
(5, 4, 50.00, 70.00, 70.00, 75.00, 68.75, '2026-04-15 06:43:07.764', '2026-04-15 06:43:07.764'),
(6, 7, 0.00, 0.00, 72.00, 75.00, 47.85, '2026-04-24 22:21:13.000', '2026-04-24 22:21:13.000');

-- --------------------------------------------------------

--
-- Table structure for table `school_events`
--

CREATE TABLE `school_events` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `event_type` enum('class','school','annual_sports') NOT NULL DEFAULT 'school',
  `target_class` varchar(100) DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed') NOT NULL DEFAULT 'upcoming',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `school_events`
--

INSERT INTO `school_events` (`id`, `title`, `description`, `event_date`, `location`, `event_type`, `target_class`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(2, 'abcd', 'shfefe', '2026-05-10', 'bnb', 'class', 'Class 1 - section A - cse', 'upcoming', 1, '2026-04-24 14:44:49.179', '2026-04-24 14:44:49.179');

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
  `class_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `address` text DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `father_name` varchar(100) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `mother_name` varchar(100) DEFAULT NULL,
  `optional_mobile` varchar(20) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('Active','Blocked','Graduated','Failed') NOT NULL DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `name`, `roll_no`, `email`, `class_id`, `section_id`, `gender`, `created_at`, `updated_at`, `address`, `dob`, `father_name`, `mobile`, `mother_name`, `optional_mobile`, `remarks`, `status`) VALUES
(22, 'dfv', '50', NULL, 4, 2, NULL, '2026-04-28 14:04:46.459', '2026-05-02 19:49:32.000', 'gher', '2026-05-02', 'cvbdfgb', '9966332211', 'fgbfh', NULL, 'ehf', 'Active'),
(24, 'aa', '55', NULL, 4, 2, 'Male', '2026-04-28 16:54:33.942', '0000-00-00 00:00:00.000', 'vn', '2026-04-21', 'fb', '8576383', 'aa', '453543', 'cbf', 'Active'),
(25, 'bbb', '34', NULL, 5, 2, 'Male', '2026-04-28 16:58:23.384', '0000-00-00 00:00:00.000', 'vbngbn', '2026-04-10', 'bb', '3544', 'bb', '456456', 'gnghng', 'Active'),
(26, 'sks', '20', NULL, 6, 2, 'Male', '2026-05-01 12:58:27.265', '0000-00-00 00:00:00.000', 'adsfadsf', '2026-05-08', 'asdf', '9109349392', 'asdf', NULL, NULL, 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `name`, `code`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Science', 'sc', NULL, '2026-04-15 06:43:07.676', '2026-04-15 06:43:07.676'),
(3, 'Mathematics', NULL, NULL, '2026-04-15 06:43:07.676', '2026-04-15 06:43:07.676'),
(4, 'Hindi', NULL, NULL, '2026-04-15 06:43:07.676', '2026-04-15 06:43:07.676'),
(5, 'English', 'eng', 'fdfv', '2026-04-15 06:43:07.676', '2026-04-16 07:20:28.452'),
(6, 'cse', 'cse', 'xn', '2026-04-17 17:59:26.139', '2026-04-17 17:59:26.139'),
(7, 'DSA', 'DSA', 'dsa', '2026-04-19 12:37:20.555', '2026-04-23 18:53:16.035'),
(8, 'Maths', 'Math', NULL, '2026-04-28 06:37:16.555', '2026-04-28 06:37:16.555');

-- --------------------------------------------------------

--
-- Table structure for table `syllabus`
--

CREATE TABLE `syllabus` (
  `id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) DEFAULT NULL,
  `subject_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `chapter` varchar(100) DEFAULT NULL,
  `topic` varchar(255) NOT NULL,
  `week` varchar(50) DEFAULT NULL,
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `periods` int(11) DEFAULT 0,
  `periods_needed` int(11) DEFAULT 0,
  `learning_status` varchar(50) DEFAULT 'Meeting',
  `notebook_checked` varchar(10) DEFAULT 'No',
  `learning_outcome` text DEFAULT NULL,
  `homework_status` varchar(50) DEFAULT 'Complete',
  `students_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`students_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `syllabus`
--

INSERT INTO `syllabus` (`id`, `class_id`, `section_id`, `subject_id`, `teacher_id`, `chapter`, `topic`, `week`, `planned_start_date`, `planned_end_date`, `completed_date`, `is_completed`, `status`, `created_at`, `updated_at`, `periods`, `periods_needed`, `learning_status`, `notebook_checked`, `learning_outcome`, `homework_status`, `students_data`) VALUES
(17, 4, 2, 1, 7, 'chapter 1', 'abcdnv', 'week 1', '2026-04-06', '2026-04-11', NULL, 0, 'pending', '2026-04-28 16:18:04.914', '2026-04-29 17:28:16.000', 0, 4, 'Meeting', 'Yes', '85', 'Incomplete', '[{\"id\":22,\"name\":\"dfv\",\"rollNumber\":\"50\",\"homework\":false,\"notebook\":true},{\"id\":24,\"name\":\"aa\",\"rollNumber\":\"55\",\"homework\":false,\"notebook\":true}]'),
(18, 4, 2, 1, 7, 'chapter 2', 'xyznvg', 'Week 2', '2026-04-13', '2026-04-18', '2026-04-17', 1, 'completed', '2026-04-28 16:26:38.615', '2026-04-29 16:56:32.000', 0, 0, 'Meeting', 'Yes', '89', 'Complete', '[{\"id\":22,\"name\":\"dfv\",\"rollNumber\":\"50\",\"homework\":false,\"notebook\":true},{\"id\":24,\"name\":\"aa\",\"rollNumber\":\"55\",\"homework\":false,\"notebook\":true}]'),
(19, 4, 2, 1, 7, 'chpter 3', 'qwer', 'Week 3', '2026-04-20', '2026-04-25', NULL, 0, 'pending', '2026-04-28 16:35:19.133', '2026-04-29 17:28:16.000', 0, 0, 'Meeting', 'Yes', '', 'Incomplete', '[{\"id\":22,\"name\":\"dfv\",\"rollNumber\":\"50\",\"homework\":false,\"notebook\":true},{\"id\":24,\"name\":\"aa\",\"rollNumber\":\"55\",\"homework\":false,\"notebook\":true}]'),
(20, 4, 2, 1, 7, 'chapter4', 'dfdgdf', 'week 4', '2026-04-27', '2026-05-02', '2026-04-28', 1, 'completed', '2026-04-28 17:49:22.930', '2026-04-29 17:28:00.000', 0, 0, 'Meeting', 'Yes', '', 'Complete', '[{\"id\":22,\"name\":\"dfv\",\"rollNumber\":\"50\",\"homework\":true,\"notebook\":true},{\"id\":24,\"name\":\"aa\",\"rollNumber\":\"55\",\"homework\":true,\"notebook\":true}]'),
(23, 4, 2, 8, 7, 'chapter 6', 'jgdys', 'week 6', '2026-05-04', '2026-05-09', NULL, 0, 'pending', '2026-04-29 15:25:32.819', '2026-04-29 15:57:09.000', 0, 0, 'Meeting', 'No', NULL, 'Complete', NULL),
(24, 5, 2, 5, 6, 'chapters all', 'asdfasdflkh kladshfk asdfkljhadsfkahsdf', 'week 4', '2026-04-27', '2026-05-02', NULL, 0, 'pending', '2026-04-30 17:55:00.249', '2026-05-02 00:22:42.000', 0, 0, 'Meeting', 'No', NULL, 'Complete', '[{\"id\":25,\"name\":\"bbb\",\"rollNumber\":\"34\",\"homework\":false,\"notebook\":true}]'),
(25, 5, 2, 6, 6, 'adfadf', 'akjsdfhaaaa', 'week 1', '2026-04-27', '2026-05-02', NULL, 0, 'pending', '2026-04-30 18:26:03.548', '2026-05-01 20:31:59.000', 0, 0, 'Meeting', 'No', NULL, 'Complete', '[{\"id\":25,\"name\":\"bbb\",\"rollNumber\":\"34\",\"homework\":true,\"notebook\":true}]'),
(26, 5, 2, 6, 6, 'unit 1', 'first topic introduction', 'week1', '2026-04-01', '2026-05-14', NULL, 0, 'pending', '2026-04-30 18:48:59.017', '2026-04-30 18:50:09.000', 0, 0, 'Meeting', 'No', NULL, 'Complete', NULL),
(27, 4, 2, 5, 6, 'unit 1', 'intoruction', 'week1', '2026-04-27', '2026-05-02', '2026-04-26', 1, 'completed', '2026-04-30 19:15:14.963', '2026-05-02 00:11:54.000', 0, 0, 'Completed', 'No', NULL, 'Complete', '[{\"id\":22,\"name\":\"dfv\",\"rollNumber\":\"50\",\"homework\":false,\"notebook\":true},{\"id\":24,\"name\":\"aa\",\"rollNumber\":\"55\",\"homework\":true,\"notebook\":true}]'),
(28, 4, 2, 5, 6, 'unit2', 'abc', 'week 2', '2026-05-03', '2026-05-09', '2026-04-25', 1, 'completed', '2026-05-01 12:18:58.279', '2026-05-02 00:11:54.000', 0, 0, 'Completed', 'No', NULL, 'Complete', '[{\"id\":22,\"name\":\"dfv\",\"rollNumber\":\"50\",\"homework\":false,\"notebook\":true},{\"id\":24,\"name\":\"aa\",\"rollNumber\":\"55\",\"homework\":false,\"notebook\":true}]'),
(29, 6, 2, 6, 6, 'unit1', 'intoducessss adfadsfadsf', 'week 1', '2026-05-03', '2026-05-08', '2026-05-01', 1, 'completed', '2026-05-01 12:55:54.886', '2026-05-01 22:10:44.000', 0, 0, 'Completed', 'No', NULL, 'Complete', '[{\"id\":26,\"name\":\"sks\",\"rollNumber\":\"20\",\"homework\":false,\"notebook\":true}]'),
(30, 7, 2, 1, 6, 'unit 1', 'adsf', 'week3', '2026-05-05', '2026-05-08', NULL, 0, 'pending', '2026-05-01 13:52:01.266', '2026-05-01 14:05:41.000', 0, 0, 'Meeting', 'No', NULL, 'Complete', '[]'),
(31, 7, 2, 1, 6, 'c program', 'calculation', 'week 4', '2026-05-22', '2026-05-29', NULL, 0, 'pending', '2026-05-01 14:07:23.962', '2026-05-01 14:09:00.000', 0, 0, 'Meeting', 'No', NULL, 'Complete', '[]'),
(32, 4, 2, 6, 6, 'unit5', 'java', 'week3', '2026-05-13', '2026-05-16', NULL, 0, 'in_progress', '2026-05-02 00:04:26.389', '2026-05-02 00:14:47.000', 0, 0, 'In Progress', 'No', NULL, 'Complete', '[{\"id\":22,\"name\":\"dfv\",\"rollNumber\":\"50\",\"homework\":true,\"notebook\":true},{\"id\":24,\"name\":\"aa\",\"rollNumber\":\"55\",\"homework\":true,\"notebook\":true}]'),
(33, 5, 2, 4, 1, 'aaa', 'ffff', NULL, '2026-05-04', '2026-05-05', NULL, 0, 'pending', '2026-05-02 20:45:43.772', '0000-00-00 00:00:00.000', 0, 0, 'Meeting', 'No', NULL, 'Complete', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `dob` varchar(20) DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `experience` varchar(50) DEFAULT NULL,
  `salary` varchar(50) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `status` enum('active','blocked') DEFAULT 'active',
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`id`, `user_id`, `mobile`, `dob`, `qualification`, `experience`, `salary`, `subject`, `joining_date`, `address`, `created_at`, `updated_at`, `status`, `is_deleted`) VALUES
(1, 7, '9876543212', '2001-05-10', 'M tech ', '3', '343434', 'Math', NULL, NULL, '2026-04-19 11:59:30.618', '2026-04-19 11:59:30.618', 'active', 0),
(3, 3, '9876543212', '', '', '0', '0', 'Mathematics', NULL, NULL, '2026-04-24 02:14:48.000', '2026-04-24 02:14:48.000', 'active', 1),
(4, 4, '9876543213', NULL, NULL, '0', '0', NULL, NULL, NULL, '2026-04-24 02:14:48.000', '2026-04-24 02:14:48.000', 'active', 0),
(5, 5, '9876543214', NULL, NULL, '0', '0', NULL, NULL, NULL, '2026-04-24 02:14:48.000', '2026-04-24 02:14:48.000', 'active', 0),
(6, 6, '9876543211', '2026-04-30', 'Msc', '5', '50000', 'English', NULL, NULL, '2026-04-24 02:14:48.000', '2026-04-24 02:14:48.000', 'active', 0);

-- --------------------------------------------------------

--
-- Table structure for table `teacher_class_assignments`
--

CREATE TABLE `teacher_class_assignments` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teacher_class_assignments`
--

INSERT INTO `teacher_class_assignments` (`id`, `teacher_id`, `class_id`, `section_id`, `academic_year`, `created_at`) VALUES
(1, 1, 13, 1, '2026-27', '2026-04-25 10:15:32'),
(2, 3, 12, 1, '2026-27', '2026-04-25 10:15:32'),
(3, 4, 11, 1, '2026-27', '2026-04-25 10:15:32'),
(4, 5, 13, 2, '2026-27', '2026-04-25 10:15:32');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_module_permissions`
--

CREATE TABLE `teacher_module_permissions` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `section_id` int(11) DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `module_id` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('ACTIVE','EXPIRED') DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teacher_module_permissions`
--

INSERT INTO `teacher_module_permissions` (`id`, `teacher_id`, `class_id`, `section_id`, `subject_id`, `module_id`, `start_date`, `end_date`, `status`, `created_at`) VALUES
(13, 1, 4, 15, 5, 1, '2026-04-28', '2026-04-29', 'EXPIRED', '2026-04-28 09:29:38'),
(14, 6, 5, 16, 6, 1, '2026-04-01', '2026-05-29', 'ACTIVE', '2026-04-30 12:12:55'),
(15, 6, 5, 16, 5, 1, '2026-04-01', '2026-05-29', 'ACTIVE', '2026-04-30 12:13:58'),
(16, 6, 5, 16, 6, 5, '2026-04-01', '2026-05-21', 'ACTIVE', '2026-04-30 13:31:42'),
(17, 6, 4, NULL, 5, 1, '2026-04-08', '2026-05-13', 'ACTIVE', '2026-04-30 13:44:07'),
(18, 6, 4, 15, 5, 2, '2026-04-16', '2026-06-25', 'ACTIVE', '2026-04-30 13:46:42'),
(19, 6, 4, 15, 5, 3, '2026-04-15', '2026-05-29', 'ACTIVE', '2026-04-30 13:47:12'),
(20, 6, 4, 15, 6, 4, '2026-04-15', '2026-05-28', 'ACTIVE', '2026-04-30 13:47:48'),
(21, 6, 4, NULL, 5, 5, '2026-04-15', '2026-06-17', 'ACTIVE', '2026-04-30 13:48:24'),
(22, 6, 4, 15, NULL, 5, '2026-04-09', '2026-05-21', 'ACTIVE', '2026-04-30 16:42:24'),
(23, 6, 6, 17, 6, 5, '2026-04-01', '2026-07-31', 'ACTIVE', '2026-05-01 07:24:15'),
(24, 6, 6, 17, 6, 1, '2026-03-03', '2026-06-18', 'ACTIVE', '2026-05-01 07:25:51'),
(25, 6, 7, NULL, 1, 1, '2026-04-01', '2026-06-05', 'ACTIVE', '2026-05-01 08:19:31'),
(26, 6, NULL, NULL, NULL, 6, '2026-04-01', '2026-06-10', 'ACTIVE', '2026-05-01 16:58:58'),
(27, 3, NULL, NULL, NULL, 6, '2026-04-01', '2026-08-28', 'ACTIVE', '2026-05-01 17:04:56'),
(28, 6, 4, NULL, 6, 1, '2026-05-01', '2026-07-03', 'ACTIVE', '2026-05-01 18:34:21');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_performance_lo`
--

CREATE TABLE `teacher_performance_lo` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `month` varchar(20) NOT NULL,
  `week` varchar(50) NOT NULL,
  `topic` varchar(255) NOT NULL,
  `teacher_score` decimal(5,2) DEFAULT NULL,
  `principal_score` decimal(5,2) DEFAULT NULL,
  `status` enum('Approaching','Meeting','Exceeding') NOT NULL DEFAULT 'Meeting',
  `remarks` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teacher_performance_lo`
--

INSERT INTO `teacher_performance_lo` (`id`, `teacher_id`, `class_id`, `subject_id`, `month`, `week`, `topic`, `teacher_score`, `principal_score`, `status`, `remarks`, `created_at`, `updated_at`) VALUES
(7, 1, 1, 8, 'April', 'Week 1', 'abcd', NULL, 80.00, '', NULL, '2026-04-28 13:02:48.095', '2026-04-28 13:02:48.095'),
(8, 6, 2, 4, 'April', 'Week 1', 'sdfdgdfb', NULL, 98.00, '', NULL, '2026-04-28 13:03:13.475', '2026-04-28 13:03:13.475'),
(9, 4, 2, 5, 'May', 'Week 2', 'topic', NULL, 80.00, '', NULL, '2026-04-30 09:53:51.186', '0000-00-00 00:00:00.000'),
(10, 6, 3, 1, 'May', 'Week 1', 'c program', NULL, 70.00, '', NULL, '2026-05-01 14:56:05.486', '0000-00-00 00:00:00.000'),
(11, 6, 3, 1, 'May', 'Week 1', 'adsf', NULL, 100.00, '', NULL, '2026-05-01 15:25:03.566', '0000-00-00 00:00:00.000');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_timetable`
--

CREATE TABLE `teacher_timetable` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `class_number` varchar(20) NOT NULL,
  `section` varchar(10) NOT NULL,
  `stream_id` int(11) DEFAULT NULL,
  `subject_id` int(11) NOT NULL,
  `time_slot_id` int(11) NOT NULL,
  `day_of_week` varchar(15) NOT NULL,
  `room_number` varchar(50) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `status` enum('Pending','In Progress','Completed') DEFAULT 'Pending',
  `students_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`students_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teacher_timetable`
--

INSERT INTO `teacher_timetable` (`id`, `teacher_id`, `class_number`, `section`, `stream_id`, `subject_id`, `time_slot_id`, `day_of_week`, `room_number`, `created_at`, `updated_at`, `topic`, `status`, `students_data`) VALUES
(23, 7, '1', 'A', NULL, 1, 5, 'MONDAY', NULL, '2026-04-28 10:02:30.730', '2026-04-28 10:02:30.730', NULL, 'Pending', NULL),
(25, 7, '1', 'A', NULL, 1, 8, 'TUESDAY', NULL, '2026-04-28 11:30:04.719', '2026-04-28 11:30:04.719', NULL, 'Pending', NULL),
(27, 7, '1', 'A', NULL, 1, 3, 'WEDNESDAY', NULL, '2026-04-28 11:30:40.952', '2026-04-28 11:30:40.952', NULL, 'Pending', NULL),
(28, 7, '1', 'A', NULL, 1, 6, 'THURSDAY', NULL, '2026-04-28 11:30:52.555', '2026-04-28 11:30:52.555', NULL, 'Pending', NULL),
(30, 7, '1', 'A', NULL, 1, 8, 'FRIDAY', NULL, '2026-04-28 11:39:20.853', '2026-04-28 11:39:25.602', NULL, 'Pending', NULL),
(31, 7, '1', 'A', NULL, 1, 5, 'SATURDAY', NULL, '2026-04-28 11:39:32.476', '2026-04-28 11:39:32.476', NULL, 'Pending', NULL),
(32, 7, '1', 'A', NULL, 8, 8, 'MONDAY', NULL, '2026-04-28 14:26:39.363', '2026-04-28 14:35:18.805', NULL, 'Pending', NULL),
(33, 7, '1', 'A', NULL, 8, 2, 'TUESDAY', NULL, '2026-04-28 14:26:47.168', '2026-04-28 14:35:23.113', NULL, 'Pending', NULL),
(34, 7, '1', 'A', NULL, 8, 1, 'WEDNESDAY', NULL, '2026-04-28 14:26:54.852', '2026-04-28 14:35:27.059', NULL, 'Pending', NULL),
(35, 7, '1', 'A', NULL, 8, 3, 'THURSDAY', NULL, '2026-04-28 14:27:01.319', '2026-04-28 14:35:31.203', NULL, 'Pending', NULL),
(36, 7, '1', 'A', NULL, 8, 5, 'FRIDAY', NULL, '2026-04-28 14:27:11.883', '2026-04-28 14:27:11.883', NULL, 'Pending', NULL),
(38, 5, '1', 'A', NULL, 1, 1, 'MONDAY', 'sdf', '2026-04-30 04:59:44.049', '2026-04-30 04:59:44.049', NULL, 'Pending', NULL),
(41, 6, '1', 'A', NULL, 8, 8, 'THURSDAY', NULL, '2026-04-30 05:00:21.882', '2026-04-30 05:00:21.882', NULL, 'Pending', NULL),
(42, 6, '1', 'A', NULL, 8, 2, 'FRIDAY', 'sdf', '2026-04-30 05:00:33.656', '2026-04-30 05:00:33.656', NULL, 'Pending', NULL),
(43, 6, '2', 'A', NULL, 5, 1, 'TUESDAY', 'test', '2026-04-30 05:09:36.670', '2026-04-30 05:09:36.670', NULL, 'Pending', NULL),
(44, 6, '1', 'A', NULL, 8, 8, 'WEDNESDAY', 'asdf', '2026-04-30 13:10:52.828', '2026-04-30 13:10:52.828', NULL, 'Pending', NULL),
(45, 6, '3', 'A', NULL, 6, 5, 'MONDAY', 'adf', '2026-05-01 07:23:23.491', '2026-05-01 07:23:23.491', NULL, 'Pending', NULL),
(46, 6, '4', 'A', NULL, 1, 2, 'TUESDAY', 'asdf', '2026-05-01 08:21:16.274', '2026-05-01 08:21:16.274', NULL, 'Pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `time_slots`
--

CREATE TABLE `time_slots` (
  `id` int(11) NOT NULL,
  `start_time` varchar(10) NOT NULL,
  `end_time` varchar(10) NOT NULL,
  `is_break` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `time_slots`
--

INSERT INTO `time_slots` (`id`, `start_time`, `end_time`, `is_break`, `created_at`, `updated_at`) VALUES
(1, '10:30', '11:00', 0, '2026-04-19 19:18:53.469', '2026-04-21 18:59:14.765'),
(2, '11:00', '11:30', 0, '2026-04-19 19:18:53.583', '2026-04-21 18:59:32.343'),
(3, '11:40', '00:00', 0, '2026-04-19 19:18:53.594', '2026-04-21 19:39:08.729'),
(4, '11:00', '11:30', 1, '2026-04-19 19:18:53.624', '2026-04-19 19:18:53.624'),
(5, '09:30', '10:00', 0, '2026-04-19 19:18:53.631', '2026-04-21 19:38:45.255'),
(6, '12:30', '13:00', 0, '2026-04-19 19:18:53.641', '2026-04-21 19:00:49.453'),
(8, '10:00', '10:30', 0, '2026-04-19 19:18:53.675', '2026-04-21 18:57:26.818'),
(11, '13:00', '13:30', 0, '2026-04-21 19:40:18.651', '2026-04-21 19:40:18.651'),
(12, '14:36', '15:37', 0, '2026-04-30 06:03:58.699', '2026-04-30 06:03:58.699');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Dr. Rajesh Kumar', 'admin@sams.com', '$2a$12$wQ9hFtB36ubAWA5B59.7yuzRUioyln1BRRHM31CTC0ghOlqTvMkXO', 'admin', '9876543210', 'active', '2026-04-15 06:43:07.649', '2026-04-15 06:43:07.649'),
(3, 'Priyansh', 'priyansh@sams.com', '$2a$12$eo38xpIzrv5VV4koK0w4V.f7DDbv6KNvY8KSJS0pm6G2QPQ67bPXS', 'teacher', '9876543212', 'active', '2026-04-15 06:43:07.660', '2026-04-15 06:43:07.660'),
(4, 'Ramesh Patel', 'ramesh@sams.com', '$2a$12$eo38xpIzrv5VV4koK0w4V.f7DDbv6KNvY8KSJS0pm6G2QPQ67bPXS', 'teacher', '9876543213', 'active', '2026-04-15 06:43:07.660', '2026-04-15 06:43:07.660'),
(5, 'Sunita Joshi', 'sunita@sams.com', '$2a$12$eo38xpIzrv5VV4koK0w4V.f7DDbv6KNvY8KSJS0pm6G2QPQ67bPXS', 'teacher', '9876543214', 'active', '2026-04-15 06:43:07.660', '2026-04-15 06:43:07.660'),
(6, 'Priya Sharma', 'priya@sams.com', '$2a$12$eo38xpIzrv5VV4koK0w4V.f7DDbv6KNvY8KSJS0pm6G2QPQ67bPXS', 'teacher', '9876543211', 'active', '2026-04-15 06:43:07.660', '2026-04-15 06:43:07.660'),
(7, 'nilu sir', 'nil@gmail.com', '$2a$12$6if6FMlG6rV9ytX9fk7aR.u/fRX7DxE9hkmZPhE0H1c14RkqiMFym', 'teacher', '9382472550', 'active', '2026-04-19 11:32:42.345', '2026-04-19 11:59:30.618');

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
  ADD KEY `acad_class_sections_stream_id_fkey` (`stream_id`),
  ADD KEY `acad_class_sections_section_id_fkey` (`section_id`);

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
-- Indexes for table `acad_sections`
--
ALTER TABLE `acad_sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `acad_sections_code_key` (`code`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `classes_class_name_section_key` (`class_name`,`section`);

--
-- Indexes for table `class_observations`
--
ALTER TABLE `class_observations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `event_participants`
--
ALTER TABLE `event_participants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ep_event` (`event_id`);

--
-- Indexes for table `event_winners`
--
ALTER TABLE `event_winners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `event_winners_event_id_position_key` (`event_id`,`position`),
  ADD KEY `idx_ew_event` (`event_id`),
  ADD KEY `event_winners_participant_id_fkey` (`participant_id`);

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
-- Indexes for table `micro_schedule`
--
ALTER TABLE `micro_schedule`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_micro_week` (`week`),
  ADD KEY `idx_micro_class` (`class_number`,`section`);

--
-- Indexes for table `micro_schedule_student_status`
--
ALTER TABLE `micro_schedule_student_status`
  ADD PRIMARY KEY (`id`),
  ADD KEY `schedule_id` (`schedule_id`);

--
-- Indexes for table `micro_schedule_tracking`
--
ALTER TABLE `micro_schedule_tracking`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tracking` (`student_id`,`subject_id`,`topic`(100),`tracking_date`,`task_type`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `module_key` (`module_key`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `school_events`
--
ALTER TABLE `school_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `school_events_created_by_fkey` (`created_by`);

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
  ADD UNIQUE KEY `unique_roll_class` (`class_id`,`roll_no`),
  ADD KEY `idx_student_class` (`class_id`),
  ADD KEY `fk_student_section` (`section_id`);

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
  ADD UNIQUE KEY `unique_syllabus` (`class_id`,`section_id`,`subject_id`,`week`,`topic`),
  ADD KEY `idx_syllabus` (`class_id`,`subject_id`),
  ADD KEY `syllabus_subject_id_fkey` (`subject_id`),
  ADD KEY `fk_syllabus_section` (`section_id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teachers_user_id_key` (`user_id`);

--
-- Indexes for table `teacher_class_assignments`
--
ALTER TABLE `teacher_class_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_assignment` (`teacher_id`,`class_id`,`section_id`),
  ADD KEY `idx_teacher` (`teacher_id`),
  ADD KEY `idx_class` (`class_id`);

--
-- Indexes for table `teacher_module_permissions`
--
ALTER TABLE `teacher_module_permissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `fk_permission_module` (`module_id`);

--
-- Indexes for table `teacher_performance_lo`
--
ALTER TABLE `teacher_performance_lo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tlo_teacher_month` (`teacher_id`,`month`),
  ADD KEY `teacher_performance_lo_class_id_fkey` (`class_id`),
  ADD KEY `teacher_performance_lo_subject_id_fkey` (`subject_id`);

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
-- Indexes for table `teacher_timetable`
--
ALTER TABLE `teacher_timetable`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teacher_timetable_teacher_id_day_of_week_time_slot_id_key` (`teacher_id`,`day_of_week`,`time_slot_id`),
  ADD UNIQUE KEY `teacher_timetable_class_number_section_day_of_week_time_slot_key` (`class_number`,`section`,`day_of_week`,`time_slot_id`),
  ADD KEY `teacher_timetable_time_slot_id_fkey` (`time_slot_id`),
  ADD KEY `teacher_timetable_subject_id_fkey` (`subject_id`),
  ADD KEY `teacher_timetable_stream_id_fkey` (`stream_id`);

--
-- Indexes for table `time_slots`
--
ALTER TABLE `time_slots`
  ADD PRIMARY KEY (`id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `acad_class_sections`
--
ALTER TABLE `acad_class_sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `acad_class_streams`
--
ALTER TABLE `acad_class_streams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `acad_class_subjects`
--
ALTER TABLE `acad_class_subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `acad_sections`
--
ALTER TABLE `acad_sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `class_observations`
--
ALTER TABLE `class_observations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `event_participants`
--
ALTER TABLE `event_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `event_winners`
--
ALTER TABLE `event_winners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `homework`
--
ALTER TABLE `homework`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `homework_submissions`
--
ALTER TABLE `homework_submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `learning_outcomes`
--
ALTER TABLE `learning_outcomes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `micro_schedule`
--
ALTER TABLE `micro_schedule`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `micro_schedule_student_status`
--
ALTER TABLE `micro_schedule_student_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `micro_schedule_tracking`
--
ALTER TABLE `micro_schedule_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `modules`
--
ALTER TABLE `modules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `observations`
--
ALTER TABLE `observations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `performance_scores`
--
ALTER TABLE `performance_scores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `school_events`
--
ALTER TABLE `school_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `streams`
--
ALTER TABLE `streams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `syllabus`
--
ALTER TABLE `syllabus`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `teacher_class_assignments`
--
ALTER TABLE `teacher_class_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `teacher_module_permissions`
--
ALTER TABLE `teacher_module_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `teacher_performance_lo`
--
ALTER TABLE `teacher_performance_lo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `teacher_subjects`
--
ALTER TABLE `teacher_subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `teacher_timetable`
--
ALTER TABLE `teacher_timetable`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `time_slots`
--
ALTER TABLE `time_slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `acad_class_sections`
--
ALTER TABLE `acad_class_sections`
  ADD CONSTRAINT `acad_class_sections_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `academic_classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `acad_class_sections_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `acad_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
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
-- Constraints for table `event_participants`
--
ALTER TABLE `event_participants`
  ADD CONSTRAINT `event_participants_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `school_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `event_winners`
--
ALTER TABLE `event_winners`
  ADD CONSTRAINT `event_winners_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `school_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `event_winners_participant_id_fkey` FOREIGN KEY (`participant_id`) REFERENCES `event_participants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
-- Constraints for table `micro_schedule_student_status`
--
ALTER TABLE `micro_schedule_student_status`
  ADD CONSTRAINT `micro_schedule_student_status_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `micro_schedule` (`id`);

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
-- Constraints for table `school_events`
--
ALTER TABLE `school_events`
  ADD CONSTRAINT `school_events_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_student_class` FOREIGN KEY (`class_id`) REFERENCES `academic_classes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_student_section` FOREIGN KEY (`section_id`) REFERENCES `acad_sections` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `syllabus`
--
ALTER TABLE `syllabus`
  ADD CONSTRAINT `fk_syllabus_class` FOREIGN KEY (`class_id`) REFERENCES `academic_classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_syllabus_section` FOREIGN KEY (`section_id`) REFERENCES `acad_sections` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `syllabus_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `teachers`
--
ALTER TABLE `teachers`
  ADD CONSTRAINT `teachers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `teacher_module_permissions`
--
ALTER TABLE `teacher_module_permissions`
  ADD CONSTRAINT `fk_perm_class` FOREIGN KEY (`class_id`) REFERENCES `academic_classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_permission_module` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`),
  ADD CONSTRAINT `teacher_module_permissions_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`),
  ADD CONSTRAINT `teacher_module_permissions_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`);

--
-- Constraints for table `teacher_performance_lo`
--
ALTER TABLE `teacher_performance_lo`
  ADD CONSTRAINT `teacher_performance_lo_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_performance_lo_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_performance_lo_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `teacher_subjects`
--
ALTER TABLE `teacher_subjects`
  ADD CONSTRAINT `teacher_subjects_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_subjects_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_subjects_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `teacher_timetable`
--
ALTER TABLE `teacher_timetable`
  ADD CONSTRAINT `teacher_timetable_stream_id_fkey` FOREIGN KEY (`stream_id`) REFERENCES `streams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_timetable_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `teacher_timetable_time_slot_id_fkey` FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
