// src/controllers/eventsController.js
const prisma = require('../config/db')

// ─── EVENTS ───────────────────────────────────────────────────────────────────

exports.getEvents = async (req, res) => {
  const { status, event_type, target_class } = req.query
  
  const where = {}
  if (status && status !== 'all') where.status = status
  if (event_type && event_type !== 'all') where.event_type = event_type
  if (target_class && target_class !== 'all') where.target_class = target_class

  const events = await prisma.school_events.findMany({
    where,
    orderBy: { event_date: 'desc' },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      _count: { select: { participants: true, winners: true } }
    }
  })
  res.json({ success: true, events })
}

exports.createEvent = async (req, res) => {
  const { title, description, event_date, location, event_type, target_class, status } = req.body
  const event = await prisma.school_events.create({
    data: {
      title,
      description,
      event_date: event_date ? new Date(event_date) : null,
      location,
      event_type: event_type || 'school',
      target_class,
      status: status || 'upcoming',
      created_by: req.user?.id
    }
  })
  res.status(201).json({ success: true, event })
}

exports.updateEvent = async (req, res) => {
  const { id } = req.params
  const { title, description, event_date, location, event_type, target_class, status } = req.body
  const event = await prisma.school_events.update({
    where: { id: parseInt(id) },
    data: {
      title,
      description,
      event_date: event_date ? new Date(event_date) : null,
      location,
      event_type,
      target_class,
      status
    }
  })
  res.json({ success: true, event })
}

exports.deleteEvent = async (req, res) => {
  const { id } = req.params
  await prisma.school_events.delete({ where: { id: parseInt(id) } })
  res.json({ success: true, message: 'Event deleted' })
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
