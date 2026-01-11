require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Level = require('./models/Level');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/english-practice';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Request Connected'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

const seedData = async () => {
  try {
    const jsonPath = path.join(__dirname, '../public/dialogs.json');
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(rawData);

    if (!data.levels) {
      console.error('Invalid JSON structure: missing "levels" array');
      process.exit(1);
    }

    // Clear existing data
    await Level.deleteMany({});
    console.log('Cleared existing levels.');

    // Insert new data
    await Level.insertMany(data.levels);
    console.log(`Seeded ${data.levels.length} levels successfully.`);

    process.exit();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
