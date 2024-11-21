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
  Container,
  Breadcrumbs,
  Link
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';



const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // New state for editing
  const [parentCategories, setParentCategories] = useState([]);
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // Breadcrumbs array
  const breadcrumbs = [
    <Link key="home" underline="hover" color="inherit" onClick={() => navigate('/')}>
      Home
    </Link>,
    <Link key="admin" underline="hover" color="inherit" onClick={() => navigate('/admin')}>
      Admin Dashboard
    </Link>,
    <Typography key="categories" color="text.primary">
      Manage Categories
    </Typography>,
  ];




  useEffect(() => {
    fetchCategories();
    fetchParentCategories();
  }, []);

  const flattenCategories = (categories) => {
    const result = [];
    const traverse = (category, parentName = null) => {
      result.push({
        _id: category._id,
        name: category.name,
        parentCategory: parentName,
      });
      category.children.forEach((child) => traverse(child, category.name));
    };
    categories.forEach((category) => traverse(category));
    console.log(result);
    return result;
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      const flatCategories = flattenCategories(response.data);
      setCategories(flatCategories);
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

  const handleOpen = (category = null) => {
    setEditingCategory(category); // Set the category to edit (or null for adding)
    setNewCategory(category ? category.name : ''); // Pre-fill form if editing
    setParentCategory(category ? category.parentCategory : '');
    setIsDefault(category ? category.isDefault : false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    setNewCategory('');
    setParentCategory('');
    setIsDefault(false);
  };

  const handleSaveCategory = async () => {
    const categoryData = {
      name: newCategory,
      parentCategory: parentCategory,
      isDefault: isDefault,
    };
  
    if (!isDefault) {
      categoryData.user = user.id;
    }
  
    try {
      if (isEditing) {
        await axios.put(`/categories/${editingCategory._id}`, categoryData);
      } else {
        await axios.post('/categories', categoryData);
      }
      setNewCategory('');
      setParentCategory('');
      setIsDefault(false);
      fetchCategories();
      handleClose();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };
  

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`/categories/${categoryId}`);
        fetchCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
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
    <Container maxWidth="lg" sx={{ backgroundColor: '#f7f7f7', p: 3, borderRadius: 2 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        {breadcrumbs}
      </Breadcrumbs>
      <Typography variant="h5">Manage Categories</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()}>
        Add New Category
      </Button>
      <Box mt={2} maxHeight="400px" overflow="auto">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Category Name</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((category) => (
                  <TableRow key={category._id}>
                    <TableCell
                      style={{
                        fontWeight: category.parentCategory ? 'normal' : 'bold',
                        paddingLeft: category.parentCategory ? '40px' : '20px',
                      }}
                    >
                      {category.name}
                    </TableCell>
                    <TableCell>
                    <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                          setIsEditing(true);
                          setEditingCategory(category);
                          setNewCategory(category.name);
                          setParentCategory(
                            parentCategories.find((cat) => cat.name === category.parentCategory)?._id || ''
                          );
                          setIsDefault(false); // Adjust as needed based on your logic
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        style={{ marginLeft: 8 }}
                        onClick={() => handleDeleteCategory(category._id)}
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
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add a New Category'}</DialogTitle>
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
              value={parentCategory} // This should be the `_id`
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
          <Button onClick={handleSaveCategory} color="primary">
            {isEditing ? 'Save Changes' : 'Add'}
          </Button>

        </DialogActions>
      </Dialog>
      </Container>
  );
};

export default CategoryManagement;
