const pool = require('../config/db');

const roomFor = (a, b) => [parseInt(a, 10), parseInt(b, 10)].sort((x, y) => x - y).join('_');

const getContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const [sessions] = await pool.query(`
      SELECT DISTINCT u.id, u.name,
        (
          SELECT cm.message FROM ChatMessages cm
          WHERE (cm.sender_id = u.id AND cm.receiver_id = ?) OR (cm.sender_id = ? AND cm.receiver_id = u.id)
          ORDER BY cm.timestamp DESC LIMIT 1
        ) as last_message,
        (
          SELECT cm.timestamp FROM ChatMessages cm
          WHERE (cm.sender_id = u.id AND cm.receiver_id = ?) OR (cm.sender_id = ? AND cm.receiver_id = u.id)
          ORDER BY cm.timestamp DESC LIMIT 1
        ) as last_time
      FROM Sessions s
      JOIN Users u ON (s.mentor_id = u.id OR s.learner_id = u.id)
      WHERE (s.mentor_id = ? OR s.learner_id = ?) AND u.id != ?
    `, [userId, userId, userId, userId, userId, userId, userId]);

    const contacts = sessions.map(u => ({
      id: u.id.toString(),
      name: u.name,
      avatar: (u.name || '?').charAt(0).toUpperCase(),
      status: 'Online',
      lastMessage: u.last_message || 'Start the conversation!',
      time: u.last_time
        ? new Date(u.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : ''
    }));

    res.json(contacts);
  } catch (err) {
    console.error('getContacts error:', err);
    res.status(500).json({ message: 'Error fetching chat contacts' });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = req.query.contactId;
    if (!contactId) return res.json([]);

    const [sessionRows] = await pool.query(
      `SELECT COUNT(*) as cnt FROM Sessions
       WHERE (mentor_id = ? AND learner_id = ?) OR (mentor_id = ? AND learner_id = ?)`,
      [userId, contactId, contactId, userId]
    );
    if (sessionRows[0].cnt === 0) {
      return res.status(403).json({ message: 'Chat unlocks only after a booked session' });
    }

    const [messages] = await pool.query(`
      SELECT id, sender_id, receiver_id, message, timestamp FROM ChatMessages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY timestamp ASC
    `, [userId, contactId, contactId, userId]);

    const formatted = messages.map(m => ({
      id: m.id,
      text: m.message,
      sender: m.sender_id === userId ? 'me' : 'them',
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      timestamp: m.timestamp
    }));

    res.json(formatted);
  } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ message: 'Error loading chat history' });
  }
};

const saveMessage = async ({ senderId, receiverId, message }) => {
  const roomId = roomFor(senderId, receiverId);
  const [result] = await pool.query(
    'INSERT INTO ChatMessages (sender_id, receiver_id, room_id, message) VALUES (?, ?, ?, ?)',
    [senderId, receiverId, roomId, message]
  );
  const [rows] = await pool.query('SELECT id, sender_id, receiver_id, message, timestamp FROM ChatMessages WHERE id = ?', [result.insertId]);
  return rows[0];
};

module.exports = { getContacts, getHistory, saveMessage, roomFor };
