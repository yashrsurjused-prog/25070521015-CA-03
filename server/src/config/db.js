import mongoose from 'mongoose';

const DATABASE_NAME = 'smartCampusDB';

const READY_STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to server/.env (see server/.env.example).',
    );
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      dbName: DATABASE_NAME,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`,
    );

    return connection;
  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      console.error(
        'MongoDB is unreachable. Make sure MongoDB Community Server is installed and running on 127.0.0.1:27017.',
      );
    }

    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}

export function getDatabaseStatus() {
  return READY_STATE_LABELS[mongoose.connection.readyState] || 'unknown';
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export { DATABASE_NAME };
