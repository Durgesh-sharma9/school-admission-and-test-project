const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

// Import models
const School = require('./models/School');

async function test() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const school = await School.findOne({ email: 'devgamesszz@gmail.com' });
  if (school) {
    console.log('Found school:', school);
    try {
      school.emailVerified = true;
      await school.save();
      console.log('School saved successfully!');
    } catch (err) {
      console.error('Validation/Save Error:', err);
    }
  } else {
    console.log('School not found.');
  }

  await mongoose.disconnect();
}

test();
