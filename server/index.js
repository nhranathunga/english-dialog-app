require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/english-practice')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/content', require('./routes/content'));
app.use('/api/auth', require('./routes/auth'));

// Root
app.get('/', (req, res) => {
  res.send('English Speaking Practice API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
