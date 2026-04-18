// src/controllers/classesController.js
const prisma = require('../config/db')
<<<<<<< HEAD
const { sendSuccess, sendError } = require('../utils/response')

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSES  (class_name + section combos)
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/classes — all class-section combos with student count */
=======
const { sendSuccess } = require('../utils/response')

/** GET /api/classes */
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
const getClasses = async (req, res) => {
  const classes = await prisma.classes.findMany({
    orderBy: [{ class_name: 'asc' }, { section: 'asc' }],
    include: { _count: { select: { students: true } } },
  })
  return sendSuccess(res, classes)
}

<<<<<<< HEAD
/** POST /api/classes — create a class-section combo */
const createClass = async (req, res) => {
  const { class_name, section } = req.body
  if (!class_name || !section) {
    return sendError(res, 'class_name and section are required.', 400)
  }

  const exists = await prisma.classes.findFirst({
    where: { class_name: class_name.trim(), section: section.trim() },
  })
  if (exists) {
    return sendError(res, `Class "${class_name} - ${section}" already exists.`, 409)
  }

  const created = await prisma.classes.create({
    data: { class_name: class_name.trim(), section: section.trim() },
  })
  return sendSuccess(res, created, 'Class created successfully.', 201)
}

/** PUT /api/classes/:id */
const updateClass = async (req, res) => {
  const { id } = req.params
  const { class_name, section } = req.body

  const existing = await prisma.classes.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Class not found.', 404)

  if (class_name && section) {
    const dup = await prisma.classes.findFirst({
      where: { class_name, section, NOT: { id: Number(id) } },
    })
    if (dup) return sendError(res, `Class "${class_name} - ${section}" already exists.`, 409)
  }

  const updated = await prisma.classes.update({
    where: { id: Number(id) },
    data: { ...(class_name && { class_name }), ...(section && { section }) },
  })
  return sendSuccess(res, updated, 'Class updated successfully.')
}

/** DELETE /api/classes/:id */
const deleteClass = async (req, res) => {
  const { id } = req.params
  const existing = await prisma.classes.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Class not found.', 404)

  await prisma.classes.delete({ where: { id: Number(id) } })
  return sendSuccess(res, null, 'Class deleted successfully.')
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBJECTS
// ═══════════════════════════════════════════════════════════════════════════════

=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
/** GET /api/subjects */
const getSubjects = async (req, res) => {
  const subjects = await prisma.subjects.findMany({ orderBy: { name: 'asc' } })
  return sendSuccess(res, subjects)
}

<<<<<<< HEAD
/** POST /api/subjects */
const createSubject = async (req, res) => {
  const { name } = req.body
  if (!name) return sendError(res, 'Subject name is required.', 400)

  const exists = await prisma.subjects.findFirst({ where: { name: name.trim() } })
  if (exists) return sendError(res, `Subject "${name}" already exists.`, 409)

  const created = await prisma.subjects.create({ data: { name: name.trim() } })
  return sendSuccess(res, created, 'Subject created successfully.', 201)
}

/** PUT /api/subjects/:id */
const updateSubject = async (req, res) => {
  const { id } = req.params
  const { name } = req.body
  if (!name) return sendError(res, 'Subject name is required.', 400)

  const existing = await prisma.subjects.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Subject not found.', 404)

  const dup = await prisma.subjects.findFirst({
    where: { name: name.trim(), NOT: { id: Number(id) } },
  })
  if (dup) return sendError(res, `Subject "${name}" already exists.`, 409)

  const updated = await prisma.subjects.update({
    where: { id: Number(id) },
    data: { name: name.trim() },
  })
  return sendSuccess(res, updated, 'Subject updated successfully.')
}

/** DELETE /api/subjects/:id */
const deleteSubject = async (req, res) => {
  const { id } = req.params
  const existing = await prisma.subjects.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Subject not found.', 404)

  await prisma.subjects.delete({ where: { id: Number(id) } })
  return sendSuccess(res, null, 'Subject deleted successfully.')
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS–SUBJECT ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/class-subjects?class_id=X — subjects for a specific class (or all) */
const getClassSubjects = async (req, res) => {
  const { class_id } = req.query
  const where = class_id ? { class_id: Number(class_id) } : {}

  const data = await prisma.class_subjects.findMany({
    where,
    include: {
      class: { select: { id: true, class_name: true, section: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: [{ class: { class_name: 'asc' } }, { subject: { name: 'asc' } }],
  })
  return sendSuccess(res, data)
}

/** POST /api/class-subjects — assign a subject to a class */
const assignSubjectToClass = async (req, res) => {
  const { class_id, subject_id } = req.body
  if (!class_id || !subject_id) {
    return sendError(res, 'class_id and subject_id are required.', 400)
  }

  // Verify both exist
  const cls = await prisma.classes.findUnique({ where: { id: Number(class_id) } })
  if (!cls) return sendError(res, 'Class not found.', 404)

  const sub = await prisma.subjects.findUnique({ where: { id: Number(subject_id) } })
  if (!sub) return sendError(res, 'Subject not found.', 404)

  // Check duplicate
  const exists = await prisma.class_subjects.findFirst({
    where: { class_id: Number(class_id), subject_id: Number(subject_id) },
  })
  if (exists) {
    return sendError(res, `"${sub.name}" is already assigned to "${cls.class_name} - ${cls.section}".`, 409)
  }

  const created = await prisma.class_subjects.create({
    data: { class_id: Number(class_id), subject_id: Number(subject_id) },
    include: {
      class: { select: { id: true, class_name: true, section: true } },
      subject: { select: { id: true, name: true } },
    },
  })
  return sendSuccess(res, created, 'Subject assigned successfully.', 201)
}

/** DELETE /api/class-subjects/:id — remove assignment */
const removeSubjectFromClass = async (req, res) => {
  const { id } = req.params
  const existing = await prisma.class_subjects.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Assignment not found.', 404)

  await prisma.class_subjects.delete({ where: { id: Number(id) } })
  return sendSuccess(res, null, 'Subject removed from class.')
}

/** PUT /api/class-subjects/bulk — bulk assign/sync subjects for a class */
const bulkAssignSubjects = async (req, res) => {
  const { class_id, subject_ids } = req.body
  if (!class_id || !Array.isArray(subject_ids)) {
    return sendError(res, 'class_id and subject_ids[] are required.', 400)
  }

  const cls = await prisma.classes.findUnique({ where: { id: Number(class_id) } })
  if (!cls) return sendError(res, 'Class not found.', 404)

  // Remove all existing assignments for this class
  await prisma.class_subjects.deleteMany({ where: { class_id: Number(class_id) } })

  // Create new assignments
  if (subject_ids.length > 0) {
    await prisma.class_subjects.createMany({
      data: subject_ids.map(sid => ({
        class_id: Number(class_id),
        subject_id: Number(sid),
      })),
      skipDuplicates: true,
    })
  }

  // Fetch updated list
  const updated = await prisma.class_subjects.findMany({
    where: { class_id: Number(class_id) },
    include: {
      class: { select: { id: true, class_name: true, section: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: { subject: { name: 'asc' } },
  })

  return sendSuccess(res, updated, 'Subjects assigned successfully.')
}

module.exports = {
  getClasses, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getClassSubjects, assignSubjectToClass, removeSubjectFromClass, bulkAssignSubjects,
}
=======
module.exports = { getClasses, getSubjects }
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
