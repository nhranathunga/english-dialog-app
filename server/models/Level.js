const mongoose = require('mongoose');

const TurnSchema = new mongoose.Schema({
  speaker: { type: String, enum: ['app', 'user'], required: true },
  text: { type: String, required: true },
  keywords: [String]
}, { _id: false });

const DialogSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  turns: [TurnSchema]
});

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  dialogs: [DialogSchema]
});

const LevelSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. "A1"
  name: { type: String, required: true },
  categories: [CategorySchema]
});

module.exports = mongoose.model('Level', LevelSchema);
