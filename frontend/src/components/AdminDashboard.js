import React from 'react';
import { Container, List, ListItem, ListItemButton, ListItemText, Typography, Breadcrumbs, Link, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';


const AdminDashboard = () => {
  const navigate = useNavigate();

  // Breadcrumbs array for navigation
  const breadcrumbs = [
    <Link key="home" underline="hover" color="inherit" onClick={() => navigate('/')} component="button"
      sx={{ cursor: 'pointer' }}>
      Home
    </Link>,
    <Typography key="admin" color="text.primary">
      Admin Dashboard
    </Typography>,
  ];

  return (
    <Container maxWidth="md" >
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        {breadcrumbs}
      </Breadcrumbs>
      <Card>
        <CardContent>

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

        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminDashboard;
