const prisma = require('../config/db');
const pool = require('../config/mysqlDb');
const ExcelJS = require('exceljs');
const xlsx = require('xlsx');

// 1. Download Template
exports.downloadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Main Template Sheet
    const sheet = workbook.addWorksheet('Timetable Template');
    sheet.columns = [
      { header: 'Teacher', key: 'teacher', width: 25 },
      { header: 'Day', key: 'day', width: 15 },
      { header: 'Period Name', key: 'start_time', width: 15 },
      { header: 'Class', key: 'class', width: 15 },
      { header: 'Section', key: 'section', width: 15 },
      { header: 'Subject', key: 'subject', width: 20 },
      { header: 'Room (Optional)', key: 'room', width: 20 }
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add a sample row
    sheet.addRow({
      teacher: 'John Doe',
      day: 'Monday',
      start_time: 'Period 1',
      class: '10',
      section: 'A',
      subject: 'Mathematics',
      room: '101'
    });

    // Reference Data Sheet
    const refSheet = workbook.addWorksheet('Reference Data');
    
    const [teachers, classes, subjects, slots] = await Promise.all([
      prisma.users.findMany({ where: { role: 'teacher', status: 'active' }, select: { name: true } }),
      prisma.academic_classes.findMany({ select: { name: true, class_number: true } }),
      prisma.subjects.findMany({ select: { name: true } }),
      prisma.time_slots.findMany({ select: { start_time: true, end_time: true }, orderBy: { start_time: 'asc' } })
    ]);

    refSheet.columns = [
      { header: 'Valid Teachers', key: 'teachers', width: 25 },
      { header: 'Valid Classes', key: 'classes', width: 15 },
      { header: 'Valid Subjects', key: 'subjects', width: 20 },
      { header: 'Valid Periods', key: 'slots', width: 25 }
    ];
    refSheet.getRow(1).font = { bold: true };

    const maxRows = Math.max(teachers.length, classes.length, subjects.length, slots.length);
    for (let i = 0; i < maxRows; i++) {
      refSheet.addRow({
        teachers: teachers[i] ? teachers[i].name : '',
        classes: classes[i] ? classes[i].class_number : '',
        subjects: subjects[i] ? subjects[i].name : '',
        slots: slots[i] ? `${slots[i].start_time}` : ''
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Timetable_Template.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('[TIMETABLE TEMPLATE ERROR]:', error);
    res.status(500).json({ success: false, message: 'Failed to generate template' });
  }
};

// 2. Upload Excel
exports.uploadExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel file is empty' });
    }

    const report = {
      successCount: 0,
      failedCount: 0,
      conflictCount: 0,
      errors: [],
      conflicts: []
    };

    // Pre-fetch reference data for quick lookup
    const dbTeachers = await prisma.users.findMany({ where: { role: 'teacher' } });
    const dbClasses = await prisma.academic_classes.findMany();
    const dbSections = await prisma.acad_sections.findMany();
    const dbSubjects = await prisma.subjects.findMany();
    const dbSlots = await prisma.time_slots.findMany();

    const normalize = (str) => String(str || '').trim().toLowerCase();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // Assuming row 1 is header
      const row = rows[i];
      
      const teacherName = normalize(row['Teacher']);
      const day = normalize(row['Day']);
      let startTime = normalize(row['Period Name']);
      let endTime = '-';
      const classNum = normalize(row['Class']);
      const sectionName = normalize(row['Section']);
      const subjectName = normalize(row['Subject']);

      // Excel dates/times might come as decimals, let's just do a basic string match for now
      if (!teacherName || !day || !startTime || !classNum || !subjectName) {
        report.failedCount++;
        report.errors.push({ row: rowNum, reason: 'Missing required fields (Teacher, Day, Period Name, Class, Subject)' });
        continue;
      }
      
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (!validDays.includes(day)) {
        report.failedCount++;
        report.errors.push({ row: rowNum, reason: `Invalid day: ${row['Day']}` });
        continue;
      }

      // Match Teacher
      const matchedTeacher = dbTeachers.find(t => normalize(t.name) === teacherName);
      if (!matchedTeacher) {
        report.failedCount++;
        report.errors.push({ row: rowNum, reason: `Teacher not found: ${row['Teacher']}` });
        continue;
      }

      // Match Time Slot
      const matchedSlot = dbSlots.find(s => normalize(s.start_time) === startTime);
      if (!matchedSlot) {
        report.failedCount++;
        report.errors.push({ row: rowNum, reason: `Time slot not found: ${row['Period Name']}` });
        continue;
      }

      // Match Class, Section, Subject
      const matchedClass = dbClasses.find(c => normalize(c.class_number) === classNum || normalize(c.name) === classNum);
      const matchedSection = sectionName ? dbSections.find(s => normalize(s.name) === sectionName || normalize(s.code) === sectionName) : null;
      const matchedSubject = dbSubjects.find(s => normalize(s.name) === subjectName);

      if (!matchedClass) {
        report.failedCount++;
        report.errors.push({ row: rowNum, reason: `Class not found: ${row['Class']}` });
        continue;
      }
      if (!matchedSubject) {
        report.failedCount++;
        report.errors.push({ row: rowNum, reason: `Subject not found: ${row['Subject']}` });
        continue;
      }

      // Validate against teacher_assignments
      const assignmentQuery = {
        teacher_id: matchedTeacher.id,
        class_id: matchedClass.id,
        subject_id: matchedSubject.id
      };
      if (matchedSection) assignmentQuery.section_id = matchedSection.id;

      const assignmentRows = await pool.query(
        'SELECT id FROM teacher_assignments WHERE teacher_id = ? AND class_id = ? AND subject_id = ?' + (matchedSection ? ' AND section_id = ?' : ' AND section_id IS NULL'),
        matchedSection ? [assignmentQuery.teacher_id, assignmentQuery.class_id, assignmentQuery.subject_id, assignmentQuery.section_id] : [assignmentQuery.teacher_id, assignmentQuery.class_id, assignmentQuery.subject_id]
      );
      
      if (assignmentRows[0].length === 0) {
        report.failedCount++;
        report.errors.push({ row: rowNum, reason: `Teacher is not assigned to Class ${row['Class']} ${row['Section']} for Subject ${row['Subject']} in the system.` });
        continue;
      }

      const formattedDay = day.charAt(0).toUpperCase() + day.slice(1);
      const formattedSection = matchedSection ? matchedSection.code : '';

      // Check Conflict
      const existingEntry = await prisma.teacher_timetable.findFirst({
        where: {
          teacher_id: matchedTeacher.id,
          day_of_week: formattedDay,
          time_slot_id: matchedSlot.id
        },
        include: { subject: true }
      });

      if (existingEntry) {
        // Conflict!
        report.conflictCount++;
        report.conflicts.push({
          row: rowNum,
          reason: `Already assigned in same time slot (Class ${existingEntry.class_number} - ${existingEntry.subject.name})`,
          conflictData: {
            teacherId: matchedTeacher.id,
            dayOfWeek: formattedDay,
            timeSlotId: matchedSlot.id,
            classNumber: matchedClass.class_number,
            section: formattedSection,
            subjectId: matchedSubject.id,
            roomNumber: row['Room (Optional)'] || null
          },
          existing: {
            teacher: matchedTeacher.name,
            class: existingEntry.class_number,
            section: existingEntry.section,
            subject: existingEntry.subject.name,
            time: `${matchedSlot.start_time}`
          }
        });
        continue;
      }

      // No conflict -> Insert
      await prisma.teacher_timetable.create({
        data: {
          teacher_id: matchedTeacher.id,
          day_of_week: formattedDay,
          time_slot_id: matchedSlot.id,
          class_number: matchedClass.class_number,
          section: formattedSection,
          subject_id: matchedSubject.id,
          room_number: row['Room (Optional)'] || null
        }
      });
      report.successCount++;
    }

    return res.json({ success: true, report });

  } catch (error) {
    console.error('[EXCEL UPLOAD ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process Excel file', error: error.message });
  }
};

// 3. Resolve Conflict
exports.resolveConflict = async (req, res) => {
  const { action, conflictData } = req.body;
  if (!action || !conflictData) {
    return res.status(400).json({ success: false, message: 'Missing action or conflictData' });
  }

  try {
    if (action === 'KEEP EXISTING' || action === 'SKIP THIS ROW') {
      return res.json({ success: true, message: 'Row skipped, existing entry kept.' });
    }

    if (action === 'REPLACE WITH NEW') {
      await prisma.teacher_timetable.updateMany({
        where: {
          teacher_id: conflictData.teacherId,
          day_of_week: conflictData.dayOfWeek,
          time_slot_id: conflictData.timeSlotId
        },
        data: {
          class_number: conflictData.classNumber,
          section: conflictData.section,
          subject_id: conflictData.subjectId,
          room_number: conflictData.roomNumber
        }
      });
      return res.json({ success: true, message: 'Entry replaced successfully.' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    console.error('[RESOLVE CONFLICT ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Failed to resolve conflict' });
  }
};
