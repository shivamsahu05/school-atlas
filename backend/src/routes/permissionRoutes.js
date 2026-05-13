// src/routes/permissionRoutes.js
const router       = require('express').Router();
const asyncHandler = require('express-async-handler');
const ctrl         = require('../controllers/permissionController');
const { authenticate, roleCheck } = require('../middleware/auth');

router.use(authenticate, roleCheck('admin'));

router.get('/meta',    asyncHandler(ctrl.getMeta));
router.get('/active',  asyncHandler(ctrl.getActive));
router.get('/expired', asyncHandler(ctrl.getExpired));
router.post('/grant',  asyncHandler(ctrl.grant));
router.put('/:id',     asyncHandler(ctrl.update));
router.delete('/:id',  asyncHandler(ctrl.remove));

module.exports = router;
