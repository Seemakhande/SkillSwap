const pool = require('../config/db');

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTime = (value) => /^\d{2}:\d{2}$/.test(value);

const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, credits, bio, rating, created_at FROM Users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'Account not mapped.' });

    const profile = users[0];

    const [statsRows] = await pool.query(`
      SELECT
        SUM(CASE WHEN mentor_id = ? AND status = 'completed' THEN 1 ELSE 0 END) as sessionsTaught,
        SUM(CASE WHEN learner_id = ? AND status = 'completed' THEN 1 ELSE 0 END) as sessionsLearned
      FROM Sessions WHERE mentor_id = ? OR learner_id = ?
    `, [req.user.id, req.user.id, req.user.id, req.user.id]);

    const [earnedRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM Transactions WHERE user_id = ? AND type = 'earned'`,
      [req.user.id]
    );
    const [spentRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM Transactions WHERE user_id = ? AND type = 'spent'`,
      [req.user.id]
    );

    profile.stats = {
      sessionsTaught: Number(statsRows[0].sessionsTaught) || 0,
      sessionsLearned: Number(statsRows[0].sessionsLearned) || 0,
      totalEarned: Number(earnedRows[0].total) || 0,
      totalSpent: Number(spentRows[0].total) || 0
    };

    const [skillsOffered] = await pool.query(`
      SELECT s.skill_name FROM UserSkills us 
      JOIN Skills s ON us.skill_id = s.id 
      WHERE us.user_id = ? AND us.type = 'offer'
    `, [req.user.id]);
    
    const [skillsLearning] = await pool.query(`
      SELECT s.skill_name FROM UserSkills us 
      JOIN Skills s ON us.skill_id = s.id 
      WHERE us.user_id = ? AND us.type = 'learn'
    `, [req.user.id]);

    profile.skillsOffered = skillsOffered.map(s => s.skill_name);
    profile.skillsLearning = skillsLearning.map(s => s.skill_name);

    const [availability] = await pool.query(`
      SELECT id, start_time, end_time
      FROM TimeSlots
      WHERE user_id = ? AND is_booked = false
      ORDER BY start_time ASC
    `, [req.user.id]);

    const pad = (num) => num.toString().padStart(2, '0');
    profile.availabilitySlots = availability.map((slot) => {
      const start = new Date(slot.start_time);
      const end = new Date(slot.end_time);
      return {
        id: slot.id,
        date: start.toISOString().split('T')[0],
        startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`
      };
    });

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Database resolution hook failed.' });
  }
};

const updateProfile = async (req, res) => {
   const { name, email, bio, skillsOffered, skillsLearning, availabilitySlots = [] } = req.body;
   const userId = req.user.id;
   
   const connection = await pool.getConnection();
   try {
     await connection.beginTransaction();

     await connection.query('UPDATE Users SET name = ?, email = ?, bio = ? WHERE id = ?', [name, email, bio, userId]);
     
     await connection.query('DELETE FROM UserSkills WHERE user_id = ?', [userId]);

     const syncSkills = async (skillNamesArray, type) => {
        if (!skillNamesArray || skillNamesArray.length === 0) return;
        for (let sName of skillNamesArray) {
           let skillId;
           const [existing] = await connection.query('SELECT id FROM Skills WHERE skill_name = ?', [sName]);
           if (existing.length > 0) { 
              skillId = existing[0].id; 
           } else {
              const [inserted] = await connection.query('INSERT INTO Skills (skill_name, category) VALUES (?, ?)', [sName, 'General']);
              skillId = inserted.insertId;
           }
           await connection.query('INSERT IGNORE INTO UserSkills (user_id, skill_id, type) VALUES (?, ?, ?)', [userId, skillId, type]);
        }
     };

     await syncSkills(skillsOffered, 'offer');
     await syncSkills(skillsLearning, 'learn');

     const parsedSlots = [];
     for (const slot of availabilitySlots) {
       const date = slot?.date;
       const startTime = slot?.startTime;
       const endTime = slot?.endTime;

       if (!isValidDate(date) || !isValidTime(startTime) || !isValidTime(endTime)) {
         throw new Error('Invalid availability slot format');
       }

       if (endTime <= startTime) {
         throw new Error('Availability end time must be after start time');
       }

       parsedSlots.push({
         startDateTime: `${date} ${startTime}:00`,
         endDateTime: `${date} ${endTime}:00`
       });
     }

     await connection.query('DELETE FROM TimeSlots WHERE user_id = ? AND is_booked = false', [userId]);
     for (const slot of parsedSlots) {
       await connection.query(
         'INSERT INTO TimeSlots (user_id, start_time, end_time, is_booked) VALUES (?, ?, ?, false)',
         [userId, slot.startDateTime, slot.endDateTime]
       );
     }

     await connection.commit();
     res.json({ message: 'Profile updated securely via SQL transactions.' });
   } catch (err) {
     await connection.rollback();
     res.status(500).json({ message: err.message || 'Rollback exception triggered while mapping skills arrays.' });
   } finally {
     connection.release();
   }
};

module.exports = { getProfile, updateProfile };
