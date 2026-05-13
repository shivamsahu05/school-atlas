// src/routes/events.js
const router = require('express').Router()
const asyncHandler = require('express-async-handler')
const ctrl = require('../controllers/eventsController')
const { authenticate } = require('../middleware/auth')

// All routes require authentication
router.use(authenticate)

// ─── Events ───
router.get('/', asyncHandler(ctrl.getEvents))
router.post('/', asyncHandler(ctrl.createEvent))
router.put('/:id', asyncHandler(ctrl.updateEvent))
router.delete('/:id', asyncHandler(ctrl.deleteEvent))

// ─── Participants ───
router.get('/:id/participants', asyncHandler(ctrl.getParticipants))
router.post('/:id/participants', asyncHandler(ctrl.addParticipant))
router.delete('/participants/:pid', asyncHandler(ctrl.deleteParticipant))

// ─── Winners ───
router.get('/:id/winners', asyncHandler(ctrl.getWinners))
router.post('/:id/winners', asyncHandler(ctrl.setWinner))
router.delete('/winners/:wid', asyncHandler(ctrl.deleteWinner))

module.exports = router
