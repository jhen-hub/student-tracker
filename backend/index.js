import http from 'http';
import app from './src/server.js';
import { initSocket } from './src/socket.js';

const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});