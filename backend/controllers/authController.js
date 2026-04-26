const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Please evaluate all constraints and try again.' });

  try {
    const [existing] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'Email address already securely mapped to another account.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query('INSERT INTO Users (name, email, password, credits) VALUES (?, ?, ?, 20)', [name, email, hashedPassword]);
    const userId = result.insertId;

    await pool.query('INSERT INTO Transactions (user_id, amount, type, reason) VALUES (?, 20, "earned", "Initial signup economy bonus")', [userId]);

    const token = generateToken(userId);
    res.cookie('token', token, { 
       httpOnly: true, 
       secure: process.env.NODE_ENV === 'production', 
       sameSite: 'strict', 
       maxAge: 30 * 24 * 60 * 60 * 1000 
    });
    
    res.status(201).json({ id: userId, name, email, credits: 20 });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Please supply credentials cleanly' });

  try {
    const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ message: 'Invalid credentials matching pattern' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials matching pattern' });

    const token = generateToken(user.id);
    res.cookie('token', token, { 
       httpOnly: true, 
       secure: process.env.NODE_ENV === 'production', 
       sameSite: 'strict', 
       maxAge: 30 * 24 * 60 * 60 * 1000 
    });
    
    res.json({ id: user.id, name: user.name, email: user.email, credits: user.credits });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Server database fault: ' + err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, credits, bio, rating FROM Users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not securely found' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: 'Verification error' });
  }
};

const logoutUser = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: 'Secure wipe successful' });
};

module.exports = { registerUser, loginUser, getMe, logoutUser };
