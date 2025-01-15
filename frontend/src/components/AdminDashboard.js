import React from 'react';
import { Container, List, ListItem, ListItemButton, ListItemText, Typography, Card, CardContent } from '@mui/material';
import Breadcrumbs from "./Breadcrumbs";
import { useNavigate } from 'react-router-dom';


const AdminDashboard = () => {
  const navigate = useNavigate();

  // Breadcrumbs array for navigation
  const breadcrumbs = [
    { label: "Home", path: "/" },
    { label: "Admin Dashboard", path: "" }
  ];

  return (
    <Container maxWidth="md" >
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbs} />
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
