import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';

const Dashboard = () => {
  const [incomeItems, setIncomeItems] = useState([]);
  const [expenseItems, setExpenseItems] = useState([]);

  useEffect(() => {
    const fetchBudgetItems = async () => {
      try {
        const { data } = await axios.get('http://localhost:4000/budget');
        console.log(data);
        setIncomeItems(data.filter(item => item.type === 'income'));
        setExpenseItems(data.filter(item => item.type === 'expense'));
      } catch (error) {
        console.error('Error fetching budget items:', error);
      }
    };

    fetchBudgetItems();
  }, []);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={2} direction="column">
        <Grid item xs={8} sm={6}>
          <Typography variant="h6" component="h2">Income</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incomeItems.map((item) => (
                  <TableRow key={item._id}>                                      
                      <TableCell component="th" scope="row">{item.category?.name}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">${item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </TableContainer>
        </Grid>
        <Grid item xs={8} sm={6}>
          <Typography variant="h6" component="h2">Expenses</Typography>
          <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenseItems.map((item) => (
                  <TableRow key={item._id}>                                      
                      <TableCell component="th" scope="row">{item.category?.name}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell align="right">${item.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
