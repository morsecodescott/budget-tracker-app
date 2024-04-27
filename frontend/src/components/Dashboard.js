import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, Typography, Button, Box, LinearProgress, Divider } from '@mui/material';
import axios from 'axios';
import BudgetItemForm from './BudgetItemForm';

const Dashboard = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [periods, setPeriods] = useState([]);
  const [incomeSum, setIncomeSum] = useState(0);
  const [expenseSum, setExpenseSum] = useState(0);

  useEffect(() => {
    fetchBudgetItems();
    fetchCategories();
  }, []);

  const fetchBudgetItems = async () => {
    try {
      const { data } = await axios.get('http://localhost:4000/budget');
      setBudgetItems(data);
      // Extract unique periods from the budget data
      const uniquePeriods = [...new Set(data.map(item => new Date(item.period).toISOString().split('T')[0]))];
      setPeriods(uniquePeriods);
      if (uniquePeriods.length > 0 && !selectedPeriod) {
        setSelectedPeriod(uniquePeriods[0]);
      }
    } catch (error) {
      console.error('Error fetching budget items:', error);
    }
  };

  useEffect(() => {
    // Recalculate sums when items or selected period changes
    const filteredItems = budgetItems.filter(item => new Date(item.period).toISOString().split('T')[0] === selectedPeriod);
    const newIncomeSum = filteredItems.filter(item => item.category.parentCategory.name === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const newExpenseSum = filteredItems.filter(item => item.category.parentCategory.name !== 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    setIncomeSum(newIncomeSum);
    setExpenseSum(newExpenseSum);
  }, [budgetItems, selectedPeriod]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleEditClick = (item) => {
    setItemToEdit(item);
    setAddBudgetOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/budget/delete/${id}`);
      fetchBudgetItems(); // Refresh the list
    } catch (error) {
      console.error('Error deleting budget item:', error);
    }
  };

  const handleCloseForm = () => {
    setItemToEdit(null);
    setAddBudgetOpen(false);
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  return (
    <Container maxWidth="lg" sx={{ backgroundColor: 'offwhite' }}>
      <Typography variant="h4" component="h1" gutterBottom>Dashboard</Typography>
      <Box sx={{ p: 3 }}>
        {/* Budget Periods Row */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {periods.map((period, index) => (
            <Grid item key={index}>
              <Button variant={period === selectedPeriod ? "contained" : "outlined"} onClick={() => handlePeriodChange(period)}>
                {period}
              </Button>
            </Grid>
          ))}
        </Grid>
        <Button variant="contained" onClick={() => setAddBudgetOpen(true)}>Add a Budget Item</Button>
        {/* Add/Edit Budget Item Form Modal */}
        <BudgetItemForm
          open={addBudgetOpen}
          onClose={handleCloseForm}
          fetchBudgetItems={fetchBudgetItems}
          categories={categories}
          itemToEdit={itemToEdit}
        />
        {/* Income Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ float: "left" }}>Income</Typography>
            <Typography variant="h6" sx={{ float: "right" }}>${incomeSum}</Typography>
            <Box sx={{ clear: "both" }} />
            <Divider />
            {budgetItems.filter(item => item.category.parentCategory.name === 'Income' && new Date(item.period).toISOString().split('T')[0] === selectedPeriod).map((item) => (
              <Box key={item._id} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ float: "left" }}>{item.category.name}</Typography>
                <Typography variant="subtitle1" sx={{ float: "right" }}>${item.amount}</Typography>
                <Box sx={{ clear: "both" }} />
                <LinearProgress variant="determinate" value={0} />
                <Typography variant="caption">$0 of ${item.amount}</Typography>
                <Button sx={{ float: "right" }} onClick={() => handleDelete(item._id)}>Delete</Button>
                <Button sx={{ float: "right" }} onClick={() => handleEditClick(item)}>Edit</Button>
              </Box>
            ))}
          </CardContent>
        </Card>
        {/* Expenses Section */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ float: "left" }}>Expenses</Typography>
            <Typography variant="h6" sx={{ float: "right" }}>${expenseSum}</Typography>
            <Box sx={{ clear: "both" }} />
            <Divider />
            {budgetItems.filter(item => item.category.parentCategory.name !== 'Income' && new Date(item.period).toISOString().split('T')[0] === selectedPeriod).map((item) => (
              <Box key={item._id} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ float: "left" }}>
                  {item.category.parentCategory.name}: {item.category.name}
                </Typography>
                <Typography variant="subtitle1" sx={{ float: "right" }}>
                  ${item.amount}
                </Typography>
                <Box sx={{ clear: "both" }} />
                <LinearProgress variant="determinate" value={0} />
                <Typography variant="caption">$0 of ${item.amount} left</Typography>
                <Button sx={{ float: "right" }} onClick={() => handleDelete(item._id)}>Delete</Button>
                <Button sx={{ float: "right" }} onClick={() => handleEditClick(item)}>Edit</Button>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Dashboard;
