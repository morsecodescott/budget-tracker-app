import React, { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import axios from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';

const PlaidLinkUpdate = ({ itemId, onUpdateSuccess, onUpdateExit, children }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      onUpdateSuccess(metadata);
    },
    onExit: (err, metadata) => {
      if (err) {
        setError('Plaid link failed: ' + err.display_message);
      }
      onUpdateExit(err, metadata);
    },
  });

  const createLinkToken = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    try {
      const response = await axios.post('/plaid/create_link_token', {
        itemId: itemId,
        userId: user._id,
      });
      setLinkToken(response.data.link_token);
    } catch (err) {
      setError('Failed to create link token. Please try again later.');
      console.error('Error creating link token:', err);
    }
  }, [itemId, user]);

  useEffect(() => {
    if (ready && linkToken) {
      open();
    }
  }, [ready, linkToken, open]);

  return (
    <div onClick={createLinkToken}>
      {children}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default PlaidLinkUpdate;
