import {
  DATABASE_NAME,
  getDatabaseStatus,
  isDatabaseConnected,
} from '../config/db.js';

const getHealth = (req, res) => {
  const databaseConnected = isDatabaseConnected();

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    status: databaseConnected ? 'healthy' : 'degraded',
    message: databaseConnected
      ? 'Smart Campus Service Portal backend and database are running'
      : 'Smart Campus Service Portal backend is running but the database is not connected',
    server: {
      status: 'running',
    },
    database: {
      name: DATABASE_NAME,
      status: getDatabaseStatus(),
      connected: databaseConnected,
    },
    timestamp: new Date().toISOString(),
  });
};

export { getHealth };
