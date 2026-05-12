const prisma = require('../config/db')
const pool = require('../config/mysqlDb')
const notificationEventService = require('../utils/notificationEventService')

// ─── EVENTS ───────────────────────────────────────────────────────────────────

exports.getEvents = async (req, res) => {
  const { status, event_type, target_class } = req.query
  
  try {
    let sql = `
      SELECT 
        e.*,
        u.name as creator_name,
        u.role as creator_role,
        (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participants_count,
        (SELECT COUNT(*) FROM event_winners WHERE event_id = e.id) as winners_count
      FROM school_events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ` AND e.status = ?`;
      params.push(status);
    }
    if (event_type && event_type !== 'all') {
      sql += ` AND e.event_type = ?`;
      params.push(event_type);
    }
    if (target_class && target_class !== 'all') {
      sql += ` AND e.target_class = ?`;
      params.push(target_class);
    }
    if (req.query.category && req.query.category !== 'all') {
      sql += ` AND e.category = ?`;
      params.push(req.query.category);
    }

    sql += ` ORDER BY e.event_date DESC`;

    const [rows] = await pool.execute(sql, params);

    const events = rows.map(row => ({
      ...row,
      creator: { id: row.created_by, name: row.creator_name, role: row.creator_role },
      _count: { participants: row.participants_count, winners: row.winners_count }
    }));

    res.json({ success: true, events });
  } catch (error) {
    console.error('getEvents Error:', error);
    res.status(500).json({ success: false, message: 'Failed to load events.' });
  }
}

exports.createEvent = async (req, res) => {
  const { title, description, event_date, location, event_type, target_class, status, category } = req.body
  try {
    const [result] = await pool.execute(
      `INSERT INTO school_events (title, description, event_date, location, event_type, target_class, status, category, created_by, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, description, event_date ? new Date(event_date) : null, location, event_type || 'school', target_class, status || 'upcoming', category || 'event', req.user?.id]
    )

    const eventId = result.insertId

    // Emit Event
    await notificationEventService.emitNotification('school_event_created', {
      eventId,
      title: title,
      date: event_date
    });

    res.status(201).json({ success: true, event: { id: eventId, title } })
  } catch (error) {
    console.error('createEvent Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateEvent = async (req, res) => {
  const { id } = req.params
  const { title, description, event_date, location, event_type, target_class, status, category } = req.body
  try {
    if (req.user?.role === 'teacher') {
      const [rows] = await pool.execute(`SELECT created_by FROM school_events WHERE id=?`, [parseInt(id)])
      if (!rows.length || rows[0].created_by !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only edit events you created.' })
      }
    }

    await pool.execute(
      `UPDATE school_events 
       SET title=?, description=?, event_date=?, location=?, event_type=?, target_class=?, status=?, category=?, updated_at=NOW()
       WHERE id=?`,
      [title, description, event_date ? new Date(event_date) : null, location, event_type, target_class, status, category || 'event', parseInt(id)]
    )
    res.json({ success: true, message: 'Event updated' })
  } catch (error) {
    console.error('updateEvent Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.deleteEvent = async (req, res) => {
  const { id } = req.params
  try {
    if (req.user?.role === 'teacher') {
      const event = await prisma.school_events.findUnique({ where: { id: parseInt(id) } })
      if (!event || event.created_by !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only delete events you created.' })
      }
    }
    
    await prisma.school_events.delete({ where: { id: parseInt(id) } })
    res.json({ success: true, message: 'Event deleted' })
  } catch (error) {
    console.error('deleteEvent Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─── PARTICIPANTS ─────────────────────────────────────────────────────────────

exports.getParticipants = async (req, res) => {
  const { id } = req.params
  const participants = await prisma.event_participants.findMany({
    where: { event_id: parseInt(id) },
    orderBy: { student_name: 'asc' }
  })
  res.json({ success: true, participants })
}

exports.addParticipant = async (req, res) => {
  const { id } = req.params
  const { student_name, student_class, roll_no } = req.body
  const participant = await prisma.event_participants.create({
    data: {
      event_id: parseInt(id),
      student_name,
      student_class,
      roll_no
    }
  })
  res.status(201).json({ success: true, participant })
}

exports.deleteParticipant = async (req, res) => {
  const { pid } = req.params
  await prisma.event_participants.delete({ where: { id: parseInt(pid) } })
  res.json({ success: true, message: 'Participant removed' })
}

// ─── WINNERS ──────────────────────────────────────────────────────────────────

exports.getWinners = async (req, res) => {
  const { id } = req.params
  const winners = await prisma.event_winners.findMany({
    where: { event_id: parseInt(id) },
    include: {
      participant: true
    },
    orderBy: { position: 'asc' }
  })
  res.json({ success: true, winners })
}

exports.setWinner = async (req, res) => {
  const { id } = req.params
  const { participant_id, position, remarks } = req.body
  
  // Upsert pattern based on event_id and position unique constraint
  const winner = await prisma.event_winners.upsert({
    where: {
      event_id_position: { event_id: parseInt(id), position }
    },
    update: {
      participant_id: parseInt(participant_id),
      remarks
    },
    create: {
      event_id: parseInt(id),
      participant_id: parseInt(participant_id),
      position,
      remarks
    },
    include: {
      participant: true
    }
  })
  
  res.json({ success: true, winner })
}

exports.deleteWinner = async (req, res) => {
  const { wid } = req.params
  await prisma.event_winners.delete({ where: { id: parseInt(wid) } })
  res.json({ success: true, message: 'Winner removed' })
}
