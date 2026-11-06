require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Check if database needs automated seeding
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Auto-seeding initial demo dataset...');
      const seedDatabase = require('../seed/seed');
      // Reconnect/run seeding
      await seedDatabase();
      await connectDB(); // Re-establish connection after seed disconnect
    }

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 EduPulse AI Backend Server running on port ${PORT}`);
      console.log(`📡 REST API endpoint: http://localhost:${PORT}/api`);
      console.log(`✨ Health Check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
      
      // Initialize background automated alert cron
      const { initCronJobs } = require('./services/cronService');
      initCronJobs();
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('[Server] Gracefully shutting down...');
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('[Server Error] Failed to boot server:', err);
    process.exit(1);
  }
};

startServer();
