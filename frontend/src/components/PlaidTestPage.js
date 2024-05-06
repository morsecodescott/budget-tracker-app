import React, { useState, useEffect } from 'react';
import PlaidLinkButton from './PlaidLinkButton';
import {
  Container,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PlaidTestPage = () => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const { user } = useAuth();

  // Fetch link token
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await axios.post('http://localhost:4000/plaid/create_link_token', { user });
        setLinkToken(response.data.link_token);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch link token:', error.message);
        setLoading(false);
      }
    };

    fetchLinkToken();
  }, [user]);

  // Fetch user's Plaid items and accounts
  const fetchItemsAndAccounts = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/plaid/items/${user.id}`);
      setItems(response.data.items);
    } catch (error) {
      console.error('Error fetching Plaid items:', error.message);
    }
  };

  // Fetch items and accounts on mount and after new account linking
  useEffect(() => {
    fetchItemsAndAccounts();
  }, [linkToken]);

  // Plaid link button success callback
  const handleSuccess = async (publicToken, metadata) => {
    try {
      await axios.post('http://localhost:4000/plaid/set_access_token', { public_token: publicToken });
      fetchItemsAndAccounts(); // Refresh the list after linking
    } catch (error) {
      console.error('Error setting access token:', error.message);
    }
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ margin: 2 }}>Plaid Integration Test</Typography>
      {loading ? (
        <CircularProgress />
      ) : linkToken ? (
        <PlaidLinkButton linkToken={linkToken} onSuccess={handleSuccess} />
      ) : (
        <Typography color="error">Failed to load Plaid Link.</Typography>
      )}

      {/* Display items and accounts */}
      {items.length > 0 ? (
        <TableContainer component={Paper} sx={{ marginTop: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Institution</TableCell>
                <TableCell>Account Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Subtype</TableCell>
                <TableCell>Available Balance</TableCell>
                <TableCell>Current Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(item =>
                item.accounts.map(account => (
                  <TableRow key={account._id}>
                    <TableCell>{item.institutionName}</TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>{account.accountType}</TableCell>
                    <TableCell>{account.accountSubType}</TableCell>
                    <TableCell>{account.availableBalance !== undefined ? `$${account.availableBalance}` : 'N/A'}</TableCell>
                    <TableCell>{account.currentBalance !== undefined ? `$${account.currentBalance}` : 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography sx={{ marginTop: 4 }}>No linked accounts found.</Typography>
      )}
    </Container>
  );
};

export default PlaidTestPage;
