import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Wait until we explicitly connect
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinRoom = (roomName, payload = {}) => {
  if (!socket.connected) connectSocket();
  socket.emit(`join:${roomName}`, payload);
};
