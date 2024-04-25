import React, { useState, useEffect } from 'react';
import { Container, Grid, Card,CardContent, Typography, Button,Box, LinearProgress, Divider, } from '@mui/material';
import axios from 'axios';

const budgetMonths = ['Jan-24','Feb-24','Mar-24', 'Apr-24','May-24','Jun-24'];
// Dummy data
const incomeSum = "5,647";
const expenseSum = "1,881";

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
    <Container maxWidth="lg" sx={{ backgroundColor: 'offwhite' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Box sx={{ p: 3 }}>
        {/* Budget Months Row */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {budgetMonths.map(
            (month, index) => (
              <Grid item key={index}>
                <Button variant="outlined">{month}</Button>
              </Grid>
            )
          )}
        </Grid>
        
        {/* Income Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ float: "left" }}>
            Income
          </Typography>
          <Typography variant="h6" sx={{ float: "right" }}>
            ${incomeSum}
          </Typography>
          <Box sx={{ clear: "both" }} />
          <Divider />
          <Box sx={{ clear: "both", pl: 1, mt: 2 }}>
          {incomeItems.map((item) => (
            <Box key={item._id} sx={{mb: 2}}>
              <Typography variant="subtitle1" sx={{ float: "left" }}>
                {item.category?.name}
              </Typography>
              <Typography variant="subtitle1" sx={{ float: "right" }}>
                {item.amount}
              </Typography>
              <Box sx={{ clear: "both" }} />
              <LinearProgress variant="determinate" value={0} />
              <Typography variant="caption">$0 of {item.amount}</Typography>
            </Box> 
          ))}
          </Box>  
        </CardContent>
      </Card>
      
      {/* Expenses Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ float: "left" }}>
            Expenses
          </Typography>
          <Typography variant="h6" sx={{ float: "right" }}>
            ${expenseSum}
          </Typography>
          <Box sx={{ clear: "both" }} />
          <Divider />
          <Box sx={{ clear: "both", pl: 1, mt: 2 }}>
            {/* List of Expense Items */}
            {expenseItems.map((item) => (
              <Box key={item._id} sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {item.category?.name}: {item.description}
                </Typography>
                <LinearProgress variant="determinate" value={0} />
                <Typography variant="caption">
                  $0 of ${item.amount} left
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      </Box>
      
    </Container>
  );
};

export default Dashboard;
