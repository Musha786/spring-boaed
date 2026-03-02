const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Sprint Board backend running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);

io.on('connection', (socket) => {
  socket.on('joinBoard', (boardId) => {
    socket.join(`board_${boardId}`);
  });

  socket.on('leaveBoard', (boardId) => {
    socket.leave(`board_${boardId}`);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});

