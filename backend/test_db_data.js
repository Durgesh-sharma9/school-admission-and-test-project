const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

// Import models
require('./models/School');
require('./models/SuperAdmin');

async function test() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const schools = await mongoose.model('School').find({}, 'name email role authProvider');
  console.log('All Schools:', schools);

  const superadmins = await mongoose.model('SuperAdmin').find({}, 'name email role');
  console.log('All SuperAdmins:', superadmins);

  await mongoose.disconnect();
}

test();
