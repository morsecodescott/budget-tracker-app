import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Typography
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [parentCategories, setParentCategories] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
    fetchParentCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchParentCategories = async () => {
    try {
      const response = await axios.get('/categories/parents');
      setParentCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch parent categories:', error);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddCategory = async () => {
    const categoryData = {
      name: newCategory,
      parentCategory: parentCategory,
      isDefault: isDefault,
    };

    if (!isDefault) {
      categoryData.user = user.id;
    }

    try {
      await axios.post('/categories', categoryData);
      setNewCategory('');
      setParentCategory('');
      setIsDefault(false);
      fetchCategories();
      await fetchCategories();
      await fetchParentCategories(); 
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
      <List dense='true'>
        {categories.map((category) => (
          <React.Fragment key={category._id}>
            <ListItem>
              <ListItemText primary={<Typography variant="h6" style={{ fontWeight: 'bold' }}>{category.name}</Typography>} />
            </ListItem>
            {category.children && category.children.map((child) => (
              <ListItem key={child._id} style={{ paddingLeft: '20px' }}>
                <ListItemText primary={child.name} />
              </ListItem>
            ))}
          </React.Fragment>
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
          <FormControl fullWidth margin="normal">
            <InputLabel id="parent-category-label">Parent Category</InputLabel>
            <Select
              labelId="parent-category-label"
              id="parentCategory"
              value={parentCategory}
              label="Parent Category"
              onChange={(e) => setParentCategory(e.target.value)}
            >
              {parentCategories.map((category) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {user.role === 'admin' && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                />
              }
              label="Is Default Category"
            />
          )}
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
