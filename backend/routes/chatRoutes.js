const express = require('express');
const router = express.Router();
const { getContacts, getHistory } = require('../controllers/chatController');
const protect = require('../middleware/auth');

router.get('/contacts', protect, getContacts);
router.get('/history', protect, getHistory);

module.exports = router;
