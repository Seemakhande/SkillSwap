const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const corsOrigin = function (origin, callback) {
  const allowedPatterns = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
  if (!origin || allowedPatterns.some(p => p.test(origin))) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST']
  }
});
require('./config/socket')(io);

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const protect = require('./middleware/auth');
const { getTimeslots } = require('./controllers/sessionController');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/api/timeslots/:mentorId', protect, getTimeslots);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'SkillSwap API' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SkillSwap Backend running on port ${PORT}`);
});
