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
/*router.delete('/:id', async (req, res) => {
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
});*/

router.delete('/delete/:id', async (req, res) => {
  const itemId = req.params.id;
  console.log(`Route triggered: DELETE /delete/${itemId}`);

  try {
    await Budget.findByIdAndDelete(itemId);
    console.log('Success: Item was deleted successfully');
    req.flash('success_msg', 'Item was deleted successfully');
    res.redirect('/dashboard'); // or your success redirect path
  } catch (err) {
    console.error(`Error: Failed to delete item with ID ${itemId}`, err);
    req.flash('error_msg', 'Failed to delete item');
    res.redirect('/dashboard'); // or your error redirect path
  }
});


module.exports = router;

