// routes/budget.js
const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

// Route to list all budget items
router.get('/', async (req, res) => {
  try {
    const budgetItems = await Budget.find({ user: req.user._id });
    res.json(budgetItems);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Route to add a new budget item
router.post('/', async (req, res) => {
  const { type, amount, frequency, description } = req.body;
  try {
    const newBudgetItem = new Budget({
      user: req.user._id, // Make sure req.user is populated correctly by your authentication middleware
      type,
      amount,
      frequency,
      description,
    });
    await newBudgetItem.save();

    // If successful, set a flash message and redirect
    req.flash('success_msg', 'Budget item was added successfully!');
    res.redirect('/dashboard'); // Adjust the redirect location as needed
  } catch (err) {
    // If an error occurs, set a flash message with the error and redirect
    req.flash('error_msg', 'Failed to add budget item. Error: ' + err.message);
    res.redirect('/budget'); // Adjust as needed, e.g., to the form page
  }
});

// Route to update a budget item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { type, amount, frequency, description } = req.body;
  try {
    const updatedBudgetItem = await Budget.findByIdAndUpdate(id, {
      type,
      amount,
      frequency,
      description,
    }, { new: true }); // Return the updated document
    if (!updatedBudgetItem) {
      return res.status(404).send('Budget item not found');
    }
    res.send(updatedBudgetItem);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Route to delete a budget item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedBudgetItem = await Budget.findByIdAndDelete(id);
    if (!deletedBudgetItem) {
      return res.status(404).send('Budget item not found');
    }
    res.send('Budget item deleted successfully');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;

