const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Unpacks { id } logic
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token signature invalid or expired. Please re-authenticate.' });
  }
};

module.exports = protect;
