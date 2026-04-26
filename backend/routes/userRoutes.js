const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { getMentors, getMentorById } = require('../controllers/skillController');
const protect = require('../middleware/auth');

router.get('/', protect, getMentors);
router.get('/profile', protect, getProfile);
router.put('/update', protect, updateProfile);
router.get('/:id', protect, getMentorById);

module.exports = router;
