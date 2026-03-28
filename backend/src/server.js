import http from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { setupSocketServer } from './sockets/socketServer.js';

const httpServer = http.createServer(app);
const realtime = setupSocketServer(httpServer);
app.locals.realtime = realtime;

httpServer.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API running on :${env.port}`);
});
