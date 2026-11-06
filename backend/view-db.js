require('dotenv').config();
const mongoose = require('mongoose');

async function viewDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edupulse';
  console.log(`\n======================================================`);
  console.log(`🔍 Connecting to MongoDB: ${uri}`);
  console.log(`======================================================`);

  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    console.log(`✅ Status: CONNECTED`);
    console.log(`📁 Database Name: ${db.databaseName}\n`);

    const collections = await db.listCollections().toArray();
    console.log(`--- COLLECTIONS IN DATABASE (${collections.length}) ---`);
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`  • ${c.name.padEnd(16)} : ${count} records`);
    }

    console.log(`\n--- RECENT REGISTERED USERS ---`);
    const users = await db.collection('users')
      .find({})
      .project({ name: 1, email: 1, role: 1, department: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray();
    console.table(users.map(u => ({
      ID: u._id.toString().slice(-6),
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Department: u.department,
      Joined: new Date(u.createdAt).toLocaleTimeString(),
    })));

    console.log(`\n--- RECENT MARKS RECORDED ---`);
    const marks = await db.collection('marks')
      .find({})
      .project({ assessmentName: 1, score: 1, maxScore: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();
    console.table(marks.map(m => ({
      Assessment: m.assessmentName,
      Score: `${m.score} / ${m.maxScore}`,
      Recorded: new Date(m.updatedAt || Date.now()).toLocaleTimeString(),
    })));

    console.log(`======================================================\n`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error connecting to database:', err.message);
  }
}

viewDatabase();
