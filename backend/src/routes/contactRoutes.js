const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate, roleCheck } = require('../middleware/auth');

// Public route to submit contact form
router.post('/', contactController.submitContactForm);

// Protected routes for Admin
router.get('/', authenticate, roleCheck('admin', 'principal'), contactController.getMessages);
router.patch('/:id/status', authenticate, roleCheck('admin', 'principal'), contactController.updateMessageStatus);
router.delete('/:id', authenticate, roleCheck('admin', 'principal'), contactController.deleteMessage);

module.exports = router;
