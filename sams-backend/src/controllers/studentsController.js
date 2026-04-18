// src/controllers/studentsController.js
const prisma   = require('../config/db')
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const INCLUDE_CLASS = { class: { select: { id: true, class_name: true, section: true } } }

/** GET /api/students */
const getStudents = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const { class_id, search } = req.query

  const where = {}
  if (class_id) where.class_id = Number(class_id)
  if (search)   where.name = { contains: search }

  const [students, total] = await prisma.$transaction([
    prisma.students.findMany({
      where, skip, take,
      include:  INCLUDE_CLASS,
      orderBy: [{ class_id: 'asc' }, { roll_no: 'asc' }],
    }),
    prisma.students.count({ where }),
  ])

  return sendSuccess(res, paginated(students, total, page, limit))
}

/** GET /api/students/:id */
const getStudentById = async (req, res) => {
  const student = await prisma.students.findUnique({
    where:   { id: Number(req.params.id) },
    include: INCLUDE_CLASS,
  })
  if (!student) return sendError(res, 'Student not found.', 404)
  return sendSuccess(res, student)
}

/** POST /api/students */
const createStudent = async (req, res) => {
  const { name, roll_no, email, class_id, gender } = req.body

  const exists = await prisma.students.findFirst({
    where: { roll_no, class_id: Number(class_id) },
  })
  if (exists) return sendError(res, 'Roll number already exists in this class.', 409)

  const student = await prisma.students.create({
    data:    { name, roll_no, email, class_id: Number(class_id), gender },
    include: INCLUDE_CLASS,
  })
  return sendSuccess(res, student, 'Student created successfully.', 201)
}

/** PUT /api/students/:id */
const updateStudent = async (req, res) => {
  const id   = Number(req.params.id)
  const data = { ...req.body }
  if (data.class_id) data.class_id = Number(data.class_id)

  const student = await prisma.students.update({
    where:   { id },
    data,
    include: INCLUDE_CLASS,
  })
  return sendSuccess(res, student, 'Student updated successfully.')
}

/** DELETE /api/students/:id */
const deleteStudent = async (req, res) => {
  await prisma.students.delete({ where: { id: Number(req.params.id) } })
  return sendSuccess(res, null, 'Student deleted successfully.')
}

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent }
