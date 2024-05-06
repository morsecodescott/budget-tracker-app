// routes/budget.js
const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

// Route to list all budget items
router.get('/', async (req, res) => {
  try {
    const budgetItems = await Budget.find({ user: req.user._id })
      .populate({
        path: 'category',  // Populates the 'category' field
        select: 'name parentCategory',  // Selects 'name' and 'parentCategory' fields of 'category'
        populate: {
          path: 'parentCategory',  // Populates the 'parentCategory' within 'category'
          select: 'name'  // Selects only the 'name' field of 'parentCategory'
        }
      })
      .sort({ type: 1, 'category.name': 1 })  // Sorts by 'type' and then by 'category.name'
      
    res.json(budgetItems);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Route to add a new budget item
router.post('/', async (req, res) => {
  const { period, category , description, amount, frequency, recurrance  } = req.body;
  try {
    // Create a new Budget item using the request data
    const newBudgetItem = new Budget({
      user: req.user._id, // Make sure req.user is populated correctly by your authentication middleware
      amount,
      frequency,
      description,
      category,
      period,
      recurrance
    });

    // Save the new Budget item to the database
    const savedItem = await newBudgetItem.save();

    // If successful, return the saved item along with a success message
    res.status(201).json({ 
      success: true, 
      message: 'Budget item was added successfully!', 
      item: savedItem 
    });
  } catch (err) {
    // If an error occurs, return the error message
    res.status(400).json({ 
      success: false, 
      message: 'Failed to add budget item.', 
      error: err.message 
    });
  }
});




// Route to update a budget item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { period, amount, frequency, description, category, recurrance } = req.body;
  try {
    const updatedBudgetItem = await Budget.findByIdAndUpdate(id, {
      period,
      amount,
      frequency,
      description,
      category,
      recurrance
    }, { new: true }); // Return the updated document
    if (!updatedBudgetItem) {
      return res.status(404).json({ success: false, message: 'Budget item not found' });
    }
    res.status(200).json({ success: true, message: 'Item updated successfully', item: updatedBudgetItem });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating item', error: err.message });
  }
});



//Route to delete a budget item.
router.delete('/delete/:id', async (req, res) => {
  const itemId = req.params.id;
  try {
    const deletedBudgetItem = await Budget.findByIdAndDelete(itemId);
    if (!deletedBudgetItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.status(200).json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete item', error: err.message });
  }
});



module.exports = router;

