const express = require('express');
const router = express.Router();
const Level = require('../models/Level');

// GET /api/content/library
// Returns the full structure matching the frontend's expectation
router.get('/library', async (req, res) => {
  try {
    const levels = await Level.find().sort({ id: 1 }); // Sort by ID (A1, A2...)
    // The frontend expects { levels: [...] }
    res.json({ levels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/content/seed
// Populate DB from a JSON body (for dev use)
router.post('/seed', async (req, res) => {
  try {
    const { levels } = req.body;
    if (!levels) return res.status(400).json({ error: "Missing 'levels' array" });

    // Clear existing
    await Level.deleteMany({});
    
    // Insert new
    await Level.insertMany(levels);
    
    res.json({ message: "Database seeded successfully", count: levels.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/content/level/:id
// Update a specific level (useful for adding categories/dialogs)
router.put('/level/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categories } = req.body; // Expect full categories array for simplicity
    
    const updatedLevel = await Level.findOneAndUpdate(
      { id },
      { categories },
      { new: true }
    );
    
    if (!updatedLevel) return res.status(404).json({ error: "Level not found" });
    
    res.json(updatedLevel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
