// src/controllers/classesController.js
const prisma = require('../config/db')
const { sendSuccess } = require('../utils/response')

/** GET /api/classes */
const getClasses = async (req, res) => {
  const classes = await prisma.classes.findMany({
    orderBy: [{ class_name: 'asc' }, { section: 'asc' }],
    include: { _count: { select: { students: true } } },
  })
  return sendSuccess(res, classes)
}

/** GET /api/subjects */
const getSubjects = async (req, res) => {
  const subjects = await prisma.subjects.findMany({ orderBy: { name: 'asc' } })
  return sendSuccess(res, subjects)
}

module.exports = { getClasses, getSubjects }
