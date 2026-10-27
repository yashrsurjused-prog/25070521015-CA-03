import 'dotenv/config';

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = Number(process.env.PORT) || 5000;

let server;
let isShuttingDown = false;

async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    console.error('Initial MongoDB connection failed. The API will not start.');
    process.exit(1);
  }

  server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  server.on('error', async (error) => {
    console.error(`Server failed to start: ${error.message}`);
    await disconnectDB();
    process.exit(1);
  });
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Shutting down gracefully...`);

  try {
    if (server && server.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      console.log('HTTP server closed');
    }

    await disconnectDB();
    console.log('Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
