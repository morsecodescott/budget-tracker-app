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
  TextField,
  Button
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PlaidTestPage = () => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false); // Update: no auto-fetch on page load
  const [items, setItems] = useState([]);
  const [accessToken, setAccessToken] = useState(''); // Step 1: Add state for access_token
  const [webhook, setWebhook] = useState(''); // Step 1: Add state for webhook
  const { user } = useAuth();

  // Function to fetch link token, now triggered by a button click
  const fetchLinkToken = async () => {
    setLoading(true); // Start loading when fetching begins
    try {
      const response = await axios.post('/plaid/create_link_token', { user, access_token: accessToken, webhook });
      setLinkToken(response.data.link_token);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch link token:', error.message);
      setLoading(false);
    }
  };

  // Function to fetch link token, now triggered by a button click
  const fetchLinkTokenTest = async () => {
    setLoading(true); // Start loading when fetching begins
    
      setLinkToken('link-sandbox-7e767ca6-e445-4205-bd24-4b77fb4b674b');
      setLoading(false);
   
    
  };


  // Fetch user's Plaid items and accounts
  const fetchItemsAndAccounts = async () => {
    try {
      const response = await axios.get(`/items/retrieveItemsByUser/${user.id}`);
      setItems(response.data);
      console.log(response.data);
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
      await axios.post('/plaid/set_access_token', { public_token: publicToken });
      fetchItemsAndAccounts(); // Refresh the list after linking
    } catch (error) {
      console.error('Error setting access token:', error.message);
    }
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ margin: 2 }}>Plaid Integration Test</Typography>
      
      {/* Button to trigger the fetchLinkToken function */}
      <Button
        variant="contained"
        color="primary"
        onClick={fetchLinkTokenTest}
        sx={{ mt: 2, mb: 2 }}
      >
        Fetch Link Token
      </Button>
      
      {loading ? (
        <CircularProgress />
      ) : linkToken ? (
        <PlaidLinkButton linkToken={linkToken} onSuccess={handleSuccess} />
      ) : (
        <Typography color="error">Link token not fetched yet.</Typography>
      )}

      {/* Access Token Input */}
      <TextField
        variant="outlined"
        margin="normal"
        id="access_token"
        label="Access Token"
        name="access_token"
        value={accessToken}
        onChange={(e) => setAccessToken(e.target.value)}
        fullWidth
      />

      {/* Webhook Input */}
      <TextField
        variant="outlined"
        margin="normal"
        id="webhook"
        label="Webhook URL"
        name="webhook"
        value={webhook}
        onChange={(e) => setWebhook(e.target.value)}
        fullWidth
      />

      {/* Display the current value of accessToken */}
      <Typography variant="h6" sx={{ marginTop: 2 }}>
        Current Access Token: {accessToken || 'None'}
      </Typography>

      {/* Display items and accounts */}
      {items && items.length > 0 ? (
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
