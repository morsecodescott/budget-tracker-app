const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Corrected path to User model

// GET: List all users
router.get('/', async (req, res) => { 
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});

// POST: Create a new user
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, role, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newUser = new User({ firstName, lastName, email, role, password });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create user', error });
  }
});

// PUT: Update a user by ID
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;

    // Find the user and update
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { firstName, lastName, email, role }, { new: true });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update user', error });
  }
});

// DELETE: Delete a user by ID
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete user', error });
  }
});

module.exports = router;
