import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  Breadcrumbs,
  Link,
  IconButton,
  CardContent,
  Card,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FolderOpenIcon from '@mui/icons-material/FolderOpen'; // For empty state
import CheckIcon from '@mui/icons-material/Check'; // For success feedback
import CloseIcon from '@mui/icons-material/Close'; // For close button
import axios from 'axios';

const UserManagement = () => {
  const navigate = useNavigate();

  // State variables
  const [users, setUsers] = useState([]); // Stores the list of users
  const [userItems, setUserItems] = useState([]); // Stores the items of the selected user
  const [page, setPage] = useState(0); // Current page for pagination
  const [rowsPerPage, setRowsPerPage] = useState(10); // Number of rows per page
  const [selectedUser, setSelectedUser] = useState(null); // Currently selected user
  const [editMode, setEditMode] = useState(false); // Tracks whether edit mode is active
  const [isLoading, setIsLoading] = useState(false); // Tracks loading state
  const [error, setError] = useState(null); // Stores error messages
  const [successMessage, setSuccessMessage] = useState(null); // Stores success messages
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Controls Snackbar visibility

  // Breadcrumbs for navigation
  const breadcrumbs = [
    <Link key="home" underline="hover" color="inherit" onClick={() => navigate('/')}>
      Home
    </Link>,
    <Link key="admin" underline="hover" color="inherit" onClick={() => navigate('/admin')}>
      Admin Dashboard
    </Link>,
    <Typography key="users" color="text.primary">
      Manage Users
    </Typography>,
  ];

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch user items when selectedUser changes
  useEffect(() => {
    if (selectedUser && selectedUser._id) {
      fetchUserItems();
    }
  }, [selectedUser]);

  /**
   * Fetches the list of users from the server.
   */
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (error) {
      setError('Failed to fetch users. Please try again later.');
      setSnackbarOpen(true);
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles page change for pagination.
   * @param {Object} event - The event object.
   * @param {number} newPage - The new page number.
   */
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  /**
   * Handles rows per page change for pagination.
   * @param {Object} event - The event object.
   */
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  /**
   * Fetches the items associated with the selected user.
   */
  const fetchUserItems = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/plaid/items/${selectedUser._id}`);
      setUserItems(response.data.items);
      console.log('fetchUserItems Data:', response.data.items);
    } catch (error) {
      setError('Failed to fetch user items. Please try again later.');
      setSnackbarOpen(true);
      console.error('Failed to fetch user items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles updating the selected user's details.
   */
  const handleEditUser = async () => {
    setIsLoading(true);
    try {
      await axios.put(`/users/${selectedUser._id}`, selectedUser);
      setSuccessMessage('User updated successfully!');
      setSnackbarOpen(true);
      fetchUsers(); // Refresh the user list
      setSelectedUser(null); // Clear the selected user
      setEditMode(false); // Exit edit mode
    } catch (error) {
      setError('Failed to update user. Please try again later.');
      setSnackbarOpen(true);
      console.error('Failed to update user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles deleting a user.
   * @param {string} id - The ID of the user to delete.
   */
  const handleDeleteUser = async (id) => {
    setIsLoading(true);
    try {
      await axios.delete(`/users/${id}`);
      setSuccessMessage('User deleted successfully!');
      setSnackbarOpen(true);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      setError('Failed to delete user. Please try again later.');
      setSnackbarOpen(true);
      console.error('Failed to delete user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Closes the Snackbar.
   */
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setError(null);
    setSuccessMessage(null);
  };

  /**
   * Renders a row in the user table.
   * @param {Object} user - The user object.
   * @returns {JSX.Element} - The table row component.
   */
  const renderRow = (user) => (
    <TableRow key={user._id}>
      <TableCell>{user.firstName}</TableCell>
      <TableCell>{user.lastName}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.role}</TableCell>
      <TableCell>
        {/* View Button */}
        <IconButton
          aria-label="View User"
          variant="contained"
          color="secondary"
          onClick={() => {
            setSelectedUser(user);
            setEditMode(false);
          }}
        >
          <RemoveRedEyeIcon fontSize="small" />
        </IconButton>
        {/* Edit Button */}
        <IconButton
          aria-label="Edit User"
          variant="contained"
          color="primary"
          sx={{ mx: 1 }}
          onClick={() => {
            setSelectedUser(user);
            setEditMode(true);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        {/* Delete Button */}
        <IconButton
          aria-label="Delete User"
          variant="contained"
          color="error"
          onClick={() => handleDeleteUser(user._id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Breadcrumbs for navigation */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        {breadcrumbs}
      </Breadcrumbs>

      {/* User Table */}
      <Card>
        <CardContent>
          <TableContainer>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <CircularProgress />
              </div>
            ) : (
              <Table size="small" aria-label="User Table">
                <TableHead>
                  <TableRow>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(renderRow)}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          {/* Pagination */}
          <TablePagination
            count={users.length}
            page={page}
            component="div"
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Selected User Details and Items */}
      {selectedUser && (
        <Card sx={{ mt: 3, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
              {editMode ? 'Edit User' : 'View User'}
            </Typography>

            {/* Display User Details */}
            {Object.keys(selectedUser || {}).map((key) => {
              // Skip password and __v fields
              if (key === 'password' || key === '__v') return null;

              const isIdField = key === '_id';

              return (
                <TextField
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={selectedUser[key]}
                  disabled={!editMode || isIdField} // Always disable the _id field
                  onChange={(e) =>
                    !isIdField && setSelectedUser({ ...selectedUser, [key]: e.target.value })
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                  aria-label={key}
                />
              );
            })}

            {/* Display User Items */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              User Items
            </Typography>
            {userItems.length > 0 ? (
              <TableContainer>
                <Table size="small" aria-label="User Items Table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Plaid Item ID</TableCell>
                      <TableCell>Access Token</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.plaidItemId}</TableCell>
                        <TableCell>{item.accessToken}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderOpenIcon fontSize="small" />
                No items found for this user.
              </Typography>
            )}

            {/* Actions */}
            <Button
              aria-label="Close"
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={() => {
                setSelectedUser(null); // Clear the selected user
                setEditMode(false); // Exit edit mode
              }}
              sx={{ mt: 2 }}
            >
              Close
            </Button>
            {editMode && (
              <Button
                aria-label="Save"
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={handleEditUser}
                sx={{ mt: 2, ml: 2 }}
              >
                Save
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Snackbar for Feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserManagement;