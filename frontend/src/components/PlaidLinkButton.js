import React from 'react';
import { usePlaidLink } from 'react-plaid-link';
import Button from '@mui/material/Button';
import axios from 'axios'; // Import axios

const PlaidLinkButton = ({ linkToken }) => {
  const onSuccess = async (public_token, metadata) => {
    console.log('Plaid public token:', public_token);
    console.log('Account metadata:', metadata);

    // Here you would send the public_token to your server to exchange it for an access token
    try {
      const response = await axios.post('http://localhost:4000/plaid/set_access_token', {
        public_token: public_token // Sending public_token to the server
      });
      console.log('Server response:', response.data); // Handling the response from the server
    } catch (error) {
      console.error('Error sending public token to server:', error);
    }
  };

  const onExit = () => {
    console.log('User exited Plaid Link.');
  };

  const config = {
    token: linkToken,
    onSuccess,
    onExit,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={() => open()}
      disabled={!ready}
      sx={{ mt: 2 }}
    >
      Connect a bank account
    </Button>
  );
};

export default PlaidLinkButton;
