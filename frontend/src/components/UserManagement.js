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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Breadcrumbs,
  Link,
  IconButton,
  CardContent,
  Card
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);


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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  const handleEditUser = async () => {
    try {
      await fetch(`/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedUser),
      });
      fetchUsers();
      setSelectedUser(null);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await fetch(`/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const renderRow = (user) => (
    <TableRow key={user._id}>
      <TableCell>{user.firstName}</TableCell>
      <TableCell>{user.lastName}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.role}</TableCell>
      <TableCell>
        <IconButton
          variant="contained"
          color='secondary'
          onClick={() => {
            setSelectedUser(user);
            setEditMode(false);
          }}
        >
          <RemoveRedEyeIcon fontSize="small" />
        </IconButton>
        <IconButton
          variant="contained"
          color='primary'
          sx={{ mx: 1 }}
          onClick={() => {
            setSelectedUser(user);
            setEditMode(true);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton variant="contained" color='error' onClick={() => handleDeleteUser(user._id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );

  return (
    <Container maxWidth="md" >
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        {breadcrumbs}
      </Breadcrumbs>

      <Card>
        <CardContent>
          <TableContainer>
            <Table size="small">
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
          </TableContainer>
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
      <Dialog open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)}>
        <DialogTitle>{editMode ? 'Edit User' : 'View User'}</DialogTitle>
        <DialogContent>
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
              />
            );
          })}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setSelectedUser(null); // Clear the selected user
              setEditMode(false); // Exit edit mode

            }}
            color="secondary"
          >
            Cancel
          </Button>
          {editMode && (
            <Button onClick={handleEditUser} variant="contained" color="primary">
              Save
            </Button>
          )}
        </DialogActions>

      </Dialog>
    </Container>
  );
};

export default UserManagement;
