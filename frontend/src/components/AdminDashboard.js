import React from 'react';
import { Container } from '@mui/material';
import CategoryManagement from './CategoryManagement';

const AdminDashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ backgroundColor: 'gray' }}>
      {/* Use the Category Management component */}
      <CategoryManagement />
    </Container>
  );
};

export default AdminDashboard;
