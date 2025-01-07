import React, { useState, useEffect, useCallback } from 'react';
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
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PlaidTestPage = () => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [accessToken, setAccessToken] = useState('');
  const [webhook, setWebhook] = useState('');
  const { user } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Function to fetch link token
  const fetchLinkToken = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/plaid/create_link_token', { user, access_token: accessToken, webhook });
      setLinkToken(response.data.link_token);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch link token:', error.message);
      setLoading(false);
    }
  };

  // Function to fetch user's Plaid items and accounts
  const fetchItemsAndAccounts = useCallback(async () => {
    try {
      const response = await axios.get(`plaid/items/${user.id}`);
      setItems(response.data.items);
    } catch (error) {
      console.error('Error fetching Plaid items:', error.message);
    }
  }, [user.id]);

  useEffect(() => {
    fetchItemsAndAccounts();
  }, [fetchItemsAndAccounts, linkToken]);

  // Function to fetch transactions for a specific account
  const fetchTransactions = async (accountId) => {
    try {
      const response = await axios.get(`/plaid/transactions/${accountId}`);
      setTransactions(response.data);
      console.log(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
    }
  };

  const handleSuccess = async (publicToken, metadata) => {
    try {
      await axios.post('/plaid/set_access_token', { public_token: publicToken });
      fetchItemsAndAccounts(); // Adjust this to your current item fetching logic
    } catch (error) {
      console.error('Error setting access token:', error.message);
    }
  };


  // Handle accordion expand/collapse and fetch transactions
  const handleAccordionChange = (account) => async (event, isExpanded) => {
    if (isExpanded) {
      setSelectedAccount(account);
      await fetchTransactions(account._id);
    }
    setExpanded(isExpanded ? account._id : false);
  };

  // Handle pagination change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Function to start Plaid Link session in update mode
  const startUpdateMode = async () => {
    if (!accessToken) {
      console.error('Access token is required to start update mode');
      return;
    }
    try {
      const response = await axios.post('/plaid/create_link_token', { access_token: accessToken, mode: 'update' });
      const updateLinkToken = response.data.link_token;
      if (updateLinkToken) {
        // Assuming PlaidLinkButton can handle update mode
        setLinkToken(updateLinkToken);
      }
    } catch (error) {
      console.error('Failed to start update mode:', error.message);
    }
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ margin: 2 }}>Plaid Integration Test</Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={fetchLinkToken}
        sx={{ mt: 2, mb: 2 }}
      >
        Fetch Link Token
      </Button>

      {loading ? (
        <CircularProgress />
      ) : linkToken ? (
        <PlaidLinkButton linkToken={linkToken} accessToken={accessToken} onSuccess={handleSuccess} />
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

      {/* Button to start Plaid Link session in update mode */}
      <Button
        variant="contained"
        color="secondary"
        onClick={startUpdateMode}
        sx={{ mt: 2, mb: 2 }}
      >
        Start Update Mode
      </Button>

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

      {/* Display items and accounts */}
      {items && items.length > 0 ? (
        items.map(item => (
          item.accounts && item.accounts.length > 0 && item.accounts.map(account => (
            <Accordion
              key={account._id}
              expanded={expanded === account._id}
              onChange={handleAccordionChange(account)}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{item.institutionName} - {account.accountName} - {account.accountType} - {item.accessToken}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* Transaction Table */}

                {transactions.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Category</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((transaction) => (
                            <TableRow key={transaction.plaidTransactionId}>
                              <TableCell>{new Date(transaction.date).toLocaleDateString('en-CA')}</TableCell>
                              <TableCell>{transaction.name}</TableCell>
                              <TableCell align='right'>{transaction.amount}</TableCell>
                              <TableCell>{transaction.category.name}</TableCell>
                              <TableCell>{transaction.plaidCategory.detailed || "empty"}</TableCell>
                            </TableRow>

                          ))}

                      </TableBody>
                    </Table>
                    {/* Pagination */}
                    <TablePagination
                      rowsPerPageOptions={[10, 25, 50]}
                      component="div"
                      count={transactions.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                  </TableContainer>
                ) : (
                  <Typography>No transactions found for this account.</Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))
        ))
      ) : (
        <Typography>No linked accounts found.</Typography>
      )}
    </Container>
  );
};

export default PlaidTestPage;
