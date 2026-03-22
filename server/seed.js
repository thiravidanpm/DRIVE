const mongoose = require('mongoose');
require('dotenv').config();
const Company = require('./models/Company');
const Question = require('./models/Question');
const CodingProblem = require('./models/CodingProblem')
const companies = require('./data/companies.json')
const questions = require('./data/questions.json')
const codingProblems = require('./data/codingProblems.json')


async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Seed companies
  await Company.deleteMany({});
  await Company.insertMany(companies);
  console.log(`✅ Seeded ${companies.length} companies`);

  // Seed questions
  await Question.deleteMany({});
  await Question.insertMany(questions);
  console.log(`✅ Seeded ${questions.length} questions`);

  await CodingProblem.deleteMany({})
  await CodingProblem.insertMany(codingProblems)
  console.log(`✅ Seeded ${codingProblems.length} coding problems`)

  // Show breakdown
  const aptitude = questions.filter(q => q.type === 'aptitude').length
  const technical = questions.filter(q => q.type === 'technical').length
  const hr = questions.filter(q => q.type === 'hr').length
  console.log(`   → ${aptitude} aptitude, ${technical} technical, ${hr} HR questions`)

  mongoose.connection.close();
  console.log('Done!');
}

seed().catch(console.error);