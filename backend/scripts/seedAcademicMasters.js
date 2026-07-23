const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MasterDepartment = require('../models/MasterDepartment');
const MasterCourse = require('../models/MasterCourse');
const MasterSpecialization = require('../models/MasterSpecialization');

const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_admission_crm';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for seeding Academic Masters...');

    // Clear existing masters (optional, but good for clean seed)
    await MasterDepartment.deleteMany({});
    await MasterCourse.deleteMany({});
    await MasterSpecialization.deleteMany({});
    console.log('Cleared existing academic masters.');

    // 1. Seed Departments
    const depts = [
      { name: 'Engineering', code: 'ENG' },
      { name: 'Management', code: 'MGMT' },
      { name: 'Commerce', code: 'COMM' },
      { name: 'Medical', code: 'MED' },
      { name: 'Law', code: 'LAW' },
      { name: 'Arts', code: 'ARTS' },
      { name: 'Science', code: 'SCI' },
      { name: 'Architecture', code: 'ARCH' },
      { name: 'Hotel Management', code: 'HM' },
      { name: 'Pharmacy', code: 'PHARM' }
    ];

    const seededDepts = [];
    for (const d of depts) {
      const dept = new MasterDepartment(d);
      await dept.save();
      seededDepts.push(dept);
      console.log(`Seeded Department: ${dept.name}`);
    }

    // Map departments by code for easy reference
    const deptMap = {};
    seededDepts.forEach(d => {
      deptMap[d.code] = d._id;
    });

    // 2. Seed Courses
    const courses = [
      // ENG
      { name: 'B.Tech', code: 'BTECH', departmentId: deptMap['ENG'] },
      { name: 'M.Tech', code: 'MTECH', departmentId: deptMap['ENG'] },
      { name: 'Diploma', code: 'DIP', departmentId: deptMap['ENG'] },
      // MGMT
      { name: 'MBA', code: 'MBA', departmentId: deptMap['MGMT'] },
      { name: 'BBA', code: 'BBA', departmentId: deptMap['MGMT'] },
      { name: 'PGDM', code: 'PGDM', departmentId: deptMap['MGMT'] },
      // COMM
      { name: 'B.Com', code: 'BCOM', departmentId: deptMap['COMM'] },
      { name: 'M.Com', code: 'MCOM', departmentId: deptMap['COMM'] },
      // MED
      { name: 'MBBS', code: 'MBBS', departmentId: deptMap['MED'] },
      { name: 'BDS', code: 'BDS', departmentId: deptMap['MED'] },
      { name: 'BPT', code: 'BPT', departmentId: deptMap['MED'] }
    ];

    const seededCourses = [];
    for (const c of courses) {
      const course = new MasterCourse(c);
      await course.save();
      seededCourses.push(course);
      console.log(`Seeded Course: ${course.name}`);
    }

    // Map courses by code
    const courseMap = {};
    seededCourses.forEach(c => {
      courseMap[c.code] = c._id;
    });

    // 3. Seed Specializations
    const specializations = [
      // B.Tech
      { name: 'Computer Science', courseId: courseMap['BTECH'] },
      { name: 'Artificial Intelligence', courseId: courseMap['BTECH'] },
      { name: 'Information Technology', courseId: courseMap['BTECH'] },
      { name: 'Civil', courseId: courseMap['BTECH'] },
      { name: 'Mechanical', courseId: courseMap['BTECH'] },
      { name: 'Electrical', courseId: courseMap['BTECH'] },
      // MBA
      { name: 'Finance', courseId: courseMap['MBA'] },
      { name: 'Marketing', courseId: courseMap['MBA'] },
      { name: 'HR', courseId: courseMap['MBA'] },
      { name: 'Business Analytics', courseId: courseMap['MBA'] }
    ];

    for (const s of specializations) {
      const spec = new MasterSpecialization(s);
      await spec.save();
      console.log(`Seeded Specialization: ${spec.name}`);
    }

    console.log('Academic Master seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding academic master data:', error);
    process.exit(1);
  }
};

seedData();
