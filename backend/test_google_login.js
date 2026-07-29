const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_school';

// Import models
require('./models/School');
require('./models/SuperAdmin');
require('./models/OTP');

const authController = require('./controllers/authController');

async function test() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const req = {
    body: {
      access_token: 'mock_token_to_trigger_error'
    }
  };

  const res = {
    status: function(code) {
      console.log('Status code:', code);
      return this;
    },
    json: function(data) {
      console.log('JSON Response:', data);
      return this;
    }
  };

  try {
    await authController.googleLogin(req, res);
  } catch (err) {
    console.error('Caught error directly:', err);
  }

  await mongoose.disconnect();
}

test();
