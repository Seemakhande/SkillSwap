const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const protect = require('../middleware/auth');

// POST /api/reviews
router.post('/', protect, async (req, res) => {
  const { sessionId, mentorId, rating, comment } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('INSERT INTO Reviews (session_id, mentor_id, rating, comment) VALUES (?, ?, ?, ?)', [sessionId, mentorId, rating, comment]);
    
    // Average mapping
    const [avgRes] = await connection.query('SELECT AVG(rating) as avg FROM Reviews WHERE mentor_id = ?', [mentorId]);
    await connection.query('UPDATE Users SET rating = ? WHERE id = ?', [avgRes[0].avg, mentorId]);
    
    // Earn credits mapping dynamically on Completion validation
    await connection.query('UPDATE Sessions SET status="completed" WHERE id=?', [sessionId]);
    await connection.query('UPDATE Users SET credits=credits+10 WHERE id=?', [mentorId]);
    await connection.query('INSERT INTO Transactions (user_id, amount, type, reason) VALUES (?, 10, "earned", "Mentorship session completed via App")', [mentorId]);

    await connection.commit();
    res.status(201).json({ message: 'Review successfully tracked globally' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: 'Database mapping conflict parsing standard Review.' });
  } finally {
     connection.release();
  }
});

// GET /api/reviews/:mentorId
router.get('/:mentorId', protect, async (req, res) => {
  try {
    const [reviews] = await pool.query(`
      SELECT r.id, u.name as author, r.rating, r.comment, r.created_at as date 
      FROM Reviews r 
      JOIN Sessions s ON r.session_id = s.id 
      JOIN Users u ON s.learner_id = u.id 
      WHERE r.mentor_id = ? 
      ORDER BY r.created_at DESC
    `, [req.params.mentorId]);
    
    res.json(reviews.map(r => ({
      ...r,
      date: new Date(r.date).toLocaleDateString()
    })));
  } catch (err) {
     res.status(500).json({ message: 'Failed fetching external reviews' });
  }
});

module.exports = router;
