import React from 'react';
import { Container, List, ListItem, ListItemButton, ListItemText, Typography, Breadcrumbs, Link } from '@mui/material';
import { useNavigate, Route, Routes } from 'react-router-dom';
import CategoryManagement from './CategoryManagement';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Breadcrumbs array for navigation
  const breadcrumbs = [
    <Link key="home" underline="hover" color="inherit" onClick={() => navigate('/')}>
      Home
    </Link>,
    <Typography key="admin" color="text.primary">
      Admin Dashboard
    </Typography>,
  ];

  return (
    <Container maxWidth="lg" sx={{ backgroundColor: '#f7f7f7', p: 3, borderRadius: 2 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        {breadcrumbs}
      </Breadcrumbs>

      {/* Dashboard Title */}
      <Typography variant="h4" sx={{ mb: 2 }}>
        Admin Dashboard
      </Typography>

      {/* List of Admin Functions */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/admin/manage-categories')}>
            <ListItemText primary="Manage Categories" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/admin/manage-users')}>
            <ListItemText primary="Manage Users" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/admin/manage-plaid-categories')}>
            <ListItemText primary="Manage Plaid Categories" />
          </ListItemButton>
        </ListItem>
      </List>
    </Container>
  );
};

export default AdminDashboard;
