import { Server } from 'socket.io';

export const setupSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    socket.on('attendance:subscribe', (userId) => socket.join(`user:${userId}`));
  });

  return {
    io,
    emitAttendanceUpdated(userId, payload) {
      io.to(`user:${userId}`).emit('attendance:updated', payload);
    }
  };
};
