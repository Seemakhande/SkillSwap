const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { saveMessage, roomFor } = require('../controllers/chatController');

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const rawCookie = socket.request.headers.cookie || '';
      const parsed = cookie.parse(rawCookie);
      const token = parsed.token;
      if (!token) return next();
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_room', (roomId) => {
      if (typeof roomId === 'string') socket.join(roomId);
    });

    socket.on('send_message', async (data) => {
      try {
        const senderId = socket.userId;
        const receiverId = parseInt(data.receiverId, 10);
        const text = (data.text || '').toString().trim();
        if (!senderId || !receiverId || !text) return;

        const saved = await saveMessage({ senderId, receiverId, message: text });
        const roomId = roomFor(senderId, receiverId);

        const payload = {
          id: saved.id,
          text: saved.message,
          senderId: saved.sender_id,
          receiverId: saved.receiver_id,
          timestamp: saved.timestamp,
          roomId
        };

        io.to(roomId).emit('receive_message', payload);
      } catch (err) {
        console.error('Socket send_message error:', err);
      }
    });

    socket.on('disconnect', () => {});
  });
};
