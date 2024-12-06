import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemText, Divider, CssBaseline, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Width of the persistent drawer
const drawerWidth = 240;

const Navdrawer = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false); // State to control drawer open/close

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Drawer toggling functions
  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const drawerList = (
    <div role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
    <List>
      {/* ChaChing List Item with blue background */}
      <ListItem 
        button 
        component={RouterLink} 
        to="/" 
        sx={{ backgroundColor: 'primary.main', color: 'white', '&:hover': { backgroundColor: 'primary.dark' } }}
      >
        <ListItemText primary="ChaChing" />
      </ListItem>
      {!user && (
        <>
          <ListItem button component={RouterLink} to="/login">
            <ListItemText primary="Login" />
          </ListItem>
          <ListItem button component={RouterLink} to="/signup">
            <ListItemText primary="Sign Up" />
          </ListItem>
        </>
      )}
      {user && (
        <>
          <ListItem button component={RouterLink} to="/dashboard">
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button component={RouterLink} to="/transactions">
            <ListItemText primary="Transactions" />
          </ListItem>
          <ListItem button component={RouterLink} to="/plaid-test">
            <ListItemText primary="Plaid Test" />
          </ListItem>
          {user.role === 'admin' && (
            <ListItem button component={RouterLink} to="/admin">
              <ListItemText primary="Admin Dashboard" />
            </ListItem>
          )}
          <Divider />
          <ListItem button onClick={handleLogout}>
            <ListItemText primary="Logout" />
          </ListItem>
        </>
      )}
    </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* AppBar with a menu icon to toggle the drawer */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer(!drawerOpen)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            ChaChing
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Persistent Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)} 
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: 64, // Matches the height of the AppBar (default MUI app bar height)
          },
        }}
      >
        {drawerList}
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }} >
        {/* Ensures the content starts below the app bar */}
        <Toolbar />
        {/* Rest of the content */}
      </Box>
    </Box>
  );
};

export default Navdrawer;
