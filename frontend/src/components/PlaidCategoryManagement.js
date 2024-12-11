import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  TextField,
  Button,
  TablePagination,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleIcon from '@mui/icons-material/AddCircle';

const PlaidCategoryManagement = () => {
  const navigate = useNavigate();
  const [plaidCategories, setPlaidCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [editedCategory, setEditedCategory] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    PRIMARY: '',
    DETAILED: '',
    DESCRIPTION: '',
    internal_category: '',
  });

  const breadcrumbs = [
    <Link key="home" underline="hover" color="inherit" onClick={() => navigate('/')} component="button"
      sx={{ cursor: 'pointer' }}>
      Home
    </Link>,
    <Link key="admin" underline="hover" color="inherit" onClick={() => navigate('/admin')} component="button"
      sx={{ cursor: 'pointer' }}>
      Admin Dashboard
    </Link>,
    <Typography key="users" color="text.primary">
      Manage Plaid Categories
    </Typography>,
  ];

  useEffect(() => {
    fetchCategories();
    fetchPlaidCategories();
  }, []);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/categories');
      const data = await response.json();
      setCategories(data.map((cat) => ({ ...cat, children: cat.children || [] })));
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchPlaidCategories = async () => {
    try {
      const response = await fetch('/plaid-categories');
      const data = await response.json();
      setPlaidCategories(data);
    } catch (error) {
      console.error('Failed to fetch Plaid categories:', error);
    }
  };

  const startEditing = (id) => {
    setEditingRow(id);
    const plaidCategory = plaidCategories.find((cat) => cat._id === id);
    setEditedCategory({
      ...plaidCategory,
      internal_category: plaidCategory.internal_category?._id || '', // Use _id or fallback to empty string
    });
  };

  const stopEditing = () => {
    setEditingRow(null);
    setEditedCategory({});
  };

  const handleChange = (field, value) => {
    setEditedCategory({ ...editedCategory, [field]: value });


  };


  const saveChanges = async () => {
    try {
      await fetch(`/plaid-categories/${editedCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedCategory),
      });

      fetchPlaidCategories();
      stopEditing();
    } catch (error) {
      console.error('Failed to update Plaid category:', error);
    }
  };

  const deleteCategory = async (id) => {
    try {
      await fetch(`/plaid-categories/${id}`, { method: 'DELETE' });
      fetchPlaidCategories();
    } catch (error) {
      console.error('Failed to delete Plaid category:', error);
    }
  };


  const handleAddCategory = async () => {
    try {
      await fetch('/plaid-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });

      fetchPlaidCategories();
      setShowAddForm(false);
      setNewCategory({ PRIMARY: '', DETAILED: '', DESCRIPTION: '', internal_category: '' });
    } catch (error) {
      console.error('Failed to add new category:', error);
    }
  };

  const renderCategoryOptions = () => {
    const options = [];
    categories.forEach((parent) => {
      options.push(
        <MenuItem key={parent._id} value={parent._id}>
          {parent.name}
        </MenuItem>
      );
      parent.children.forEach((child) => {
        options.push(
          <MenuItem key={child._id} value={child._id}>
            &nbsp;&nbsp;{child.name}
          </MenuItem>
        );
      });
    });
    return options;
  };

  const renderRow = (row) => {
    const isEditing = editingRow === row._id;
    return (
      <TableRow key={row._id}>
        <TableCell>
          {isEditing ? (
            <TextField
              size="small"
              value={editedCategory.PRIMARY}
              onChange={(e) => handleChange('PRIMARY', e.target.value)}
              fullWidth
            />
          ) : (
            row.PRIMARY
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <TextField
              size="small"
              value={editedCategory.DETAILED}
              onChange={(e) => handleChange('DETAILED', e.target.value)}
              fullWidth
            />
          ) : (
            row.DETAILED
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <Select
              size="small"
              value={editedCategory.internal_category || ''}
              onChange={(e) => handleChange('internal_category', e.target.value)}
              fullWidth
            >
              {renderCategoryOptions()}
            </Select>
          ) : (
            row.internal_category?.name || 'Unmapped'
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <>
              <Button size="small" variant="contained" color="primary" onClick={saveChanges} sx={{ mr: 1 }}>
                Save
              </Button>
              <Button size="small" variant="contained" color="primary" onClick={stopEditing}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <IconButton
                variant="contained"
                color="primary"
                onClick={() => startEditing(row._id)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton variant="contained" color="error" onClick={() => deleteCategory(row._id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </TableCell>
      </TableRow>
    );
  };


  const paginatedCategories = plaidCategories.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="lg" sx={{ backgroundColor: '#f7f7f7', p: 3, borderRadius: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        {breadcrumbs}
      </Breadcrumbs>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddCircleIcon />}
          color="primary"
          onClick={() => setShowAddForm(true)}
        >
          New Category
        </Button>
      </Box>
      <Dialog open={showAddForm} onClose={() => setShowAddForm(false)}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            label="Primary"
            size="small"
            value={newCategory.PRIMARY}
            onChange={(e) => setNewCategory({ ...newCategory, PRIMARY: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Detailed"
            size="small"
            value={newCategory.DETAILED}
            onChange={(e) => setNewCategory({ ...newCategory, DETAILED: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            size="small"
            value={newCategory.DESCRIPTION}
            onChange={(e) => setNewCategory({ ...newCategory, DESCRIPTION: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Select
            value={newCategory.internal_category}
            onChange={(e) => setNewCategory({ ...newCategory, internal_category: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          >
            {renderCategoryOptions()}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddForm(false)} variant="contained" color="primary">Cancel</Button>
          <Button onClick={handleAddCategory} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
      <Card>
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Primary</TableCell>
                  <TableCell>Detailed</TableCell>
                  <TableCell>Internal Category</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{paginatedCategories.map((row) => renderRow(row))}</TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            count={plaidCategories.length}
            page={page}
            component="div"
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    </Container>
  );
};

export default PlaidCategoryManagement;
