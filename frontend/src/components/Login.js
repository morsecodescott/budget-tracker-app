/**
 * @fileoverview This file contains the Login component, which provides a form for users to sign in.
 * @module frontend/src/components/Login
 */

import React, { useState } from 'react';
import { TextField, Button, Typography, Container, Box } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Make sure this path is correct!

/**
 * A component that renders a login form.
 * @returns {JSX.Element} The rendered login form.
 */
const LoginForm = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Use the login function from the auth context

  /**
   * Handles changes to the form fields.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials(prevCredentials => ({
      ...prevCredentials,
      [name]: value
    }));
  };

  /**
   * Handles the form submission.
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('/auth/login', credentials);
      if (response.data.success) {
        await login(response.data.user, response.data.token); // Call the login function with user data and token
        navigate('/dashboard'); // Navigate to the Dashboard on successful login
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      console.log(error);
      setError('Login failed. Please try again later.');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Sign In</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={credentials.email}
            onChange={handleChange}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={handleChange}
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm;
