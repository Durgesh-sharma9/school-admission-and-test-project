const mongoose = require('mongoose');
const School = require('../models/School');
const Enquiry = require('../models/Enquiry');
const Locality = require('../models/Locality');
require('dotenv').config();

const JAIPUR_LOCALITIES = [
  "Malviya Nagar",
  "Vaishali Nagar",
  "Mansarovar",
  "C-Scheme",
  "Jagatpura",
  "Pratap Nagar",
  "Raja Park",
  "Bani Park",
  "Sodala",
  "Sanganer",
  "Shyam Nagar",
  "Gopalpura",
  "Tonk Road",
  "Adarsh Nagar",
  "Civil Lines",
  "Vidhyadhar Nagar"
];

const LAST_NAMES = [
  "Sharma", "Patel", "Gupta", "Verma", "Singh",
  "Iyer", "Reddy", "Choudhury", "Joshi", "Nair",
  "Mehta", "Saxena", "Kapoor", "Malhotra", "Bhatia",
  "Bansal", "Agarwal", "Mishra", "Trivedi", "Shah"
];

const MALE_PARENT_FIRST_NAMES = [
  "Rajesh", "Amit", "Sanjay", "Manoj", "Ramesh",
  "Krishna", "Alok", "Sunil", "Madhav", "Vijay",
  "Rakesh", "Sandeep", "Anil", "Suresh", "Dinesh",
  "Vikram", "Ajay", "Deepak", "Arvind", "Harpreet"
];

const BOY_FIRST_NAMES = [
  "Aarav", "Vihaan", "Ishaan", "Kabir", "Advait",
  "Arjun", "Reyansh", "Aryan", "Rohan", "Dev",
  "Shaurya", "Yash", "Atharv", "Veer", "Vivaan",
  "Laksh", "Ranveer", "Pranav", "Sai", "Aaryan"
];

const GIRL_FIRST_NAMES = [
  "Diya", "Ananya", "Saisha", "Kiara", "Myra",
  "Pooja", "Neha", "Priya", "Aarti", "Sneha",
  "Shruti", "Ritu", "Anjali", "Divya", "Kavita",
  "Jyoti", "Sunita", "Preeti", "Shweta", "Nisha"
];

const CLASS_FLOW = [
  { seeking: "Nursery", prev: "Nursery", minAge: 3 },
  { seeking: "LKG", prev: "Nursery", minAge: 4 },
  { seeking: "UKG", prev: "LKG", minAge: 5 },
  { seeking: "Class 1", prev: "UKG", minAge: 6 },
  { seeking: "Class 2", prev: "Class 1", minAge: 7 },
  { seeking: "Class 3", prev: "Class 2", minAge: 8 },
  { seeking: "Class 4", prev: "Class 3", minAge: 9 },
  { seeking: "Class 5", prev: "Class 4", minAge: 10 },
  { seeking: "Class 6", prev: "Class 5", minAge: 11 },
  { seeking: "Class 7", prev: "Class 6", minAge: 12 },
  { seeking: "Class 8", prev: "Class 7", minAge: 13 },
  { seeking: "Class 9", prev: "Class 8", minAge: 14 },
  { seeking: "Class 10", prev: "Class 9", minAge: 15 },
  { seeking: "Class 11 (Science)", prev: "Class 10", minAge: 16 },
  { seeking: "Class 11 (Commerce)", prev: "Class 10", minAge: 16 },
  { seeking: "Class 11 (Arts)", prev: "Class 10", minAge: 16 },
  { seeking: "Class 12 (Science)", prev: "Class 11 (Science)", minAge: 17 },
  { seeking: "Class 12 (Commerce)", prev: "Class 11 (Commerce)", minAge: 17 },
  { seeking: "Class 12 (Arts)", prev: "Class 11 (Arts)", minAge: 17 }
];

const SOURCES = [
  "Google Search", "Facebook", "Instagram", "YouTube",
  "School Website", "Friend / Relative", "Existing Parent",
  "Teacher Reference", "Newspaper", "Banner / Hoarding",
  "Pamphlet", "Walk-in"
];

const STATUSES = ['New Enquiry', 'Hold', 'Not Interested', 'Admission Confirmed'];

const EXPECTATIONS = [
  "Focus on holistic development and extra-curriculars.",
  "Excellent academic record and focus on science/tech.",
  "Safe environment and good transportation facilities.",
  "Interactive learning methodologies and sports facilities.",
  "Quality infrastructure and individual attention to students.",
  "Looking for CBSE curriculum with strong foundation courses.",
  "Experienced faculty and focus on language/communication skills."
];

const NOTES = [
  "Parent enquired about boarding facilities.",
  "Follow up scheduled for next week.",
  "Requested campus visit this Saturday.",
  "Parent concerned about child's math scores.",
  "Documents to be submitted by Monday.",
  "Registration fee discussion pending.",
  "Friendly parent, highly motivated to join."
];

// Helper to generate a random date of birth based on age
function getRandomDOB(age) {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, month, day);
}

// Helper to generate random Indian phone numbers
function getRandomIndianMobile() {
  const prefixes = ['9', '8', '7', '6'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let remaining = '';
  for (let i = 0; i < 9; i++) {
    remaining += Math.floor(Math.random() * 10);
  }
  return prefix + remaining;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-admission-crm');
    console.log('Connected to MongoDB for Enquiries seeding.');

    // Find the Demo School
    const school = await School.findOne({ email: 'nvn@gmail.com' });
    if (!school) {
      console.error('Demo School not found. Please run seedSchoolAdmin.js first.');
      process.exit(1);
    }
    const schoolId = school._id;

    // 1. Clear existing localites and enquiries for this school
    await Locality.deleteMany({ schoolId });
    await Enquiry.deleteMany({ schoolId });
    console.log('Cleared existing localities and enquiries for Demo School.');

    // 2. Seed Localities
    const seededLocalities = [];
    for (const name of JAIPUR_LOCALITIES) {
      const loc = new Locality({
        schoolId,
        name,
        nameLower: name.toLowerCase(),
        status: 'active',
        isApproved: true,
        createdBy: 'admin',
        timesUsed: 0
      });
      await loc.save();
      seededLocalities.push(loc);
    }
    console.log(`Seeded ${seededLocalities.length} localities.`);

    // 3. Seed Enquiries
    // Find the latest enquiry to get the base sequence number
    const latestEnquiry = await Enquiry.findOne({
      enquiryId: new RegExp(`^ENQ-${new Date().getFullYear()}-`)
    })
    .sort({ enquiryId: -1 })
    .exec();

    let startSequence = 1;
    if (latestEnquiry) {
      const idParts = latestEnquiry.enquiryId.split('-');
      if (idParts.length === 3) {
        const lastSeq = parseInt(idParts[2], 10);
        if (!isNaN(lastSeq)) {
          startSequence = lastSeq + 1;
        }
      }
    }

    const enquiriesToSeed = [];
    const count = 50;

    for (let i = 0; i < count; i++) {
      const currentSequence = startSequence + i;
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const isBoy = Math.random() > 0.4;
      const studentFirstName = isBoy 
        ? BOY_FIRST_NAMES[Math.floor(Math.random() * BOY_FIRST_NAMES.length)]
        : GIRL_FIRST_NAMES[Math.floor(Math.random() * GIRL_FIRST_NAMES.length)];
      
      const studentName = `${studentFirstName} ${lastName}`;
      const gender = isBoy ? 'Male' : 'Female';
      
      const parentFirstName = MALE_PARENT_FIRST_NAMES[Math.floor(Math.random() * MALE_PARENT_FIRST_NAMES.length)];
      const parentName = `${parentFirstName} ${lastName}`;
      
      const mobile = getRandomIndianMobile();
      // 80% chance to copy whatsapp from mobile
      const whatsapp = Math.random() > 0.2 ? mobile : getRandomIndianMobile();
      const email = `${parentFirstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

      // Select Class & Previous Class logic
      const flow = CLASS_FLOW[Math.floor(Math.random() * CLASS_FLOW.length)];
      const classSeeking = flow.seeking;
      const previousClass = flow.prev;
      const dob = getRandomDOB(flow.minAge);

      const previousSchool = `${studentFirstName}'s Previous Academy`;
      
      // Select random locality
      const localityObj = seededLocalities[Math.floor(Math.random() * seededLocalities.length)];
      const area = localityObj.name;
      const localityId = localityObj._id;
      const society = `Block-${String.fromCharCode(65 + Math.floor(Math.random() * 6))} Residency`;
      const fullAddress = `${Math.floor(Math.random() * 400) + 1}, ${society}, ${area}, Jaipur`;
      
      const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
      const expectations = EXPECTATIONS[Math.floor(Math.random() * EXPECTATIONS.length)];
      const notes = NOTES[Math.floor(Math.random() * NOTES.length)];
      
      const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

      // Date of enquiry: random within last 45 days
      const daysAgo = Math.floor(Math.random() * 45);
      const enqDate = new Date();
      enqDate.setDate(enqDate.getDate() - daysAgo);
      const saveDate = enqDate.toISOString().split('T')[0];
      const saveTime = enqDate.toTimeString().split(' ')[0];

      // Formulate unique enquiryId
      const currentYear = new Date().getFullYear();
      const paddedSequence = String(currentSequence).padStart(4, '0');
      const enquiryId = `ENQ-${currentYear}-${paddedSequence}`;

      // Build journey depending on status
      const journey = [
        {
          stage: 'Form Submitted',
          status: 'Completed',
          createdAt: enqDate,
          completedAt: enqDate,
          notes: 'Initial admission form submitted.'
        }
      ];

      let isConvertedToAdmission = false;
      let convertedAt = null;
      let journeyStatus = 'ACTIVE';

      if (status === 'New Enquiry') {
        // 50% chance of having a pending task for Today/Tomorrow
        if (Math.random() > 0.5) {
          const taskDays = Math.random() > 0.5 ? 0 : 1; // 0 = today, 1 = tomorrow
          const followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + taskDays);
          followUpDate.setHours(10, 0, 0, 0);

          journey.push({
            stage: 'Call',
            status: 'Current',
            createdAt: enqDate,
            followUpDate: followUpDate,
            notes: 'Schedule introductory call to review child registration.'
          });
        }
      } else if (status === 'Hold') {
        const taskRand = Math.random();
        let taskDays = 0;
        let derivedStatus = 'Current';
        let notesText = 'Discuss fee structure and transport routes.';
        if (taskRand < 0.3) {
          taskDays = -3; // Overdue task (3 days ago)
          derivedStatus = 'Overdue';
          notesText = 'Overdue follow-up call: Parent requested info on sibling discount.';
        } else if (taskRand < 0.6) {
          taskDays = 0; // Today's task
          derivedStatus = 'Current';
          notesText = 'Today callback: Discuss curriculum structure and extra activities.';
        } else {
          taskDays = 2; // Upcoming task
          derivedStatus = 'Upcoming';
          notesText = 'Upcoming call: Discuss campus visit feedback and admission status.';
        }

        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + taskDays);
        followUpDate.setHours(11, 0, 0, 0);

        journey.push({
          stage: 'Call',
          status: derivedStatus,
          createdAt: new Date(enqDate.getTime() + 24 * 60 * 60 * 1000),
          followUpDate: followUpDate,
          notes: notesText
        });
      } else if (status === 'Not Interested') {
        const callTime = new Date(enqDate.getTime() + 24 * 60 * 60 * 1000);
        journey.push({
          stage: 'Call',
          status: 'Completed',
          createdAt: callTime,
          completedAt: callTime,
          followUpDate: callTime, // Completed task
          notes: 'Called parent. They decided to opt for a school closer to home.'
        });
        journey.push({
          stage: 'Rejected',
          status: 'Completed',
          createdAt: callTime,
          completedAt: callTime,
          notes: 'Marked not interested.'
        });
        journeyStatus = 'CLOSED';
      } else if (status === 'Admission Confirmed') {
        const callTime = new Date(enqDate.getTime() + 24 * 60 * 60 * 1000);
        const visitTime = new Date(enqDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        const confirmTime = new Date(enqDate.getTime() + 5 * 24 * 60 * 60 * 1000);

        journey.push({
          stage: 'Call',
          status: 'Completed',
          createdAt: callTime,
          completedAt: callTime,
          followUpDate: callTime, // Completed task
          notes: 'Call went well. Scheduled campus visit.'
        });
        journey.push({
          stage: 'Campus Visit',
          status: 'Completed',
          createdAt: visitTime,
          completedAt: visitTime,
          followUpDate: visitTime, // Completed task
          notes: 'Parent and child visited the campus. Very satisfied with classes.'
        });
        journey.push({
          stage: 'Admission Confirmed',
          status: 'Completed',
          createdAt: confirmTime,
          completedAt: confirmTime,
          notes: 'Registration fee paid and admission confirmed.'
        });
        
        isConvertedToAdmission = true;
        convertedAt = confirmTime;
        journeyStatus = 'CLOSED';
      }

      // Update locality count
      localityObj.timesUsed += 1;
      await localityObj.save();

      enquiriesToSeed.push({
        schoolId,
        enquiryId,
        studentName,
        gender,
        dob,
        classSeeking,
        previousSchool,
        previousClass,
        parentName,
        mobile,
        whatsapp,
        email,
        state: "Rajasthan",
        city: "Jaipur",
        area,
        localityId,
        society,
        fullAddress,
        source,
        expectations,
        notes,
        status,
        saveDate,
        saveTime,
        isConvertedToAdmission,
        convertedAt,
        journeyStatus,
        journey
      });
    }

    await Enquiry.insertMany(enquiriesToSeed);
    console.log(`Successfully seeded ${enquiriesToSeed.length} enquiries!`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding enquiries failed:', err);
    process.exit(1);
  }
}

seed();
