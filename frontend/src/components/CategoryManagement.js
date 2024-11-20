import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Typography,
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

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
      handleClose();
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div>
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Add New Category
      </Button>
      <Box mt={2} maxHeight="400px" overflow="auto">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Category Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Parent Category</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((category) => (
                  <TableRow key={category._id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.parentCategory?.name || 'None'}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => console.log('Edit:', category)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        style={{ marginLeft: 8 }}
                        onClick={() => console.log('Delete:', category)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <TablePagination
        component="div"
        count={categories.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
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
