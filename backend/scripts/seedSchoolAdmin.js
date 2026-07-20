const mongoose = require('mongoose');
const School = require('../models/School');
const QRCode = require('qrcode');
require('dotenv').config();

const seedSchoolAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-admission-crm');
    console.log('Connected to MongoDB');

    let demoSchool = await School.findOne({ email: 'admin@demo-school.com' });
    
    if (demoSchool) {
      demoSchool.password = 'school123';
      await demoSchool.save();
      console.log('Updated existing Demo School Admin password to: school123');
    } else {
      demoSchool = new School({
        name: 'Demo International School',
        email: 'admin@demo-school.com',
        password: 'school123',
        phone: '+91 9876543210',
        address: '123 Education Lane, Knowledge Park, Jaipur',
        tagline: 'Excellence in Learning & Character',
        academicSession: '2026–2027',
        website: 'https://demo-school.com',
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
    console.log('Email: admin@demo-school.com');
    console.log('Password: school123');
    console.log('------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding School Admin:', error);
    process.exit(1);
  }
};

seedSchoolAdmin();
