const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, roleCheck } = require('../middleware/auth');
const ctrl = require('../controllers/timetableController');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/timetable/download-template
router.get('/download-template', authenticate, roleCheck('admin'), ctrl.downloadTemplate);

// POST /api/timetable/upload-excel
router.post('/upload-excel', authenticate, roleCheck('admin'), upload.single('file'), ctrl.uploadExcel);

// POST /api/timetable/resolve-conflict
router.post('/resolve-conflict', authenticate, roleCheck('admin'), ctrl.resolveConflict);

module.exports = router;
