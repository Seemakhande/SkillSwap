const express = require('express');
const router = express.Router();
const { bookSession, getMySessions, cancelSession } = require('../controllers/sessionController');
const protect = require('../middleware/auth');

router.get('/my', protect, getMySessions);
router.post('/book', protect, bookSession);
router.post('/:id/cancel', protect, cancelSession);

module.exports = router;
