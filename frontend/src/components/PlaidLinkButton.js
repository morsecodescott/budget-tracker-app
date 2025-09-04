import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import axios from 'axios';

const PlaidLinkButton = ({ onSuccess, onExit, accessToken }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [linkToken, setLinkToken] = useState(null);
  const [shouldOpen, setShouldOpen] = useState(false);
  const [tokenExpiration, setTokenExpiration] = useState(null);

  // Clear expired tokens
  useEffect(() => {
    const checkTokenExpiration = () => {
      if (tokenExpiration && Date.now() > tokenExpiration) {
        setLinkToken(null);
        setTokenExpiration(null);
      }
    };

    const interval = setInterval(checkTokenExpiration, 1000);
    return () => clearInterval(interval);
  }, [tokenExpiration]);

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
    onExit: (error, metadata) => {
      // Don't clear token immediately - keep it valid for 2 minutes
      setTokenExpiration(Date.now() + 120000);
      onExit(error, metadata);
      console.log('Plaid link exit:', error, metadata);
    }
  } : null;

  const { open, ready } = usePlaidLink(config || {});

  useEffect(() => {
    if (shouldOpen && ready && linkToken) {
      open();
      setShouldOpen(false);
    }
  }, [shouldOpen, ready, linkToken, open]);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Only create new token if current one is expired or doesn't exist
      if (!linkToken || (tokenExpiration && Date.now() > tokenExpiration)) {
        const response = await axios.post('/plaid/create_link_token');
        const token = response.data.link_token;
        setLinkToken(token);
        setTokenExpiration(Date.now() + 120000); // 2 minute expiration
      }

      setShouldOpen(true);
    } catch (error) {
      console.error('Error creating link token:', error);
      setError('Failed to create link token. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        color="primary"
        onClick={handleClick}
        disabled={isLoading}
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
