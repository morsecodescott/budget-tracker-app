import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Divider
} from "@mui/material";
import Breadcrumbs from "./Breadcrumbs";
import axios from "axios";
import BudgetItemForm from "./BudgetItemForm";
import BudgetSection from "./BudgetSection";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";

const Dashboard = () => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [periods, setPeriods] = useState([]);
  const [incomeSum, setIncomeSum] = useState(0);
  const [expenseSum, setExpenseSum] = useState(0);
  const [actualIncomeSum, setActualIncomeSum] = useState(0);
  const [actualExpenseSum, setActualExpenseSum] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [accountBalances, setAccountBalances] = useState([]);
  const navigate = useNavigate();

  // Breadcrumbs array
  const breadcrumbs = [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "" }
  ];

  const handleCategoryClick = (categoryId, isParentCategory = false) => {
    const startDate = new Date(selectedPeriod).toISOString();
    const endDate = new Date(
      new Date(selectedPeriod).getFullYear(),
      new Date(selectedPeriod).getMonth() + 2,
      0
    ).toISOString();

    navigate("/transactions", {
      state: {
        startDate: startDate,
        endDate: endDate,
        category: categoryId,
      },
    });
  };

  const handleUnbudgetedClick = () => {
    const startDate = new Date(selectedPeriod).toISOString();
    const endDate = new Date(
      new Date(selectedPeriod).getFullYear(),
      new Date(selectedPeriod).getMonth() + 2,
      0
    ).toISOString();

    navigate("/transactions", {
      state: {
        startDate: startDate,
        endDate: endDate,
        budgetFilter: "unbudgeted",
      },
    });
  };

  useEffect(() => {
    fetchBudgetItems();
    fetchCategories();
    fetchAccountBalances();
  }, []);

  const fetchAccountBalances = async () => {
    try {
      const { data } = await axios.get("/plaid/accounts/summary");
      setAccountBalances(data.summary);
    } catch (error) {
      console.error("Error fetching account balances:", error);
    }
  };

  const fetchBudgetItems = async () => {
    try {
      const { data } = await axios.get("/budget");
      setBudgetItems(data);
      const uniquePeriods = [
        ...new Set(
          data.map((item) => new Date(item.period).toISOString().split("T")[0])
        ),
      ].sort((a, b) => new Date(a) - new Date(b));
      setPeriods(uniquePeriods);
      if (uniquePeriods.length > 0 && !selectedPeriod) {
        setSelectedPeriod(uniquePeriods[uniquePeriods.length - 1]);
      }
    } catch (error) {
      console.error("Error fetching budget items:", error);
    }
  };

  useEffect(() => {
    const filteredItems = budgetItems.filter(
      (item) =>
        new Date(item.period).toISOString().split("T")[0] === selectedPeriod
    );

    const newIncomeSum = filteredItems
      .filter((item) => {
        const parentCategoryName = item.category?.parentCategory?.name || item.category?.name;
        return parentCategoryName === "Income";
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    const newExpenseSum = filteredItems
      .filter((item) => {
        const parentCategoryName = item.category?.parentCategory?.name || item.category?.name;
        return parentCategoryName !== "Income";
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    setIncomeSum(Math.round(newIncomeSum));
    setExpenseSum(Math.round(newExpenseSum));
  }, [budgetItems, selectedPeriod]);

  useEffect(() => {
    if (selectedPeriod) {
      fetchTransactions(selectedPeriod);
    }
  }, [selectedPeriod]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchTransactions = async (period) => {
    try {
      const startDate = new Date(period).toISOString();
      const endDate = new Date(
        new Date(period).getFullYear(),
        new Date(period).getMonth() + 2,
        0
      ).toISOString();
      const { data } = await axios.get("/plaid/transactions", {
        params: { startDate, endDate },
      });

      data.transactions.forEach((transaction) => {
        if (
          transaction.category?.name === "Income" ||
          transaction.category?.parentCategoryDetails?.name === "Income"
        ) {
          transaction.amount = transaction.amount * -1;
        }
      });

      setTransactions(data.transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const handleEditClick = (item) => {
    setItemToEdit(item);
    setAddBudgetOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`budget/delete/${id}`);
      fetchBudgetItems();
    } catch (error) {
      console.error("Error deleting budget item:", error);
    }
  };

  const handleCloseForm = () => {
    setItemToEdit(null);
    setAddBudgetOpen(false);
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const categorizedTransactions = transactions.reduce(
    (acc, transaction) => {
      const periodBudgetItems = budgetItems.filter(
        (item) =>
          new Date(item.period).toISOString().split("T")[0] === selectedPeriod
      );

      const budgetCategory = periodBudgetItems.find(
        (item) => item.category._id === transaction.category._id
      );

      if (
        transaction.category?.name === "Income" ||
        transaction.category?.parentCategoryDetails?.name === "Income"
      ) {
        acc.income.push(transaction);
      } else if (budgetCategory) {
        acc.expenses.push(transaction);
      } else {
        acc.unbudgeted.push(transaction);
      }
      return acc;
    },
    { income: [], expenses: [], unbudgeted: [] }
  );

  useEffect(() => {
    const income = Math.round(
      categorizedTransactions.income.reduce((sum, t) => sum + t.amount, 0)
    );

    const expenses = Math.round(
      categorizedTransactions.expenses.reduce((sum, t) => sum + t.amount, 0)
    );

    const unbudgeted = Math.round(
      categorizedTransactions.unbudgeted.reduce((sum, t) => sum + t.amount, 0)
    );

    const totalExpenses = expenses + unbudgeted;

    setActualIncomeSum(income);
    setActualExpenseSum(totalExpenses);
  }, [categorizedTransactions]);

  return (
    <Container maxWidth="lg">
      <Grid container direction="row" spacing={2} sx={{ justifyContent: "center", alignItems: "flex-start" }}>
        <Grid item xs={12}>
          <Box sx={{ p: 3 }}>
            <Breadcrumbs items={breadcrumbs} />
          </Box>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom>
                Account Balances
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {accountBalances.length === 0 ? (
                <Typography>No account balances available</Typography>
              ) : (
                accountBalances.map((account, index) => (
                  <Box key={index} sx={{ marginBottom: 1 }} display="flex" justifyContent="space-between">
                    <Typography variant="body2">
                      {account._id}({account.accountCount}):
                    </Typography>
                    <Typography variant="body2">
                      ${account.totalBalance.toFixed(2)}
                    </Typography>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            <Box flexGrow={1} display="flex" justifyContent="left">
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="period-select-label">Select Period</InputLabel>
                <Select
                  labelId="period-select-label"
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  label="Budget Period"
                >
                  {[...periods]
                    .sort((a, b) => new Date(b) - new Date(a))
                    .map((period) => (
                      <MenuItem key={period} value={period}>
                        {new Date(period + 'T00:00:00Z').toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          timeZone: 'UTC'
                        })}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={() => setAddBudgetOpen(true)}
            >
              Budget Item
            </Button>
          </Box>

          <BudgetItemForm
            open={addBudgetOpen}
            onClose={handleCloseForm}
            fetchBudgetItems={fetchBudgetItems}
            categories={categories}
            itemToEdit={itemToEdit}
          />
          <BudgetSection
            title="Income"
            total={incomeSum}
            items={budgetItems.filter((item) => {
              const parentCategoryName = item.category?.parentCategory?.name || item.category?.name;
              return (
                parentCategoryName === "Income" &&
                new Date(item.period).toISOString().split("T")[0] === selectedPeriod
              );
            })}
            transactions={categorizedTransactions.income}
            type="income"
            handleCategoryClick={handleCategoryClick}
            handleDelete={handleDelete}
            handleEditClick={handleEditClick}
          />

          <BudgetSection
            title="Expenses"
            total={expenseSum}
            items={budgetItems.filter((item) => {
              const parentCategoryName = item.category?.parentCategory?.name || item.category?.name;
              return (
                parentCategoryName !== "Income" &&
                new Date(item.period).toISOString().split("T")[0] === selectedPeriod
              );
            })}
            transactions={categorizedTransactions.expenses}
            type="expenses"
            handleCategoryClick={handleCategoryClick}
            /* handleUnbudgetedClick={handleUnbudgetedClick}*/
            handleDelete={handleDelete}
            handleEditClick={handleEditClick}
          />

          <BudgetSection
            title="Unbudgeted"
            total={Math.round(categorizedTransactions.unbudgeted.reduce((sum, t) => sum + t.amount, 0))}
            items={[]}
            transactions={categorizedTransactions.unbudgeted}
            type="unbudgeted"
            handleUnbudgetedClick={handleUnbudgetedClick}
          />
        </Grid>

        <Grid item xs={12} sm={3}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <Card>
                <CardContent>
                  <Typography variant="h3">Budgets</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ marginBottom: 1 }} display="flex" justifyContent="space-between">
                    <Typography>Income:</Typography>
                    <Typography>${incomeSum}</Typography>
                  </Box>
                  <Box sx={{ marginBottom: 1 }} display="flex" justifyContent="space-between">
                    <Typography>Expenses:</Typography>
                    <Typography>${expenseSum}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ marginBottom: 1 }} display="flex" justifyContent="space-between">
                    <Typography>
                      {incomeSum - expenseSum < 0 ? "Over:" : "Remaining:"}
                    </Typography>
                    <Typography color={incomeSum - expenseSum < 0 ? "error" : "textPrimary"}>
                      ${Math.abs(incomeSum - expenseSum)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item>
              <Card>
                <CardContent>
                  <Typography variant="h3">Actual</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ marginBottom: 1 }} display="flex" justifyContent="space-between">
                    <Typography>Income:</Typography>
                    <Typography>${actualIncomeSum}</Typography>
                  </Box>
                  <Box sx={{ marginBottom: 1 }} display="flex" justifyContent="space-between">
                    <Typography>Expenses:</Typography>
                    <Typography>${actualExpenseSum}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ marginBottom: 1 }} display="flex" justifyContent="space-between">
                    <Typography>{actualIncomeSum - actualExpenseSum < 0 ? "Over:" : "Remaining:"}</Typography>
                    <Typography color={actualIncomeSum - actualExpenseSum < 0 ? "error" : "textPrimary"}>${actualIncomeSum - actualExpenseSum}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
