const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edupulse';
  const isRemote = uri.includes('mongodb+srv://') || (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('127.0.0.1') && !process.env.MONGODB_URI.includes('localhost'));
  const timeoutMs = isRemote ? 15000 : 3000;
  
  try {
    // Attempt connection (15s for remote cloud DB, 3s for local fallback)
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs,
    });
    const logUri = isRemote ? uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : uri;
    console.log(`[Database] MongoDB connected successfully to: ${logUri}`);
  } catch (err) {
    console.warn(`[Database] Warning: Could not connect to external MongoDB at ${uri} (${err.message}).`);
    console.log('[Database] Initializing embedded MongoDB Memory Server for seamless hackathon demo...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Embedded MongoDB Memory Server started successfully at: ${memoryUri}`);
    } catch (memErr) {
      console.error('[Database] Fatal: Failed to initialize MongoDB Memory Server:', memErr);
      throw memErr;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
