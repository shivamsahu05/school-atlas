const express = require('express');
const router = express.Router();
const loController = require('../controllers/loController');
const { authenticate, roleCheck } = require('../middleware/auth');

// Protect all routes
router.use(authenticate);

router.get('/meta', loController.getLOMeta);
router.get('/history', loController.getLOHistory);
router.get('/subjects/:classId', loController.getSubjectsByClass);
router.get('/teachers/:classId/:subjectId', loController.getTeachersByClassSubject);
router.get('/resolve-topic', loController.getResolvedTopic);
router.get('/fix-db', loController.fixDb);
router.post('/award', roleCheck('admin'), loController.awardLOScore);
router.put('/update/:id', roleCheck('admin'), loController.updateLOScore);
router.delete('/delete/:id', roleCheck('admin'), loController.deleteLOScore);

module.exports = router;
