const mongoose = require('mongoose');
const School = require('../models/School');
const Payment = require('../models/Payment');
const SubscriptionRequest = require('../models/SubscriptionRequest');
require('dotenv').config();

const resetNvnPlan = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-admission-crm');
    console.log('Connected to MongoDB');

    const school = await School.findOne({ email: 'nvn@gmail.com' });
    if (!school) {
      console.log('School nvn@gmail.com not found!');
      process.exit(1);
    }

    // Reset subscription details to Free Trial
    school.subscription = {
      plan: 'free-trial',
      status: 'active',
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      assessmentEnabled: false,
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    };
    await school.save();
    console.log('NVN Sen. Sec. School subscription reset to Free Trial!');

    // Delete existing payment logs for NVN to clean ledger
    const paymentDel = await Payment.deleteMany({ school: school._id });
    console.log(`Deleted ${paymentDel.deletedCount} payment receipts for NVN school.`);

    // Delete existing subscription requests to allow fresh checkout
    const requestDel = await SubscriptionRequest.deleteMany({ organizationId: school._id });
    console.log(`Deleted ${requestDel.deletedCount} subscription request logs for NVN school.`);

    console.log('Reset completed! NVN Sen. Sec. School can now request and purchase plans fresh.');
    process.exit(0);
  } catch (err) {
    console.error('Resetting NVN plan failed:', err);
    process.exit(1);
  }
};

resetNvnPlan();
