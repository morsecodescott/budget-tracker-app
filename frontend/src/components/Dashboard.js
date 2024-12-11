import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  Divider,
  Breadcrumbs,
  Link,
  IconButton
} from "@mui/material";
import axios from "axios";
import BudgetItemForm from "./BudgetItemForm";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
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
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  // Breadcrumbs array
  const breadcrumbs = [
    <Link key="home" underline="hover" color="inherit" onClick={() => navigate('/')} component="button"
      sx={{ cursor: 'pointer' }}>
      Home
    </Link>,

    <Typography key="dashboard" color="text.primary">
      Dashboard
    </Typography>,
  ];

  const handleCategoryClick = (categoryId, isParentCategory = false) => {
    const startDate = new Date(selectedPeriod).toISOString();
    const endDate = new Date(
      Date.UTC(
        new Date(selectedPeriod).getUTCFullYear(),
        new Date(selectedPeriod).getUTCMonth() + 1,
        0
      )
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
      Date.UTC(
        new Date(selectedPeriod).getUTCFullYear(),
        new Date(selectedPeriod).getUTCMonth() + 1,
        0
      )
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
  }, []);

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
      .filter((item) => item.category.parentCategory.name === "Income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const newExpenseSum = filteredItems
      .filter((item) => item.category.parentCategory.name !== "Income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    setIncomeSum(newIncomeSum);
    setExpenseSum(newExpenseSum);
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
        Date.UTC(
          new Date(period).getUTCFullYear(),
          new Date(period).getUTCMonth() + 1,
          0
        )
      ).toISOString();

      const { data } = await axios.get("/plaid/transactions", {
        params: { startDate, endDate },
      });

      data.transactions.forEach((transaction) => {
        if (
          transaction.category?.name === "Income" ||
          transaction.category?.parentCategory?.name === "Income"
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
        transaction.category?.parentCategory?.name === "Income"
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

  const renderSection = (title, total, items, transactions, type) => {
    const sectionSum = transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    const aggregatedByCategory =
      title === "Unbudgeted"
        ? transactions.reduce((acc, transaction) => {
          const categoryName =
            transaction.category?.parentCategory?.name ||
            transaction.category.name;

          if (!acc[categoryName]) {
            acc[categoryName] = { amount: 0, categoryId: transaction.category._id };
          }
          acc[categoryName].amount += transaction.amount;
          return acc;
        }, {})
        : null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h5"
            component="h2"
            sx={{ float: "left" }}
          >
            {title}
          </Typography>
          <Typography variant="h5" component="h2" sx={{ float: "right" }}>
            {title !== "Unbudgeted" ? `$${sectionSum} of ` : ""} ${total}
          </Typography>
          <Box sx={{ clear: "both" }} />
          <Divider sx={{ mb: 2 }} />

          {title === "Unbudgeted" &&
            aggregatedByCategory &&
            Object.entries(aggregatedByCategory).map(([categoryName, data]) => (
              <Box key={data.categoryId} sx={{ mb: 2 }}>
                <Typography
                  variant="linkText"
                  sx={{
                    float: "left",
                  }}
                  onClick={() => handleUnbudgetedClick(data.categoryId)}
                >
                  {categoryName}
                </Typography>
                <Typography variant="subtitle1" sx={{ float: "right" }}>
                  ${data.amount.toFixed(2)}
                </Typography>
                <Box sx={{ clear: "both" }} />
              </Box>
            ))}
          {title !== "Unbudgeted" &&
            items.map((item) => {
              const transactionSum = transactions
                .filter(
                  (transaction) => transaction.category._id === item.category._id
                )
                .reduce((sum, transaction) => sum + transaction.amount, 0);
              return (
                <Box key={item._id} sx={{ mb: 2 }}>
                  <Typography
                    variant="linkText"
                    sx={{
                      float: "left",

                    }}
                    onClick={() => handleCategoryClick(item.category._id)}
                  >
                    {item.category?.parentCategory.name || item.category.name}:{" "}
                    {item.category.name}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ float: "right" }}>
                    ${item.amount}
                  </Typography>
                  <Box sx={{ clear: "both" }} />
                  <LinearProgress
                    sx={{ height: 10 }}
                    variant="determinate"
                    value={(transactionSum / item.amount) * 100}
                  />
                  <Typography variant="caption">
                    ${transactionSum} of ${item.amount}
                  </Typography>
                  <IconButton
                    sx={{ float: "right" }}
                    onClick={() => handleDelete(item._id)}
                    size="small"
                    aria-label="delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    sx={{ float: "right" }}
                    onClick={() => handleEditClick(item)}
                    size="small"
                    aria-label="edit"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
        </CardContent>
      </Card>
    );
  };


  return (
    <Container maxWidth="md" >

      <Box sx={{ p: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          {breadcrumbs}
        </Breadcrumbs>

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
                      {new Date(period).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
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
        {renderSection(
          "Income",
          incomeSum,
          budgetItems.filter(
            (item) =>
              item.category.parentCategory.name === "Income" &&
              new Date(item.period).toISOString().split("T")[0] ===
              selectedPeriod
          ),
          categorizedTransactions.income,
          "income"
        )}
        {renderSection(
          "Expenses",
          expenseSum,
          budgetItems.filter(
            (item) =>
              item.category.parentCategory.name !== "Income" &&
              new Date(item.period).toISOString().split("T")[0] ===
              selectedPeriod
          ),
          categorizedTransactions.expenses,
          "expenses"
        )}
        {renderSection(
          "Unbudgeted",
          categorizedTransactions.unbudgeted.reduce(
            (sum, t) => sum + t.amount,
            0
          ),
          [],
          categorizedTransactions.unbudgeted,
          "unbudgeted"
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;
