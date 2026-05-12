const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { authenticate, roleCheck } = require('../middleware/auth');

// All system routes are strictly for super admins / principal
router.use(authenticate);
router.use(roleCheck('admin', 'principal'));

router.get('/status', systemController.getSystemStatus);
router.post('/reset-permissions', systemController.resetPermissions);
router.post('/cleanup', systemController.cleanupData);
router.post('/rollover', systemController.rolloverYear);

module.exports = router;
