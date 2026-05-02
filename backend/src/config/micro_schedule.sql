-- SQL to create micro_schedule table
CREATE TABLE IF NOT EXISTS `micro_schedule` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `teacher_id` INT NOT NULL,
  `class_number` VARCHAR(20) NOT NULL,
  `section` VARCHAR(10) NOT NULL,
  `subject_id` INT NOT NULL,
  `month` VARCHAR(50) NOT NULL,
  `week` VARCHAR(100) NOT NULL,
  `topic` TEXT,
  `periods_planned` INT DEFAULT 0,
  `periods_completed` INT DEFAULT 0,
  `learning_status` VARCHAR(50) DEFAULT 'Meeting',
  `homework` VARCHAR(50) DEFAULT 'Complete',
  `students_data` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
