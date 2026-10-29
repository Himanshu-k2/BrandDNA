import mongoose from 'mongoose';

/**
 * MongoDB connection helper.
 * Supports connection pooling and graceful error handling.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️  MONGODB_URI is not defined in environment variables. Database features will be unavailable.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5001, // Fail fast if server is unreachable
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Safely drop obsolete legacy indexes if present
    try {
      const usersColl = conn.connection.db.collection('users');
      const userIndexes = await usersColl.indexes();
      if (userIndexes.some((idx) => idx.name === 'username_1')) {
        await usersColl.dropIndex('username_1');
        console.log('🧹 Cleaned up legacy username_1 unique index on users collection');
      }
    } catch {
      // Ignore if collection does not exist or index already dropped
    }

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // In production, you may want to exit, but in dev/initial phase, allow app to report status via /api/health
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

/**
 * Returns human-readable MongoDB connection state.
 */
export const getDatabaseState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const readyState = mongoose.connection.readyState;
  return {
    state: states[readyState] || 'unknown',
    isConnected: readyState === 1,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};

/**
 * Closes the database connection cleanly (useful for graceful shutdown and tests).
 */
export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};
