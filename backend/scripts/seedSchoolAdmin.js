const mongoose = require('mongoose');
const School = require('../models/School');
const QRCode = require('qrcode');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const seedSchoolAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let demoSchool = await School.findOne({ email: 'nvn@gmail.com' });
    if (!demoSchool) {
      demoSchool = await School.findOne({ email: 'admin@demo-school.com' });
    }
    
    if (demoSchool) {
      demoSchool.email = 'nvn@gmail.com';
      demoSchool.password = 'school123';
      demoSchool.emailVerified = true;
      demoSchool.website = 'https://jdintschool.com';
      await demoSchool.save();
      console.log('Updated Demo School Admin with email: nvn@gmail.com and password: school123');
    } else {
      demoSchool = new School({
        name: 'Demo International School',
        email: 'nvn@gmail.com',
        emailVerified: true,
        password: 'school123',
        phone: '+91 9876543210',
        address: '123 Education Lane, Knowledge Park, Jaipur',
        tagline: 'Excellence in Learning & Character',
        academicSession: '2026–2027',
        website: 'https://jdintschool.com',
        role: 'school-admin',
        subscription: {
          plan: 'pro',
          status: 'active',
        },
      });

      await demoSchool.save();

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const admissionFormLink = `${frontendUrl}/public/admission/${demoSchool._id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(admissionFormLink, { width: 400, margin: 2 });
      
      demoSchool.qrCodeUrl = qrCodeDataUrl;
      demoSchool.admissionFormLink = admissionFormLink;
      await demoSchool.save();

      console.log('Created Demo School Admin successfully!');
    }

    console.log('------------------------------------');
    console.log('SCHOOL ADMIN DEMO CREDENTIALS');
    console.log('Email: nvn@gmail.com');
    console.log('Password: school123');
    console.log('------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding School Admin:', error);
    process.exit(1);
  }
};

seedSchoolAdmin();
