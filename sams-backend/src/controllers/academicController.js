// src/controllers/academicController.js
const prisma = require('../config/db')
const { sendSuccess, sendError } = require('../utils/response')

// ═══════════════════════════════════════════════════════════════════════════════
// ACADEMIC CLASSES
// ═══════════════════════════════════════════════════════════════════════════════

const getClasses = async (req, res) => {
  const classes = await prisma.academic_classes.findMany({
    orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
  })
  return res.json({ success: true, classes })
}

const createClass = async (req, res) => {
  const { name, class_number, sort_order, class_category, description } = req.body
  if (!name || !class_number) return sendError(res, 'Name and class number are required.', 400)

  const exists = await prisma.academic_classes.findFirst({ where: { name: name.trim() } })
  if (exists) return sendError(res, `Class "${name}" already exists.`, 409)

  const created = await prisma.academic_classes.create({
    data: {
      name: name.trim(),
      class_number: String(class_number).trim(),
      sort_order: Number(sort_order) || 0,
      class_category: class_category || 'primary',
      description: description || null,
    },
  })
  return res.json({ success: true, message: 'Class created', class: created })
}

const updateClass = async (req, res) => {
  const { id } = req.params
  const { name, class_number, sort_order, class_category, description } = req.body

  const existing = await prisma.academic_classes.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Class not found.', 404)

  if (name && name.trim() !== existing.name) {
    const dup = await prisma.academic_classes.findFirst({
      where: { name: name.trim(), NOT: { id: Number(id) } },
    })
    if (dup) return sendError(res, `Class "${name}" already exists.`, 409)
  }

  const updated = await prisma.academic_classes.update({
    where: { id: Number(id) },
    data: {
      ...(name && { name: name.trim() }),
      ...(class_number !== undefined && { class_number: String(class_number).trim() }),
      ...(sort_order !== undefined && { sort_order: Number(sort_order) || 0 }),
      ...(class_category && { class_category }),
      description: description !== undefined ? description : existing.description,
    },
  })
  return res.json({ success: true, message: 'Class updated', class: updated })
}

const deleteClass = async (req, res) => {
  const { id } = req.params
  const existing = await prisma.academic_classes.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Class not found.', 404)

  await prisma.academic_classes.delete({ where: { id: Number(id) } })
  return res.json({ success: true, message: 'Class deleted' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const getSections = async (req, res) => {
  const sections = await prisma.sections.findMany({ orderBy: { name: 'asc' } })
  return res.json({ success: true, sections })
}

const createSection = async (req, res) => {
  const { name, code, description } = req.body
  if (!name || !code) return sendError(res, 'Name and code are required.', 400)

  const exists = await prisma.sections.findFirst({
    where: { OR: [{ code: code.trim() }, { name: name.trim() }] },
  })
  if (exists) return sendError(res, `Section with name "${name}" or code "${code}" already exists.`, 409)

  const created = await prisma.sections.create({
    data: { name: name.trim(), code: code.trim(), description: description || null },
  })
  return res.json({ success: true, message: 'Section created', section: created })
}

const updateSection = async (req, res) => {
  const { id } = req.params
  const { name, code, description } = req.body

  const existing = await prisma.sections.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Section not found.', 404)

  const updated = await prisma.sections.update({
    where: { id: Number(id) },
    data: {
      ...(name && { name: name.trim() }),
      ...(code && { code: code.trim() }),
      description: description !== undefined ? description : existing.description,
    },
  })
  return res.json({ success: true, message: 'Section updated', section: updated })
}

const deleteSection = async (req, res) => {
  const { id } = req.params

  // Check if section is assigned to any classes
  const assignments = await prisma.acad_class_sections.findMany({
    where: { section_id: Number(id) },
    include: { class: { select: { name: true, class_number: true } } },
  })

  if (assignments.length > 0) {
    return res.json({
      success: false,
      message: `Cannot delete: section is assigned to ${assignments.length} class(es).`,
      assignedClasses: assignments.map(a => a.class),
    })
  }

  await prisma.sections.delete({ where: { id: Number(id) } })
  return res.json({ success: true, message: 'Section deleted' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBJECTS (uses existing subjects table, enhanced with code/description)
// ═══════════════════════════════════════════════════════════════════════════════

const getSubjects = async (req, res) => {
  const subjectsData = await prisma.subjects.findMany({
    orderBy: { name: 'asc' },
    include: {
      teacher_subjects: {
        include: { 
          teacher: { select: { name: true } },
          class: { select: { class_name: true, section: true } }
        }
      }
    }
  })

  // Format array to match frontend expectations
  const subjects = subjectsData.map(s => {
    // Unique classes covered by this subject
    const uniqueClasses = new Set(s.teacher_subjects.map(ts => ts.class_id))
    
    return {
      ...s,
      assignedTeacher: s.teacher_subjects[0]?.teacher?.name || null,
      assignedClasses: Array.from(uniqueClasses),
      assignments: s.teacher_subjects.map(ts => ({
        teacherName: ts.teacher?.name || 'Unknown',
        className: ts.class ? `${ts.class.class_name}-${ts.class.section}` : `Class ID ${ts.class_id}`
      }))
    }
  })

  return res.json({ success: true, subjects })
}

const createSubject = async (req, res) => {
  const { name, code, description } = req.body
  if (!name || !code) return sendError(res, 'Name and code are required.', 400)

  const exists = await prisma.subjects.findFirst({ where: { name: name.trim() } })
  if (exists) return sendError(res, `Subject "${name}" already exists.`, 409)

  const created = await prisma.subjects.create({
    data: { name: name.trim(), code: code.trim(), description: description || null },
  })
  return res.json({ success: true, message: 'Subject created', subject: created })
}

const updateSubject = async (req, res) => {
  const { id } = req.params
  const { name, code, description } = req.body

  const existing = await prisma.subjects.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Subject not found.', 404)

  const updated = await prisma.subjects.update({
    where: { id: Number(id) },
    data: {
      ...(name && { name: name.trim() }),
      ...(code !== undefined && { code: code?.trim() || null }),
      description: description !== undefined ? description : existing.description,
    },
  })
  return res.json({ success: true, message: 'Subject updated', subject: updated })
}

const deleteSubject = async (req, res) => {
  const { id } = req.params
  const existing = await prisma.subjects.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Subject not found.', 404)

  await prisma.subjects.delete({ where: { id: Number(id) } })
  return res.json({ success: true, message: 'Subject deleted' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS ↔ SECTION ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const getClassSections = async (req, res) => {
  const { classId } = req.params
  const { stream_id } = req.query
  const where = { class_id: Number(classId) }
  if (stream_id) where.stream_id = Number(stream_id)

  const rows = await prisma.acad_class_sections.findMany({
    where,
    include: { section: true, stream: true },
    orderBy: { section: { name: 'asc' } },
  })

  const sections = rows.map(r => ({
    mapping_id: r.id,
    section_id: r.section_id,
    section_name: r.section.name,
    code: r.section.code,
    stream_id: r.stream_id,
    stream_name: r.stream?.name || null,
  }))

  return res.json({ success: true, sections })
}

const assignSection = async (req, res) => {
  const { class_id, section_id, stream_id } = req.body
  if (!class_id || !section_id) return sendError(res, 'class_id and section_id are required.', 400)

  const exists = await prisma.acad_class_sections.findFirst({
    where: {
      class_id: Number(class_id),
      section_id: Number(section_id),
      stream_id: stream_id ? Number(stream_id) : null,
    },
  })
  if (exists) return sendError(res, 'Section already assigned to this class.', 409)

  await prisma.acad_class_sections.create({
    data: {
      class_id: Number(class_id),
      section_id: Number(section_id),
      stream_id: stream_id ? Number(stream_id) : null,
    },
  })
  return res.json({ success: true, message: 'Section assigned' })
}

const unassignSection = async (req, res) => {
  const { id } = req.params
  await prisma.acad_class_sections.delete({ where: { id: Number(id) } }).catch(() => null)
  return res.json({ success: true, message: 'Section removed' })
}

const unassignSectionByParams = async (req, res) => {
  const { class_id, section_id } = req.query
  if (!class_id || !section_id) return sendError(res, 'class_id and section_id required.', 400)

  await prisma.acad_class_sections.deleteMany({
    where: { class_id: Number(class_id), section_id: Number(section_id) },
  })
  return res.json({ success: true, message: 'Section removed' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS ↔ SUBJECT ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const getClassSubjects = async (req, res) => {
  const { classId } = req.params
  const { stream_id } = req.query
  const where = { class_id: Number(classId) }
  if (stream_id) where.stream_id = Number(stream_id)

  const rows = await prisma.acad_class_subjects.findMany({
    where,
    include: { subject: true, stream: true },
    orderBy: { subject: { name: 'asc' } },
  })

  const subjects = rows.map(r => ({
    mapping_id: r.id,
    subject_id: r.subject_id,
    name: r.subject.name,
    subject_name: r.subject.name,
    code: r.subject.code,
    subject_code: r.subject.code,
    stream_id: r.stream_id,
    stream_name: r.stream?.name || null,
  }))

  return res.json({ success: true, subjects })
}

const assignSubjectUnified = async (req, res) => {
  const { subjectId, teacherId, className } = req.body
  if (!subjectId) return sendError(res, 'subjectId is required.', 400)

  try {
    let classId = null

    if (className && className !== 'All') {
      // Parse "Grade 8-A" into "Grade 8" and "A"
      const parts = className.split('-')
      const class_name = parts[0]?.trim() || className
      const section = parts[1]?.trim() || 'A'

      let cls = await prisma.classes.findFirst({
        where: { class_name, section }
      })

      if (!cls) {
        cls = await prisma.classes.create({
          data: { class_name, section }
        })
      }
      classId = cls.id
    }

    await prisma.$transaction(async (tx) => {
      // Map to teacher
      if (teacherId && classId) {
        const existingTS = await tx.teacher_subjects.findFirst({
          where: { teacher_id: Number(teacherId), subject_id: Number(subjectId), class_id: classId }
        })
        if (!existingTS) {
          await tx.teacher_subjects.create({
            data: { teacher_id: Number(teacherId), subject_id: Number(subjectId), class_id: classId }
          })
        }
      }

      // We could also add to acad_class_subjects or other mappings if needed, 
      // but teacher_subjects binds teacher -> subject -> class
    })

    return res.json({ success: true, message: 'Subject assigned successfully' })
  } catch (error) {
    console.error('Unified Assignment Error:', error)
    return sendError(res, 'Failed to assign subject. Internal error.', 500)
  }
}

const assignSubject = async (req, res) => {
  const { class_id, subject_id, stream_id } = req.body
  if (!class_id || !subject_id) return sendError(res, 'class_id and subject_id are required.', 400)

  const exists = await prisma.acad_class_subjects.findFirst({
    where: {
      class_id: Number(class_id),
      subject_id: Number(subject_id),
      stream_id: stream_id ? Number(stream_id) : null,
    },
  })
  if (exists) return sendError(res, 'Subject already assigned to this class.', 409)

  await prisma.acad_class_subjects.create({
    data: {
      class_id: Number(class_id),
      subject_id: Number(subject_id),
      stream_id: stream_id ? Number(stream_id) : null,
    },
  })
  return res.json({ success: true, message: 'Subject assigned' })
}

const unassignSubject = async (req, res) => {
  const { id } = req.params
  await prisma.acad_class_subjects.delete({ where: { id: Number(id) } }).catch(() => null)
  return res.json({ success: true, message: 'Subject removed' })
}

const unassignSubjectByParams = async (req, res) => {
  const { class_id, subject_id } = req.query
  if (!class_id || !subject_id) return sendError(res, 'class_id and subject_id required.', 400)

  await prisma.acad_class_subjects.deleteMany({
    where: { class_id: Number(class_id), subject_id: Number(subject_id) },
  })
  return res.json({ success: true, message: 'Subject removed' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAMS / GROUPS
// ═══════════════════════════════════════════════════════════════════════════════

const getStreams = async (req, res) => {
  const streams = await prisma.streams.findMany({ orderBy: { name: 'asc' } })
  return res.json({ success: true, streams })
}

const createStream = async (req, res) => {
  const { name, code, description } = req.body
  if (!name || !code) return sendError(res, 'Name and code are required.', 400)

  const exists = await prisma.streams.findFirst({ where: { code: code.trim() } })
  if (exists) return sendError(res, `Stream with code "${code}" already exists.`, 409)

  const created = await prisma.streams.create({
    data: { name: name.trim(), code: code.trim(), description: description || null },
  })
  return res.json({ success: true, message: 'Stream created', id: created.id })
}

const updateStream = async (req, res) => {
  const { id } = req.params
  const { name, code, description } = req.body

  const existing = await prisma.streams.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Stream not found.', 404)

  await prisma.streams.update({
    where: { id: Number(id) },
    data: {
      ...(name && { name: name.trim() }),
      ...(code && { code: code.trim() }),
      description: description !== undefined ? description : existing.description,
    },
  })
  return res.json({ success: true, message: 'Stream updated' })
}

const deleteStream = async (req, res) => {
  const { id } = req.params
  await prisma.streams.delete({ where: { id: Number(id) } })
  return res.json({ success: true, message: 'Stream deleted' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS ↔ STREAM LINK
// ═══════════════════════════════════════════════════════════════════════════════

const getClassStreams = async (req, res) => {
  const { classId } = req.params
  const rows = await prisma.acad_class_streams.findMany({
    where: { class_id: Number(classId) },
    include: { stream: true },
    orderBy: { stream: { name: 'asc' } },
  })

  const streams = rows.map(r => ({
    link_id: r.id,
    id: r.stream.id,
    name: r.stream.name,
    code: r.stream.code,
    description: r.stream.description,
  }))

  return res.json({ success: true, streams })
}

const linkStream = async (req, res) => {
  const { class_id, stream_id } = req.body
  if (!class_id || !stream_id) return sendError(res, 'class_id and stream_id required.', 400)

  const exists = await prisma.acad_class_streams.findFirst({
    where: { class_id: Number(class_id), stream_id: Number(stream_id) },
  })
  if (exists) return sendError(res, 'Stream already linked.', 409)

  await prisma.acad_class_streams.create({
    data: { class_id: Number(class_id), stream_id: Number(stream_id) },
  })
  return res.json({ success: true, message: 'Stream linked' })
}

const unlinkStream = async (req, res) => {
  const { id } = req.params
  await prisma.acad_class_streams.delete({ where: { id: Number(id) } }).catch(() => null)
  return res.json({ success: true, message: 'Stream unlinked' })
}

module.exports = {
  getClasses, createClass, updateClass, deleteClass,
  getSections, createSection, updateSection, deleteSection,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getClassSections, assignSection, unassignSection, unassignSectionByParams,
  getClassSubjects, assignSubject, unassignSubject, unassignSubjectByParams,
  getStreams, createStream, updateStream, deleteStream,
  getClassStreams, linkStream, unlinkStream,
  assignSubjectUnified,
}
