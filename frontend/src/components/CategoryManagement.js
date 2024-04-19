import React, { useState, useEffect } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddCategory = async () => {
    try {
      await axios.post('/categories', { name: newCategory });
      fetchCategories();
      handleClose();
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  return (
    <div>
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Add New Category
      </Button>
      <List>
        {categories.map((category) => (
          <ListItem key={category._id}>
            <ListItemText primary={category.name} />
            {/* Add buttons for editing and deleting here */}
          </ListItem>
        ))}
      </List>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add a New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Category Name"
            type="text"
            fullWidth
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddCategory} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;
