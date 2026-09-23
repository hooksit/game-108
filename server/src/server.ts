import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { ClientToServerEvents, ServerToClientEvents } from '@game-108/shared';
import { registerSocketHandlers } from './sockets/GameSocket';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In production, serve the built React frontend
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', game: '108', timestamp: Date.now() });
});

// Setup Socket.IO
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// Single Page Application fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  🃏 Игра 108 Сервер запущен на порту: ${PORT}`);
  console.log(`  🌐 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
});
