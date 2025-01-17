import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  InputLabel,

} from '@mui/material';
import axios from 'axios';

const initialFormState = {
  category: '',
  frequency: 'monthly',
  amount: '',
  recurrence: 2,
  description: '',
  period: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
};

const BudgetItemForm = ({ open, onClose, fetchBudgetItems, categories = [], itemToEdit = null }) => {

  const [newBudgetItem, setNewBudgetItem] = useState(initialFormState);

  // Effect to update state when itemToEdit changes
  useEffect(() => {
    if (itemToEdit) {
      const editItemFormatted = {
        ...itemToEdit,
        category: itemToEdit.category?._id || itemToEdit.category,
        period: itemToEdit.period ? new Date(itemToEdit.period).toISOString().split('T')[0] : initialFormState.period
      };
      setNewBudgetItem(editItemFormatted);
    } else {
      setNewBudgetItem(initialFormState);
    }
  }, [itemToEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setNewBudgetItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const url = itemToEdit ? `/budget/${itemToEdit._id}` : '/budget';
    const method = itemToEdit ? 'put' : 'post';
    try {
      await axios({ method, url, data: newBudgetItem });
      fetchBudgetItems();
      setNewBudgetItem(initialFormState);
      onClose(true); // Close the modal and progress wizard
    } catch (error) {
      console.error('Failed to add budget item:', error);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <DialogTitle>{itemToEdit ? 'Edit Budget' : 'Set a Budget'}</DialogTitle>
      <DialogContent>
        {/* Category Select */}
        <FormControl fullWidth margin="normal">
          <InputLabel id="category-label">Choose a category</InputLabel>
          <Select
            labelId="category-label"
            id="category"
            name="category"
            value={newBudgetItem.category}
            label="Choose a category"
            onChange={handleChange}
          >
            {categories?.map((category) => [
              <MenuItem key={category._id} value={category._id} style={{ fontWeight: 'bold' }}>
                {category.name}
              </MenuItem>,
              ...(category.children ? category.children.map((child) => (
                <MenuItem key={child._id} value={child._id} style={{ paddingLeft: '30px' }}>
                  {child.name}
                </MenuItem>
              )) : [])
            ])}
          </Select>
        </FormControl>

        {/* Frequency Radio Buttons */}
        <FormControl component="fieldset" margin="normal">
          <RadioGroup
            row
            aria-label="frequency"
            name="frequency"
            value={newBudgetItem.frequency}
            onChange={handleChange}
          >
            <FormControlLabel value="monthly" control={<Radio />} label="Every month" />
            <FormControlLabel value="one-time" control={<Radio />} label="Once" />
            <FormControlLabel value="every few months" control={<Radio />} label="Every few months" />
          </RadioGroup>
        </FormControl>

        {/* Amount TextField */}
        <TextField
          margin="normal"
          name="amount"
          label="Amount"
          type="number"
          fullWidth
          value={newBudgetItem.amount}
          onChange={handleChange}
        />

        {/* Recurrence Select */}
        {newBudgetItem.frequency === 'every few months' && (
          <FormControl fullWidth margin="normal">
            <InputLabel id="recurrence-label">Recurrence</InputLabel>
            <Select
              labelId="recurrence-label"
              id="recurrence"
              name="recurrence"
              value={newBudgetItem.recurrence}
              label="Recurrence"
              onChange={handleChange}
            >
              {[...Array(11).keys()].map(number => (
                <MenuItem key={number} value={number + 2}>
                  {number + 2} months
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Period DatePicker */}
        <TextField
          margin="normal"
          name="period"
          label="When will this happen?"
          type="date"
          fullWidth
          value={newBudgetItem.period}
          onChange={handleChange}
        />

        {/* Description TextField */}
        <TextField
          margin="normal"
          name="description"
          label="Description"
          type="text"
          fullWidth
          value={newBudgetItem.description}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={handleSave}>{itemToEdit ? 'Update' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
};

BudgetItemForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fetchBudgetItems: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    children: PropTypes.array
  })),
  itemToEdit: PropTypes.shape({
    _id: PropTypes.string,
    category: PropTypes.oneOfType([
      PropTypes.shape({
        _id: PropTypes.string
      }),
      PropTypes.string
    ]),
    period: PropTypes.string
  })
};

export default BudgetItemForm;
