const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');
require('dotenv').config();

const seedSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-admission-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if Super Admin already exists
    const existingSuperAdmin = await SuperAdmin.findOne({ email: 'superadmin@platform.com' });
    if (existingSuperAdmin) {
      console.log('Super Admin already exists');
      process.exit(0);
    }

    // Create Super Admin
    const superAdmin = await SuperAdmin.create({
      name: 'Super Admin',
      email: 'superadmin@platform.com',
      password: 'admin123',
      role: 'super-admin',
      isActive: true,
    });

    console.log('Super Admin created successfully:');
    console.log('Email: superadmin@platform.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Super Admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
