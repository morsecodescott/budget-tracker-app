// src/pages/DemoPage.js

import { Box, Typography, Button, Card, CardContent, Grid, Link, Table, TableCell, TableBody, TableRow, TableContainer, Paper, TableHead } from '@mui/material';


import React, { useState, useEffect } from "react";







function DemoPage() {
  const [transactions, setTransactions] = useState([]);

  // Transaction API Call in the Dashboard
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/plaid/transactions?endDate=2024-10-31T00:00:00.000Z&startDate=2024-10-01T00:00:00.000Z');
        const data = await response.json();
        setTransactions(data.transactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <Box sx={{ p: 4, backgroundColor: 'background.default' }}>
      <Typography variant="h1" gutterBottom>
        MUI Theme Demo
      </Typography>

      <Grid container spacing={4}>
        {/* Primary and Secondary Buttons */}
        <Grid item xs={12} md={6}>
          <Typography variant="h2">Buttons</Typography>
          <Button variant="contained" color="primary" sx={{ m: 1 }}>
            Primary
          </Button>
          <Button variant="contained" color="secondary" sx={{ m: 1 }}>
            Secondary
          </Button>
          <Button variant="contained" color="success" sx={{ m: 1 }}>
            Success
          </Button>
          <Button variant="contained" color="error" sx={{ m: 1 }}>
            Error
          </Button>
          <Button variant="contained" color="warning" sx={{ m: 1 }}>
            Warning
          </Button>
          <Button variant="contained" color="info" sx={{ m: 1 }}>
            Info
          </Button>
        </Grid>

        {/* Typography Demo */}
        <Grid item xs={12} md={6}>
          <Typography variant="h2">Typography</Typography>
          <Typography variant="h1" gutterBottom>Heading 1</Typography>
          <Typography variant="h2" gutterBottom>Heading 2</Typography>
          <Typography variant="h3" gutterBottom>Heading 3</Typography>
          <Typography variant="body1" gutterBottom>Body 1 - Sample text for demonstration purposes.</Typography>
          <Typography variant="body2" gutterBottom>Body 2 - Additional sample text for a smaller font.</Typography>
        </Grid>

        {/* Cards Demo */}
        <Grid item xs={12} md={6}>
          <Typography variant="h2">Cards</Typography>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h3">Simple Card</Typography>
              <Typography variant="body1">This is an example of a basic card component.</Typography>
              <Typography variant="body1">
                Check out our{' '}
                <Link href="https://example.com" target="_blank">
                  latest features
                </Link>{' '}
                to learn more.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Parent Category</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.plaidTransactionId}>
                <TableCell>{transaction.name}</TableCell>
                <TableCell>
                  {transaction.category?.name || 'Uncategorized'}
                </TableCell>
                <TableCell>
                  {transaction.category.parentCategoryDetails?.name || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
}

export default DemoPage;
