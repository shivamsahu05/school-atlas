-- ⚠️ WARNING: THIS WILL DROP ALL TABLES IN atlas_sams_db DATABASE

USE atlas_sams_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS 
homework_submissions,
learning_outcomes,
performance_scores,
observations,
leave_requests,
homework,
syllabus,
teacher_subjects,
students,
subjects,
classes,
users;

SET FOREIGN_KEY_CHECKS = 1;