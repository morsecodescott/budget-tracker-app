import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import axios from 'axios';

const PlaidLinkButton = ({ onSuccess, onExit, accessToken }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [linkToken, setLinkToken] = useState(null);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.post('/plaid/create_link_token');
        setLinkToken(response.data.link_token);
      } catch (error) {
        console.error('Error creating link token:', error);
        setError('Failed to create link token. Please try again.');
        setIsLoading(false);
      }
    };

    createLinkToken();
  }, []);

  const config = linkToken ? {
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        await axios.post('/plaid/set_access_token', {
          public_token,
          accessToken
        });
        onSuccess(public_token, metadata);
      } catch (error) {
        console.error('Error sending public token to server:', error);
        onExit(error, metadata);
      }
    },
    onExit
  } : null;

  const { open, ready } = usePlaidLink(config || {});

  // Open Plaid Link when token is ready
  React.useEffect(() => {
    if (linkToken && ready) {
      open();
      setIsLoading(false);
    }
  }, [linkToken, ready, open]);

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={() => open()}
        disabled={!ready || isLoading}
        sx={{ mt: 2 }}
      >
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          'Connect a bank account'
        )}
      </Button>
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default PlaidLinkButton;
