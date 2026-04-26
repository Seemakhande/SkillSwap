const pool = require('../config/db');

const getSkills = async (req, res) => {
  try {
    const [skills] = await pool.query('SELECT id, skill_name as name, category FROM Skills ORDER BY category, skill_name');
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving skills catalog' });
  }
};

const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT category FROM Skills ORDER BY category');
    res.json(rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving categories' });
  }
};

const getMentors = async (req, res) => {
  try {
    const { skill, category, rating } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 6));
    const offset = (page - 1) * limit;

    let where = `us.type = 'offer' AND u.id != ?`;
    const params = [req.user ? req.user.id : 0];

    if (skill) {
      where += ` AND s.skill_name LIKE ?`;
      params.push(`%${skill}%`);
    }

    if (category && category !== 'All Categories') {
      where += ` AND s.category = ?`;
      params.push(category);
    }

    if (rating) {
      where += ` AND u.rating >= ?`;
      params.push(parseFloat(rating));
    }

    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM Users u
      JOIN UserSkills us ON u.id = us.user_id
      JOIN Skills s ON us.skill_id = s.id
      WHERE ${where}
    `;
    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const listQuery = `
      SELECT DISTINCT u.id, u.name, u.rating, u.bio
      FROM Users u
      JOIN UserSkills us ON u.id = us.user_id
      JOIN Skills s ON us.skill_id = s.id
      WHERE ${where}
      ORDER BY u.rating DESC, u.id ASC
      LIMIT ? OFFSET ?
    `;
    const [mentors] = await pool.query(listQuery, [...params, limit, offset]);

    for (let m of mentors) {
      const [mSkills] = await pool.query(`
        SELECT s.skill_name FROM UserSkills us
        JOIN Skills s ON us.skill_id = s.id
        WHERE us.user_id = ? AND us.type = 'offer'
      `, [m.id]);
      m.skills = mSkills.map(s => s.skill_name);
      m.headline = m.bio ? (m.bio.length > 80 ? m.bio.slice(0, 77) + '...' : m.bio) : 'Passionate about teaching';
      m.hourlyRate = 10;
    }

    res.json({ users: mentors, totalPages, page, total });
  } catch (err) {
    console.error('getMentors error:', err);
    res.status(500).json({ message: 'Error retrieving platform mentors' });
  }
};

const getMentorById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.query(
      'SELECT id, name, email, bio, rating, credits FROM Users WHERE id = ?',
      [id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'Mentor not found' });

    const mentor = users[0];
    const [skills] = await pool.query(`
      SELECT s.skill_name, s.category FROM UserSkills us
      JOIN Skills s ON us.skill_id = s.id
      WHERE us.user_id = ? AND us.type = 'offer'
    `, [id]);
    mentor.skills = skills.map(s => s.skill_name);
    mentor.hourlyRate = 10;

    res.json(mentor);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving mentor details' });
  }
};

module.exports = { getSkills, getCategories, getMentors, getMentorById };
