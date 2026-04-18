// src/validators/index.js
const Joi = require('joi')

// ─── helper ──────────────────────────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true })
  if (error) {
    const messages = error.details.map(d => d.message.replace(/['"]/g, ''))
    return res.status(422).json({ success: false, message: 'Validation failed.', errors: messages })
  }
  next()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().min(6).required(),
})

// ─── Users ────────────────────────────────────────────────────────────────────
const createUserSchema = Joi.object({
  name:     Joi.string().min(2).max(100).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role:     Joi.string().valid('admin', 'teacher').required(),
  phone:    Joi.string().max(20).optional().allow(''),
  status:   Joi.string().valid('active', 'inactive').optional(),
})

const updateUserSchema = Joi.object({
  name:   Joi.string().min(2).max(100).optional(),
  email:  Joi.string().email().optional(),
  phone:  Joi.string().max(20).optional().allow(''),
  status: Joi.string().valid('active', 'inactive').optional(),
  password: Joi.string().min(6).optional(),
})

// ─── Students ─────────────────────────────────────────────────────────────────
const createStudentSchema = Joi.object({
  name:     Joi.string().min(2).max(100).required(),
  roll_no:  Joi.string().max(20).required(),
  email:    Joi.string().email().optional().allow(''),
  class_id: Joi.number().integer().positive().required(),
  gender:   Joi.string().valid('Male', 'Female', 'Other').optional(),
})

const updateStudentSchema = createStudentSchema.fork(
  ['name', 'roll_no', 'class_id'], s => s.optional()
)

// ─── Syllabus ─────────────────────────────────────────────────────────────────
const createSyllabusSchema = Joi.object({
  class_id:      Joi.number().integer().positive().required(),
  subject_id:    Joi.number().integer().positive().required(),
  chapter:       Joi.string().max(100).optional().allow(''),
  topic:         Joi.string().max(255).required(),
  planned_date:  Joi.date().iso().optional(),
  completed_date:Joi.date().iso().optional(),
  is_completed:  Joi.boolean().optional(),
})

const updateSyllabusSchema = Joi.object({
  chapter:       Joi.string().max(100).optional().allow(''),
  topic:         Joi.string().max(255).optional(),
  planned_date:  Joi.date().iso().optional(),
  completed_date:Joi.date().iso().optional(),
  is_completed:  Joi.boolean().optional(),
})

// ─── Homework ─────────────────────────────────────────────────────────────────
const createHomeworkSchema = Joi.object({
  class_id:      Joi.number().integer().positive().required(),
  subject_id:    Joi.number().integer().positive().required(),
  description:   Joi.string().required(),
  assigned_date: Joi.date().iso().optional(),
  due_date:      Joi.date().iso().optional(),
})

// ─── Homework Submission ───────────────────────────────────────────────────────
const submitHomeworkSchema = Joi.object({
  student_id: Joi.number().integer().positive().required(),
  score:      Joi.number().integer().min(0).max(100).optional(),
})

const updateSubmissionSchema = Joi.object({
  status: Joi.string().valid('submitted', 'pending', 'late').optional(),
  score:  Joi.number().integer().min(0).max(100).optional(),
})

// ─── Learning Outcomes ────────────────────────────────────────────────────────
const createLOSchema = Joi.object({
  student_id:      Joi.number().integer().positive().required(),
  subject_id:      Joi.number().integer().positive().required(),
  topic:           Joi.string().max(255).optional(),
  teacher_score:   Joi.number().min(0).max(10).optional(),
  principal_score: Joi.number().min(0).max(10).optional(),
  status:          Joi.string().valid('Approaching', 'Meeting', 'Exceeding').optional(),
})

const updateLOSchema = createLOSchema.fork(
  ['student_id', 'subject_id'], s => s.optional()
)

// ─── Observations ─────────────────────────────────────────────────────────────
const createObsSchema = Joi.object({
  teacher_id:       Joi.number().integer().positive().required(),
  observation_date: Joi.date().iso().optional(),
  total_score:      Joi.number().integer().min(0).max(50).required(),
  max_score:        Joi.number().integer().positive().optional(),
})

// ─── Leave ───────────────────────────────────────────────────────────────────
const createLeaveSchema = Joi.object({
  type:      Joi.string().max(50).required(),
  from_date: Joi.date().iso().required(),
  to_date:   Joi.date().iso().min(Joi.ref('from_date')).required(),
  reason:    Joi.string().optional().allow(''),
})

const updateLeaveSchema = Joi.object({
  status: Joi.string().valid('Approved', 'Rejected').required(),
})

module.exports = {
  validate,
  loginSchema,
  createUserSchema, updateUserSchema,
  createStudentSchema, updateStudentSchema,
  createSyllabusSchema, updateSyllabusSchema,
  createHomeworkSchema,
  submitHomeworkSchema, updateSubmissionSchema,
  createLOSchema, updateLOSchema,
  createObsSchema,
  createLeaveSchema, updateLeaveSchema,
}
