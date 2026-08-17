const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const seedSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@crm.com';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin@08afupc4';

    // Check if Super Admin already exists
    const existingSuperAdmin = await SuperAdmin.findOne({ email: adminEmail });
    if (existingSuperAdmin) {
      console.log(`Super Admin (${adminEmail}) already exists`);
      process.exit(0);
    }

    // Create Super Admin
    const superAdmin = await SuperAdmin.create({
      name: 'Super Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'super-admin',
      isActive: true,
    });

    console.log('Super Admin created successfully:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Please change the password after first login');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Super Admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
