const crypto = require('crypto');
const pool = require('../config/db');
const { sendBookingMail } = require('../utils/mailer');

const SESSION_COST = 10;
const JITSI_DOMAIN = 'meet.jit.si';

const generateMeetingUrl = () => {
  const token = crypto.randomBytes(6).toString('hex');
  return `https://${JITSI_DOMAIN}/SkillSwap-${token}`;
};

const pad = (num) => num.toString().padStart(2, '0');

const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const getTimeslots = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const [slots] = await pool.query(
      'SELECT * FROM TimeSlots WHERE user_id = ? AND is_booked = false AND start_time >= NOW() ORDER BY start_time ASC',
      [mentorId]
    );

    const formattedSlots = slots.map(slot => {
      const startDate = new Date(slot.start_time);
      const endDate = slot.end_time ? new Date(slot.end_time) : new Date(startDate.getTime() + 3600000);
      return {
        id: slot.id,
        date: formatDate(startDate),
        startTime: formatTime(startDate),
        endTime: formatTime(endDate)
      };
    });

    res.json(formattedSlots);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving mentor availability' });
  }
};

const parseCustomDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return null;
  const dt = new Date(`${dateString}T${timeString}:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
};

const bookSession = async (req, res) => {
  const { mentorId, timeslotId, customDate, customStartTime, customEndTime, skillId: preferredSkillId } = req.body;
  const learnerId = req.user.id;

  if (!mentorId) return res.status(400).json({ message: 'Mentor is required' });
  if (parseInt(mentorId, 10) === learnerId) return res.status(400).json({ message: 'You cannot book a session with yourself' });

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.query('SELECT credits FROM Users WHERE id = ? FOR UPDATE', [learnerId]);
    if (users.length === 0) throw new Error('Learner account not found');
    if (users[0].credits < SESSION_COST) throw new Error(`Insufficient credits. You need ${SESSION_COST} credits to book a session.`);

    let skillId = preferredSkillId;
    if (!skillId) {
      const [skills] = await connection.query('SELECT skill_id FROM UserSkills WHERE user_id = ? AND type = "offer" LIMIT 1', [mentorId]);
      if (skills.length === 0) throw new Error('Mentor has not listed any skills to teach');
      skillId = skills[0].skill_id;
    }

    let sessionStartTime;
    let sessionEndTime;

    if (timeslotId) {
      const [slots] = await connection.query('SELECT * FROM TimeSlots WHERE id = ? AND user_id = ? AND is_booked = false FOR UPDATE', [timeslotId, mentorId]);
      if (slots.length === 0) throw new Error('This slot is no longer available');
      const slot = slots[0];
      sessionStartTime = slot.start_time;
      sessionEndTime = slot.end_time;
      await connection.query('UPDATE TimeSlots SET is_booked = true WHERE id = ?', [timeslotId]);
    } else {
      const start = parseCustomDateTime(customDate, customStartTime);
      const end = parseCustomDateTime(customDate, customEndTime);
      if (!start || !end) throw new Error('Invalid custom date/time provided');
      if (end <= start) throw new Error('End time must be after start time');
      sessionStartTime = start;
      sessionEndTime = end;
    }

    await connection.query('UPDATE Users SET credits = credits - ? WHERE id = ?', [SESSION_COST, learnerId]);
    await connection.query(
      'INSERT INTO Transactions (user_id, amount, type, reason) VALUES (?, ?, "spent", "Booked a session")',
      [learnerId, SESSION_COST]
    );

    const meetingUrl = generateMeetingUrl();

    await connection.query(`
       INSERT INTO Sessions (mentor_id, learner_id, skill_id, start_time, end_time, status, meeting_url)
       VALUES (?, ?, ?, ?, ?, "upcoming", ?)
    `, [mentorId, learnerId, skillId, sessionStartTime, sessionEndTime, meetingUrl]);

    const [mentorRows] = await connection.query('SELECT name, email FROM Users WHERE id = ?', [mentorId]);
    const [learnerRows] = await connection.query('SELECT name, email FROM Users WHERE id = ?', [learnerId]);
    const [skillRows] = await connection.query('SELECT skill_name FROM Skills WHERE id = ?', [skillId]);

    await connection.commit();

    const mentor = mentorRows[0] || {};
    const learner = learnerRows[0] || {};
    if (mentor.email || learner.email) {
      sendBookingMail({
        mentorEmail: mentor.email,
        mentorName: mentor.name,
        learnerEmail: learner.email,
        learnerName: learner.name,
        skillName: skillRows[0] ? skillRows[0].skill_name : '',
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        meetingUrl,
      }).catch((mailErr) => console.error('Failed to send booking email:', mailErr));
    }

    res.json({ message: 'Session booked successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ message: err.message || 'Booking failed' });
  } finally {
    connection.release();
  }
};

const getMySessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const [sessions] = await pool.query(`
      SELECT s.id, s.mentor_id, s.learner_id, s.skill_id, s.start_time, s.end_time, s.status, s.meeting_url,
        m.name as mentorName, l.name as learnerName,
        sk.skill_name,
        (SELECT COUNT(*) FROM Reviews r WHERE r.session_id = s.id) as hasReviewed
      FROM Sessions s
      JOIN Users m ON s.mentor_id = m.id
      JOIN Users l ON s.learner_id = l.id
      JOIN Skills sk ON s.skill_id = sk.id
      WHERE s.learner_id = ? OR s.mentor_id = ?
      ORDER BY s.start_time DESC
    `, [userId, userId]);

    const formatted = sessions.map(s => {
      const isMentor = s.mentor_id === userId;
      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      return {
        id: s.id,
        role: isMentor ? 'Mentor' : 'Learner',
        partnerName: isMentor ? s.learnerName : s.mentorName,
        mentorId: s.mentor_id,
        learnerId: s.learner_id,
        skillName: s.skill_name,
        status: s.status,
        date: formatDate(start),
        startTime: formatTime(start),
        endTime: formatTime(end),
        hasReviewed: s.hasReviewed > 0,
        meetingUrl: s.meeting_url
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('getMySessions error:', err);
    res.status(500).json({ message: 'Failed to retrieve your sessions' });
  }
};

const cancelSession = async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT * FROM Sessions WHERE id = ? FOR UPDATE',
      [sessionId]
    );
    if (rows.length === 0) throw new Error('Session not found');
    const session = rows[0];
    if (session.learner_id !== userId && session.mentor_id !== userId) throw new Error('Not authorized to cancel this session');
    if (session.status !== 'upcoming') throw new Error('Only upcoming sessions can be cancelled');

    await connection.query('UPDATE Sessions SET status = "cancelled" WHERE id = ?', [sessionId]);
    await connection.query('UPDATE Users SET credits = credits + ? WHERE id = ?', [SESSION_COST, session.learner_id]);
    await connection.query(
      'INSERT INTO Transactions (user_id, amount, type, reason) VALUES (?, ?, "earned", "Refund for cancelled session")',
      [session.learner_id, SESSION_COST]
    );

    await connection.commit();
    res.json({ message: 'Session cancelled successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ message: err.message || 'Failed to cancel session' });
  } finally {
    connection.release();
  }
};

module.exports = { getTimeslots, bookSession, getMySessions, cancelSession };
