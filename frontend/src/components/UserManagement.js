import React from 'react';
import { Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const navigate = useNavigate();

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

  return (
    <Container maxWidth="lg" sx={{ backgroundColor: '#f7f7f7', p: 3, borderRadius: 2 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        {breadcrumbs}
      </Breadcrumbs>
      <Typography variant="h5">Manage Users</Typography>
      {/* Add user management functionality */}
    </Container>
  );
};

export default UserManagement;
