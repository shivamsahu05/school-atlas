// src/controllers/academicController.js
const prisma = require('../config/db')
const pool = require('../config/mysqlDb')
const { sendSuccess, sendError } = require('../utils/response')

// ═══════════════════════════════════════════════════════════════════════════════
// ACADEMIC CLASSES
// ═══════════════════════════════════════════════════════════════════════════════

const getClasses = async (req, res) => {
  const classes = await prisma.academic_classes.findMany({
    orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    include: {
      acad_class_sections: {
        include: {
          section: true
        }
      }
    }
  })
  return sendSuccess(res, classes)
}

const getSimpleClasses = async (req, res) => {
  try {
    // Fetch from academic_classes (normalized) instead of flat 'classes' table
    const classes = await prisma.academic_classes.findMany({
      orderBy: { class_number: 'asc' },
    })
    // Map to expected format
    const mapped = classes.map(c => ({
      id: c.id,
      name: c.name,
      class_name: c.name,
      class_number: c.class_number
    }))
    return res.json({ success: true, classes: mapped, data: mapped })
  } catch (error) {
    console.error('[API CLASSES ERROR]:', error)
    return res.status(500).json({ success: false, message: error.message, classes: [], data: [] })
  }
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
  const sections = await prisma.acad_sections.findMany({ orderBy: { name: 'asc' } })
  return sendSuccess(res, sections)
}

const createSection = async (req, res) => {
  const { name, code, description } = req.body
  if (!name || !code) return sendError(res, 'Name and code are required.', 400)

  const exists = await prisma.acad_sections.findFirst({
    where: { OR: [{ code: code.trim() }, { name: name.trim() }] },
  })
  if (exists) return sendError(res, `Section with name "${name}" or code "${code}" already exists.`, 409)

  const created = await prisma.acad_sections.create({
    data: { name: name.trim(), code: code.trim(), description: description || null },
  })
  return res.json({ success: true, message: 'Section created', section: created })
}

const updateSection = async (req, res) => {
  const { id } = req.params
  const { name, code, description } = req.body

  const existing = await prisma.acad_sections.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Section not found.', 404)

  const updated = await prisma.acad_sections.update({
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

  await prisma.acad_sections.delete({ where: { id: Number(id) } })
  return res.json({ success: true, message: 'Section deleted' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBJECTS (uses existing subjects table, enhanced with code/description)
// ═══════════════════════════════════════════════════════════════════════════════

const getSubjects = async (req, res) => {
  try {
    console.log('[API SUBJECTS] Fetching subjects data...');

    // [HEALING] Clean up any orphan teacher_subjects records pointing to non-existent users, classes, or subjects
    try {
      await prisma.$executeRawUnsafe(`
        DELETE FROM teacher_subjects 
        WHERE teacher_id NOT IN (SELECT id FROM users)
           OR class_id NOT IN (SELECT id FROM classes)
           OR subject_id NOT IN (SELECT id FROM subjects)
      `);
    } catch (healError) {
      console.warn('[HEALING WARN] Failed to clean orphan teacher_subjects:', healError);
    }

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
    });

    // Format array to match frontend expectations
    const subjects = subjectsData.map(s => {
      // Unique classes covered by this subject
      const uniqueClasses = new Set(s.teacher_subjects.map(ts => ts.class_id));
      
      return {
        ...s,
        assignedTeacher: s.teacher_subjects[0]?.teacher?.name || null,
        assignedClasses: Array.from(uniqueClasses),
        assignments: s.teacher_subjects.map(ts => ({
          teacherName: ts.teacher?.name || 'Unknown',
          className: ts.class ? `${ts.class.class_name}-${ts.class.section}` : `Class ID ${ts.class_id}`
        }))
      };
    });

    return sendSuccess(res, subjects);
  } catch (error) {
    console.error('[API SUBJECTS ERROR]:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subjects: ' + error.message,
      subjects: [] // Return empty array to prevent frontend crash
    });
  }
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

  return sendSuccess(res, sections)
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
  
  try {
    const classIdNum = parseInt(classId, 10);
    if (isNaN(classIdNum)) {
      return sendSuccess(res, []);
    }

    const cls = await prisma.academic_classes.findUnique({ where: { id: classIdNum } });
    if (!cls) return sendSuccess(res, []);

    // Single source of truth: acad_class_subjects
    const classSubjects = await prisma.acad_class_subjects.findMany({
      where: { class_id: classIdNum },
      include: { subject: true }
    });

    const mapped = (classSubjects || [])
      .filter(cs => cs.subject) // Filter out orphan records
      .map(cs => ({
        mapping_id: cs.id,
        subject_id: cs.subject_id,
        subject_name: cs.subject.name,
        subject_code: cs.subject.code,
        name: cs.subject.name,
        code: cs.subject.code
      }));

    // Return unique subjects (in case of duplicate mappings)
    const unique = Array.from(new Map(mapped.map(s => [s.subject_id, s])).values());

    return sendSuccess(res, unique);
  } catch (err) {
    console.error('getClassSubjects Error:', err);
    // Never throw 500 to frontend for this endpoint, return empty array safely
    return sendSuccess(res, []);
  }
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
    })

    // Notify Teacher and Admin
    if (teacherId) {
      const notificationEventService = require('../utils/notificationEventService');
      const teacher = await prisma.teachers.findUnique({ where: { id: Number(teacherId) }, include: { user: true } });
      const subject = await prisma.subjects.findUnique({ where: { id: Number(subjectId) } });
      
      if (teacher && subject) {
        await notificationEventService.emitNotification('teacher_assigned', {
          teacherUserId: teacher.user_id,
          teacherName: teacher.user.name,
          subjectId: subjectId,
          subjectName: subject.name,
          className: className || 'General'
        });
      }
    }

    return res.json({ success: true, message: 'Subject assigned successfully' })
  } catch (error) {
    console.error('Unified Assignment Error:', error)
    return sendError(res, 'Failed to assign subject. Internal error.', 500)
  }
}

const assignSubject = async (req, res) => {
  const { class_id, subject_id, stream_id } = req.body
  
  try {
    const classId = Number(class_id)
    const subjectId = Number(subject_id)
    const streamId = stream_id ? Number(stream_id) : null

    if (!classId || !subjectId) {
      return sendError(res, 'Valid class_id and subject_id are required.', 400)
    }

    const exists = await prisma.acad_class_subjects.findFirst({
      where: {
        class_id: classId,
        subject_id: subjectId,
        stream_id: streamId,
      },
    })
    
    if (exists) {
      return sendError(res, 'Subject already assigned to this class/group.', 409)
    }

    // [HOTFIX] Ensure 'id' is AUTO_INCREMENT if Prisma is complaining about Null id
    // This happens if the table was created without the AUTO_INCREMENT attribute.
    try {
      await prisma.acad_class_subjects.create({
        data: {
          class_id: classId,
          subject_id: subjectId,
          stream_id: streamId,
        },
      })
    } catch (createError) {
      if (createError.message.includes('Null constraint violation') && createError.message.includes('id')) {
        console.warn('[DB HOTFIX] Fixing missing AUTO_INCREMENT on acad_class_subjects.id');
        await prisma.$executeRawUnsafe('ALTER TABLE acad_class_subjects MODIFY id INT AUTO_INCREMENT;');
        
        // Retry the create
        await prisma.acad_class_subjects.create({
          data: {
            class_id: classId,
            subject_id: subjectId,
            stream_id: streamId,
          },
        })
      } else {
        throw createError; // Re-throw if it's a different error
      }
    }
    return res.json({ success: true, message: 'Subject assigned successfully' })
  } catch (error) {
    console.error('[ASSIGN SUBJECT ERROR]:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to assign subject: ' + error.message 
    })
  }
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

// ═══════════════════════════════════════════════════════════════════════════════
// TIMETABLE
// ═══════════════════════════════════════════════════════════════════════════════

const getTimeSlots = async (req, res) => {
  const timeSlots = await prisma.time_slots.findMany({
    orderBy: { start_time: 'asc' },
  })
  return res.json({ success: true, timeSlots })
}

const createTimeSlot = async (req, res) => {
  const { start_time, end_time, is_break } = req.body
  if (!start_time || !end_time) return sendError(res, 'start_time and end_time are required.', 400)

  const created = await prisma.time_slots.create({
    data: {
      start_time: start_time.trim(),
      end_time: end_time.trim(),
      is_break: is_break || false,
    },
  })
  return res.json({ success: true, message: 'Time slot created', timeSlot: created })
}

const updateTimeSlot = async (req, res) => {
  const { id } = req.params
  const { start_time, end_time } = req.body
  await prisma.time_slots.update({
    where: { id: Number(id) },
    data: { start_time, end_time },
  })
  return res.json({ success: true, message: 'Time slot updated' })
}

const deleteTimeSlot = async (req, res) => {
  const { id } = req.params
  const existing = await prisma.time_slots.findUnique({ where: { id: Number(id) } })
  if (!existing) return sendError(res, 'Time slot not found.', 404)

  // Check if any timetable entries use this slot
  const entries = await prisma.teacher_timetable.findMany({ where: { time_slot_id: Number(id) } })
  if (entries.length > 0) {
    return sendError(res, `Cannot delete: ${entries.length} timetable entries use this slot. Remove them first.`, 409)
  }

  await prisma.time_slots.delete({ where: { id: Number(id) } })
  return res.json({ success: true, message: 'Time slot deleted' })
}

const getTeacherTimetable = async (req, res) => {
  const teacherId = Number(req.params.id)
  const rows = await prisma.teacher_timetable.findMany({
    where: { teacher_id: teacherId },
    include: {
      time_slot: true,
      subject: true,
      stream: true,
    },
  })

  const timetable = rows.map(r => ({
    id: r.id,
    day_of_week: r.day_of_week,
    time_slot_id: r.time_slot_id,
    subject_id: r.subject_id,
    subject_name: r.subject.name,
    class_number: r.class_number,
    section: r.section,
    stream_id: r.stream_id,
    stream_name: r.stream?.name || null,
    room_number: r.room_number,
    start_time: r.time_slot.start_time,
    end_time: r.time_slot.end_time,
  }))

  return res.json({ success: true, timetable })
}

const assignTimetableEntry = async (req, res) => {
  const {
    classNumber, section, streamId, dayOfWeek,
    timeSlotId, subjectId, teacherId, roomNumber
  } = req.body

  if (!teacherId || !timeSlotId || !dayOfWeek || !classNumber || !subjectId) {
    return sendError(res, 'Missing required fields for assignment.', 400)
  }

  const finalSection = section ? String(section) : "";

  try {
    // 1. Check if the class is already booked with another teacher at this exact time
    const conflict = await prisma.teacher_timetable.findUnique({
      where: {
        class_number_section_day_of_week_time_slot_id: {
          class_number: String(classNumber),
          section: finalSection,
          day_of_week: dayOfWeek.toUpperCase(),
          time_slot_id: Number(timeSlotId)
        }
      }
    });

    if (conflict && conflict.teacher_id !== Number(teacherId)) {
      return sendError(res, `Class ${classNumber}${finalSection ? '-' + finalSection : ''} is already scheduled with another teacher at this time.`, 409);
    }

    // 2. Upsert assignment (unique on teacher_id, day_of_week, time_slot_id)
    await prisma.teacher_timetable.upsert({
      where: {
        teacher_id_day_of_week_time_slot_id: {
          teacher_id: Number(teacherId),
          day_of_week: dayOfWeek.toUpperCase(),
          time_slot_id: Number(timeSlotId),
        }
      },
      update: {
        class_number: String(classNumber),
        section: finalSection,
        stream_id: streamId ? Number(streamId) : null,
        subject_id: Number(subjectId),
        room_number: roomNumber || null,
      },
      create: {
        teacher_id: Number(teacherId),
        day_of_week: dayOfWeek.toUpperCase(),
        time_slot_id: Number(timeSlotId),
        class_number: String(classNumber),
        section: finalSection,
        stream_id: streamId ? Number(streamId) : null,
        subject_id: Number(subjectId),
        room_number: roomNumber || null,
      }
    })

    return res.json({ success: true, message: 'Timetable entry assigned successfully' })
  } catch (error) {
    console.error('[TIMETABLE ASSIGN ERROR]:', error);
    if (error.code === 'P2002') {
      return sendError(res, 'Schedule conflict detected. Please check existing timetables.', 409);
    }
    return sendError(res, 'Internal server error while saving assignment.', 500);
  }
}

const deleteTimetableEntry = async (req, res) => {
  const { id } = req.params
  await prisma.teacher_timetable.delete({
    where: { id: Number(id) }
  })
  return res.json({ success: true, message: 'Timetable entry deleted' })
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT / CLASS TIMETABLE
// ═══════════════════════════════════════════════════════════════════════════════

const getClassTimetable = async (req, res) => {
  const { classNumber, section } = req.query
  if (!classNumber || !section) return sendError(res, 'classNumber and section are required.', 400)

  const rows = await prisma.teacher_timetable.findMany({
    where: {
      class_number: String(classNumber),
      section: String(section),
    },
    include: {
      time_slot: true,
      subject: true,
      stream: true,
    },
  })

  // Also fetch teacher names via user_id lookup
  const teacherIds = [...new Set(rows.map(r => r.teacher_id))]
  const teacherUsers = await prisma.users.findMany({
    where: { id: { in: teacherIds } },
    select: { id: true, name: true },
  })
  const teacherMap = Object.fromEntries(teacherUsers.map(t => [t.id, t.name]))

  const timetable = rows.map(r => ({
    id: r.id,
    day_of_week: r.day_of_week,
    time_slot_id: r.time_slot_id,
    subject_id: r.subject_id,
    subject_name: r.subject.name,
    teacher_id: r.teacher_id,
    teacher_name: teacherMap[r.teacher_id] || 'Unknown',
    class_number: r.class_number,
    section: r.section,
    stream_id: r.stream_id,
    stream_name: r.stream?.name || null,
    room_number: r.room_number,
    start_time: r.time_slot.start_time,
    end_time: r.time_slot.end_time,
  }))

  return res.json({ success: true, timetable })
}

const getResolvedTeacher = async (req, res) => {
  try {
    const { class_id, section_id, subject_id } = req.query;
    if (!class_id || !subject_id) {
      return sendError(res, 'class_id and subject_id are required.', 400);
    }

    // 1. Fetch Class and Section Details
    const cls = await prisma.academic_classes.findUnique({ where: { id: Number(class_id) } });
    if (!cls) return sendError(res, 'Class not found.', 404);

    let sectionName = '';
    if (section_id && section_id !== 'null' && section_id !== 'undefined') {
      const sec = await prisma.acad_sections.findUnique({ where: { id: Number(section_id) } });
      if (sec) sectionName = sec.name;
    }

    const classNum = cls.class_number || '';
    const className = cls.name || '';
    const subId = Number(subject_id);

    console.log(`[RESOLVE] Inputs: Class=${className}(#${classNum}), Section=${sectionName}, Subject=${subId}`);

    // --- STRATEGY 1: TIMETABLE (Requested Priority) ---
    // MUST return teachers.id (Profile ID) to match frontend dropdowns and observation/LO schemas
    try {
      const query = `
        SELECT DISTINCT t.id, u.name 
        FROM teacher_timetable tt
        JOIN teachers t ON (tt.teacher_id = t.id OR tt.teacher_id = t.user_id)
        JOIN users u ON t.user_id = u.id
        WHERE (tt.class_number = ? OR tt.class_number = ? OR tt.class_number = REPLACE(?, 'Class ', ''))
          AND (
            tt.section = ? 
            OR tt.section = REPLACE(?, 'Section ', '') 
            OR tt.section = REPLACE(?, 'Sec ', '')
            OR (tt.section = '' AND (? = '' OR ? IS NULL))
            OR (? = '' OR ? IS NULL)
          )
          AND tt.subject_id = ?
        LIMIT 1
      `;
      
      const params = [
        String(classNum), String(className), String(className),
        sectionName, sectionName, sectionName, sectionName, sectionName, sectionName, sectionName,
        subId
      ];

      const [rows] = await pool.execute(query, params);

      if (rows && rows.length > 0) {
        console.log(`[RESOLVE] Strategy 1 (Timetable) Success: ${rows[0].name} (ID: ${rows[0].id})`);
        return res.json({ success: true, teacher: rows[0] });
      }
    } catch (err) {
      console.warn('[RESOLVE] Strategy 1 (Timetable) SQL Error:', err.message);
    }

    // --- STRATEGY 2: MASTER ASSIGNMENT (teacher_subjects) ---
    try {
      const legacyClass = await prisma.classes.findFirst({
        where: {
          OR: [
            { class_name: { contains: classNum } },
            { class_name: { contains: className.replace(/^Class\s+/i, '') } }
          ],
          section: sectionName || 'A'
        }
      });

      if (legacyClass) {
        // NOTE: teacher_subjects.teacher_id links to users.id
        // We need to resolve it to teachers.id (Profile ID)
        const assignment = await prisma.teacher_subjects.findFirst({
          where: { class_id: legacyClass.id, subject_id: subId },
          include: { 
            teacher: { // This is 'users' model
              include: { teacher_profile: true } 
            } 
          }
        });

        if (assignment?.teacher?.teacher_profile) {
          const tProfile = assignment.teacher.teacher_profile;
          console.log(`[RESOLVE] Strategy 2 (Assignment) Success: ${assignment.teacher.name}`);
          return res.json({ 
            success: true, 
            teacher: { id: tProfile.id, name: assignment.teacher.name } 
          });
        }
      }
    } catch (err) {
      console.warn('[RESOLVE] Strategy 2 (Assignment) Error:', err.message);
    }

    // --- STRATEGY 3: FUZZY FALLBACK (Subject Only) ---
    try {
      const [rows] = await pool.execute(`
        SELECT t.id, u.name 
        FROM teacher_subjects ts
        JOIN users u ON ts.teacher_id = u.id
        JOIN teachers t ON u.id = t.user_id
        WHERE ts.subject_id = ?
        LIMIT 1
      `, [subId]);

      if (rows && rows.length > 0) {
        console.log(`[RESOLVE] Strategy 3 (Fuzzy) Success: ${rows[0].name}`);
        return res.json({ success: true, teacher: rows[0] });
      }
    } catch (err) {
      console.error('[RESOLVE] Strategy 3 failed:', err.message);
    }

    return res.json({ success: true, teacher: null, message: "No teacher resolved" });

  } catch (error) {
    console.error('[RESOLVE_TEACHER_CRITICAL]:', error);
    return res.json({ success: true, teacher: null, error: error.message });
  }
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
  getSimpleClasses,
  getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot,
  getTeacherTimetable, assignTimetableEntry, deleteTimetableEntry,
  getClassTimetable,
  getResolvedTeacher
}
