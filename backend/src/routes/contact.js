// src/routes/contact.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate, roleCheck } = require('../middleware/auth');

// POST /api/contact (Public)
router.post('/', contactController.submitContactForm);

// Admin Routes
router.get('/',               authenticate, roleCheck('admin'), contactController.getMessages);
router.patch('/:id/status',   authenticate, roleCheck('admin'), contactController.updateMessageStatus);
router.delete('/:id',         authenticate, roleCheck('admin'), contactController.deleteMessage);

module.exports = router;
