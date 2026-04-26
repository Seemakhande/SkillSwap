const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const protect = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const [history] = await pool.query(
      'SELECT id, user_id, amount, type, reason, date FROM Transactions WHERE user_id = ? ORDER BY date DESC',
      [req.user.id]
    );
    res.json(history.map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.reason,
      date: t.date
    })));
  } catch (err) {
    res.status(500).json({ message: 'Transaction history inaccessible' });
  }
});

module.exports = router;
