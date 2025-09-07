import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Container,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Breadcrumbs from "./Breadcrumbs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Autocomplete } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import axios from "axios";


const TransactionsPage = ({ userId }) => {
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true); // Global loading state
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgetFilter, setBudgetFilter] = useState("all"); // New state for budget filter
  const isInitialized = useRef(false);
  const { lastMessage } = useSocket();

  useEffect(() => {
    if (lastMessage) {
      console.log("New message received in TransactionsPage, refetching data:", lastMessage);
      fetchTransactions();
    }
  }, [lastMessage]);


  function toLocalDate(date) {
    if (!date) return null;
    const zoneOffset = new Date(date).getTimezoneOffset();
    const adjustedDate = new Date(date).setMinutes(zoneOffset);
    const returnValue = new Date(
      new Date(adjustedDate).getUTCFullYear(),
      new Date(adjustedDate).getUTCMonth(),
      new Date(date).getUTCDate()
    );
    return returnValue;
  }

  // Breadcrumbs array
  const breadcrumbs = [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Transactions", path: "" }
  ];

  // Fetch categories only once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/categories");
        const flattenCategories = (categories) => {
          const result = [];
          const traverse = (category, parentName = null) => {
            result.push({
              _id: category._id,
              name: category.name,
              parentCategory: parentName,
            });
            category.children.forEach((child) => traverse(child, category.name));
          };
          categories.forEach((category) => traverse(category));
          return result;
        };
        setCategories(flattenCategories(response.data));
      } catch (err) {
        setError("Failed to fetch categories.");
      }
    };
    fetchCategories();

  }, []);

  // Fetch transactions whenever filter changes
  const fetchTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        page,
        rowsPerPage,
        category: selectedCategories.length > 0 ? selectedCategories.map((c) => c._id) : undefined,
        budgetFilter, // Include budget filter in API call
      };
      const { data } = await axios.get("/plaid/transactions", { params });
      setTransactions(data.transactions);
      setTotalCount(data.total);

    } catch (err) {
      setError("Failed to fetch transactions.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize filters from location.state if available
  useEffect(() => {
    if (location.state && categories.length > 0) {
      const { startDate, endDate, category, budgetFilter } = location.state;
      setDateRange({
        startDate: startDate ? new Date(startDate) : dateRange.startDate,
        endDate: endDate ? new Date(endDate) : dateRange.endDate,
      });
      if (category) {
        const selected = categories.filter((cat) => cat._id === category);
        setSelectedCategories(selected);
      }

      if (budgetFilter) {
        setBudgetFilter(budgetFilter);
      }
    }
    isInitialized.current = true;
  }, [location.state, categories]); // Depend on categories being loaded

  // Fetch transactions when filters change
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitialized.current && dateRange.startDate && dateRange.endDate) {
        fetchTransactions();
      }
    }, 500); // Delay of 300ms
    return () => clearTimeout(timeout);
  }, [dateRange, page, rowsPerPage, selectedCategories, budgetFilter]);

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCategoryChange = (newValue) => {
    setSelectedCategories(newValue);
  };

  const handleBudgetFilterChange = (event) => {
    setBudgetFilter(event.target.value); // Update budget filter state
  };



  return (
    <Container maxWidth="md">
      {loading ? (
        <Box display="flex" justifyContent="center" mt={3}>
          <CircularProgress />
        </Box>
      ) : (
        <Box p={3}>
          <Breadcrumbs items={breadcrumbs} />

          <Grid container spacing={3} sx={{ marginTop: 3, marginBottom: 3 }} >
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={toLocalDate(dateRange.startDate)}
                  onChange={(value) => handleDateChange("startDate", value)}
                  TextField={(params) => <TextField {...params} variant="outlined" />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={toLocalDate(dateRange.endDate)}
                  onChange={(value) => handleDateChange("endDate", value)}
                  textField={(params) => <TextField {...params} variant="outlined" />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                multiple

                options={categories}
                getOptionLabel={(option) => option.name}
                value={selectedCategories}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                onChange={(event, newValue) => handleCategoryChange(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Category" variant="outlined" />
                )}
                sx={{ width: "100%" }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3} sizing="grow">
              <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                <InputLabel id="budget-filter-label">Budget Filter</InputLabel>
                <Select
                  label="Budget Filter"
                  labelId="budget-filter-label"
                  value={budgetFilter}
                  onChange={handleBudgetFilterChange}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="budgeted">Budgeted</MenuItem>
                  <MenuItem value="unbudgeted">Unbudgeted</MenuItem>
                </Select>
              </FormControl>

            </Grid>
          </Grid>


          {error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.plaidTransactionId}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.name}</TableCell>
                        <TableCell>{transaction.category?.name || "Uncategorized"}</TableCell>
                        <TableCell align="right">${transaction.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[25, 50, 100]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
};

export default TransactionsPage;
