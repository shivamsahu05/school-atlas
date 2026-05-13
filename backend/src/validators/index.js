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

// ─── Teachers ─────────────────────────────────────────────────────────────────
const createTeacherSchema = Joi.object({
  name:          Joi.string().min(2).max(100).required(),
  email:         Joi.string().email().required(),
  password:      Joi.string().min(6).required(),
  phone:         Joi.string().max(20).optional().allow(''),
  status:        Joi.string().valid('active', 'inactive').optional(),
  mobile:        Joi.string().max(20).optional().allow(''),
  dob:           Joi.string().max(20).optional().allow(''),
  qualification: Joi.string().max(255).optional().allow(''),
  experience:    Joi.string().max(50).optional().allow(''),
  salary:        Joi.string().max(50).optional().allow(''),
  subject:       Joi.string().max(100).optional().allow(''),
})

const updateTeacherSchema = Joi.object({
  name:          Joi.string().min(2).max(100).optional(),
  email:         Joi.string().email().optional(),
  password:      Joi.string().min(6).optional(),
  phone:         Joi.string().max(20).optional().allow(''),
  status:        Joi.string().valid('active', 'inactive').optional(),
  mobile:        Joi.string().max(20).optional().allow(''),
  dob:           Joi.string().max(20).optional().allow(''),
  qualification: Joi.string().max(255).optional().allow(''),
  experience:    Joi.string().max(50).optional().allow(''),
  salary:        Joi.string().max(50).optional().allow(''),
  subject:       Joi.string().max(100).optional().allow(''),
})

// ─── Students ─────────────────────────────────────────────────────────────────
const createStudentSchema = Joi.object({
  name:            Joi.string().min(2).max(100).required(),
  father_name:     Joi.string().max(100).required(),
  mobile:          Joi.string().max(20).required(),
  class_id:        Joi.number().integer().positive().required(),

  roll_no:         Joi.string().max(20).optional().allow(null, ''),
  email:           Joi.string().email().optional().allow(null, ''),
  class_name:      Joi.string().max(100).optional().allow(null, ''),
  section:         Joi.string().max(50).optional().allow(null, ''),
  section_id:      Joi.number().integer().positive().optional().allow(null, ''),
  gender:          Joi.string().valid('Male', 'Female', 'Other').optional().allow(null, ''),
  mother_name:     Joi.string().max(100).optional().allow(null, ''),
  optional_mobile: Joi.string().max(20).optional().allow(null, ''),
  address:         Joi.string().optional().allow(null, ''),
  dob:             Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional().allow(null, ''),
  remarks:         Joi.string().optional().allow(null, ''),
  status:          Joi.string().valid('Active', 'Blocked', 'Graduated', 'Failed', 'active', 'inactive').optional().allow(null, ''),
})

const updateStudentSchema = createStudentSchema.fork(
  ['name', 'father_name', 'mobile', 'class_id'], s => s.optional()
)

// ─── Syllabus ─────────────────────────────────────────────────────────────────
const createSyllabusSchema = Joi.object({
  // IDs (Preferred)
  class_id:            Joi.number().integer().positive().optional().allow('', null),
  subject_id:          Joi.number().integer().positive().optional().allow('', null),
  section_id:          Joi.number().integer().positive().optional().allow('', null),
  
  // Strings (Fallback/Alternative)
  class:               Joi.string().optional().allow('', null),
  subject:             Joi.string().optional().allow('', null),
  className:           Joi.string().optional().allow('', null),
  sectionName:         Joi.string().optional().allow('', null),
  
  // Fields
  chapter:             Joi.string().max(100).optional().allow(''),
  topic:               Joi.string().max(255).required(),
  week:                Joi.string().max(100).optional().allow('', null),
  
  // Date variations
  planned_start_date:  Joi.alternatives().try(Joi.date(), Joi.string()).optional().allow('', null),
  planned_end_date:    Joi.alternatives().try(Joi.date(), Joi.string()).optional().allow('', null),
  fromDate:            Joi.alternatives().try(Joi.date(), Joi.string()).optional().allow('', null),
  toDate:              Joi.alternatives().try(Joi.date(), Joi.string()).optional().allow('', null),
  
  completed_date:      Joi.alternatives().try(Joi.date(), Joi.string()).optional().allow('', null),
  is_completed:        Joi.boolean().optional(),
})

const updateSyllabusSchema = Joi.object({
  chapter:             Joi.string().max(100).optional().allow(''),
  topic:               Joi.string().max(255).optional(),
  planned_start_date:  Joi.date().iso().optional().allow('', null),
  planned_end_date:    Joi.date().iso().optional().allow('', null),
  completed_date:      Joi.date().iso().optional().allow('', null),
  is_completed:        Joi.boolean().optional(),
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
  createTeacherSchema, updateTeacherSchema,
  createStudentSchema, updateStudentSchema,
  createSyllabusSchema, updateSyllabusSchema,
  createHomeworkSchema,
  submitHomeworkSchema, updateSubmissionSchema,
  createLOSchema, updateLOSchema,
  createObsSchema,
  createLeaveSchema, updateLeaveSchema,
}
