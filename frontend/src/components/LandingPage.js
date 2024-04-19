import React from 'react';

import { Container, Typography } from '@mui/material';

function LandingPage() {
  return (
    <div>
    
      <Container component="main" maxWidth="sm">
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to ChaChing
        </Typography>
        <Typography variant="h5">
          Your journey to financial clarity starts here.
        </Typography>
      </Container>
    </div>
  );
}

export default LandingPage;
