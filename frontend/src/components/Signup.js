import React from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';

const Signup = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Typography component="h1" variant="h5">
        Sign Up
      </Typography>
      <form noValidate>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
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
        />
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          id="confirmPassword"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
        >
          Sign Up
        </Button>
      </form>
    </Container>
  );
};

export default Signup;
