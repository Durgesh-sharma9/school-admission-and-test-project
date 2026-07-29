const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

// Import models
const School = require('./models/School');

async function test() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const school = await School.findOne({ email: 'devgamesszz@gmail.com' }).lean();
  console.log('Full School Document:', school);

  await mongoose.disconnect();
}

test();
