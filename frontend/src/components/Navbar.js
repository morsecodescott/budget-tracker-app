import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  console.log(user);
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Button color="inherit" component={RouterLink} to="/">ChaChing</Button>
        </Typography>
        {!user && (
          <>
            <Button color="inherit" component={RouterLink} to="/login">Login</Button>
            <Button color="inherit" component={RouterLink} to="/signup">Sign Up</Button>
          </>
        )}
        {user && (
          <>
            <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
            {user.role === 'admin' && <Button color="inherit" component={RouterLink} to="/admin-dashboard">Admin Dashboard</Button>}
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
    
  );
};

export default Navbar;
