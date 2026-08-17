const mongoose = require('mongoose');
const School = require('../models/School');
const Assessment = require('../models/Assessment');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const ASSESSMENTS = [
  {
    name: "Class 1 Admission Evaluation",
    class: "Class 1",
    duration: 30,
    instructions: "Answer all questions. Each section is compulsory. Parents may assist with reading instructions but child must answer.",
    sections: [
      {
        name: "English Literacy",
        questions: [
          {
            type: "MCQ",
            question: "Which of the following is a vowel?",
            options: ["b", "d", "e", "f"],
            correctAnswer: "C", // option 'e' is index 2 -> C
            marks: 2
          },
          {
            type: "One Word",
            question: "What is the opposite of 'Hot'?",
            correctAnswer: "cold",
            marks: 2
          },
          {
            type: "True / False",
            question: "The letter 'Z' comes before the letter 'Y' in the alphabet.",
            correctAnswer: "False",
            marks: 1
          },
          {
            type: "Fill Blank",
            question: "An _____ is a red, sweet fruit.",
            correctAnswer: "apple",
            marks: 2
          }
        ]
      },
      {
        name: "Mathematics Foundation",
        questions: [
          {
            type: "MCQ",
            question: "What is 3 + 4?",
            options: ["5", "6", "7", "8"],
            correctAnswer: "C", // option '7' is index 2 -> C
            marks: 2
          },
          {
            type: "MCQ",
            question: "Which number is the smallest?",
            options: ["12", "5", "18", "9"],
            correctAnswer: "B", // option '5' is index 1 -> B
            marks: 2
          },
          {
            type: "One Word",
            question: "What number comes after 9?",
            correctAnswer: "10",
            marks: 2
          }
        ]
      }
    ]
  },
  {
    name: "Class 6 Entrance Scholarship Test",
    class: "Class 6",
    duration: 60,
    instructions: "Attempt all questions. Calculations should be shown in rough work if applicable. No calculators allowed.",
    sections: [
      {
        name: "Mathematics Aptitude",
        questions: [
          {
            type: "MCQ",
            question: "Find the value of x if 2x + 5 = 15.",
            options: ["3", "5", "7", "10"],
            correctAnswer: "B", // option '5' is index 1 -> B
            marks: 3
          },
          {
            type: "MCQ",
            question: "What is the perimeter of a rectangle with length 8cm and width 5cm?",
            options: ["13cm", "26cm", "40cm", "20cm"],
            correctAnswer: "B", // option '26cm' is index 1 -> B
            marks: 3
          },
          {
            type: "Fill Blank",
            question: "A triangle with all three equal sides is called an __________ triangle.",
            correctAnswer: "equilateral",
            marks: 2
          },
          {
            type: "One Word",
            question: "What is the fraction 3/4 converted into a percentage? (Exclude % sign)",
            correctAnswer: "75",
            marks: 2
          }
        ]
      },
      {
        name: "General Science",
        questions: [
          {
            type: "MCQ",
            question: "Which gas do plants absorb from the atmosphere for photosynthesis?",
            options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
            correctAnswer: "B", // option 'Carbon Dioxide' is index 1 -> B
            marks: 2
          },
          {
            type: "True / False",
            question: "Light travels in a straight line.",
            correctAnswer: "True",
            marks: 1
          },
          {
            type: "Descriptive",
            question: "Explain the role of water in photosynthesis.",
            referenceAnswer: "Water is absorbed by the roots of plants and transported to the leaves. It splits during the light reaction to provide electrons and protons, and releases oxygen as a byproduct, helping build glucose.",
            marks: 5
          }
        ]
      }
    ]
  },
  {
    name: "Class 10 General Aptitude Assessment",
    class: "Class 10",
    duration: 90,
    instructions: "Please make sure you have a stable internet connection. Read all passages carefully before answering.",
    sections: [
      {
        name: "English Grammar & Comprehension",
        questions: [
          {
            type: "MCQ",
            question: "Identify the correct active voice form: 'The book was written by Premchand.'",
            options: [
              "Premchand wrote the book.",
              "Premchand had written the book.",
              "Premchand writes the book.",
              "Premchand is writing the book."
            ],
            correctAnswer: "A", // option 'Premchand wrote the book.' is index 0 -> A
            marks: 3
          },
          {
            type: "Fill Blank",
            question: "Neither the teacher nor the students ______ present in the lab yesterday.",
            correctAnswer: "were",
            marks: 2
          }
        ]
      },
      {
        name: "Algebra & Geometry",
        questions: [
          {
            type: "MCQ",
            question: "The discriminant of the quadratic equation x^2 - 4x + 4 = 0 is:",
            options: ["4", "-4", "0", "8"],
            correctAnswer: "C", // option '0' is index 2 -> C
            marks: 3
          },
          {
            type: "MCQ",
            question: "What is the value of sin(30) + cos(60)?",
            options: ["0", "0.5", "1", "1.5"],
            correctAnswer: "C", // option '1' is index 2 -> C
            marks: 3
          },
          {
            type: "One Word",
            question: "Find the distance between points (0,0) and (3,4).",
            correctAnswer: "5",
            marks: 2
          }
        ]
      },
      {
        name: "General Science",
        questions: [
          {
            type: "MCQ",
            question: "Which of the following is a noble gas?",
            options: ["Oxygen", "Nitrogen", "Argon", "Fluorine"],
            correctAnswer: "C", // option 'Argon' is index 2 -> C
            marks: 2
          },
          {
            type: "True / False",
            question: "Acids turn red litmus paper blue.",
            correctAnswer: "False",
            marks: 2
          },
          {
            type: "Descriptive",
            question: "State Mendel's Law of Segregation.",
            referenceAnswer: "Mendel's Law of Segregation states that during gamete formation, the alleles for each gene segregate from each other so that each gamete carries only one allele for each gene.",
            marks: 5
          }
        ]
      }
    ]
  },
  {
    name: "Class 11 Science Entrance Assessment",
    class: "Class 11 (Science)",
    duration: 90,
    instructions: "Calculators are not permitted. Rough sheets can be used for calculations.",
    sections: [
      {
        name: "Physics Core",
        questions: [
          {
            type: "MCQ",
            question: "The acceleration due to gravity on the surface of the Earth is approximately:",
            options: ["9.8 m/s^2", "8.9 m/s^2", "1.6 m/s^2", "10.8 m/s^2"],
            correctAnswer: "A", // option '9.8 m/s^2' is index 0 -> A
            marks: 3
          },
          {
            type: "MCQ",
            question: "If the focal length of a spherical mirror is 15 cm, what is its radius of curvature?",
            options: ["7.5 cm", "15 cm", "30 cm", "45 cm"],
            correctAnswer: "C", // option '30 cm' is index 2 -> C
            marks: 3
          },
          {
            type: "True / False",
            question: "Sound waves are transverse waves.",
            correctAnswer: "False",
            marks: 2
          }
        ]
      },
      {
        name: "Chemistry Core",
        questions: [
          {
            type: "MCQ",
            question: "The chemical formula of Plaster of Paris is:",
            options: ["CaSO4.2H2O", "CaSO4.1/2H2O", "CaSO4.H2O", "2CaSO4.H2O"],
            correctAnswer: "B", // option 'CaSO4.1/2H2O' is index 1 -> B
            marks: 3
          },
          {
            type: "MCQ",
            question: "Which element has the atomic number 17?",
            options: ["Fluorine", "Chlorine", "Oxygen", "Sulfur"],
            correctAnswer: "B", // option 'Chlorine' is index 1 -> B
            marks: 3
          },
          {
            type: "Fill Blank",
            question: "The pH of a neutral solution is always equal to ____.",
            correctAnswer: "7",
            marks: 2
          }
        ]
      }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Assessments seeding.');

    // Find the Demo School
    const school = await School.findOne({ email: 'nvn@gmail.com' });
    if (!school) {
      console.error('Demo School not found. Please run seedSchoolAdmin.js first.');
      process.exit(1);
    }
    const schoolId = school._id;

    // 1. Clear existing assessments for this school
    await Assessment.deleteMany({ schoolId });
    console.log('Cleared existing assessments for Demo School.');

    // 2. Insert new assessments
    const assessmentsToSeed = ASSESSMENTS.map(item => ({
      ...item,
      schoolId,
      isDeleted: false
    }));

    // Insert them (note: pre-save hook on Assessment model will run and calculate totalMarks and totalQuestions automatically)
    for (const data of assessmentsToSeed) {
      const doc = new Assessment(data);
      await doc.save();
      console.log(`Seeded Assessment: "${doc.name}" for Class: "${doc.class}" (Total Questions: ${doc.totalQuestions}, Marks: ${doc.totalMarks})`);
    }

    console.log('Assessment seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Assessment seeding failed:', err);
    process.exit(1);
  }
}

seed();
