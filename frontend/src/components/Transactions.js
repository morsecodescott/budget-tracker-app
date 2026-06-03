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
  Checkbox,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
  const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Snackbar / Toast for Category Rules
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [rulePromptData, setRulePromptData] = useState(null);

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleData, setRuleData] = useState({ merchantName: "", matchType: "contains", categoryId: "" });

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
      const { data } = await axios.get("/transactions", { params });
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

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = transactions.map((n) => n._id);
      setSelectedTransactionIds(newSelecteds);
      return;
    }
    setSelectedTransactionIds([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selectedTransactionIds.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedTransactionIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedTransactionIds.slice(1));
    } else if (selectedIndex === selectedTransactionIds.length - 1) {
      newSelected = newSelected.concat(selectedTransactionIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedTransactionIds.slice(0, selectedIndex),
        selectedTransactionIds.slice(selectedIndex + 1)
      );
    }

    setSelectedTransactionIds(newSelected);
  };

  const isSelected = (id) => selectedTransactionIds.indexOf(id) !== -1;

  const handleMassDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedTransactionIds.length} transactions?`)) {
      try {
        await axios.delete("/transactions", { data: { transactionIds: selectedTransactionIds } });
        setSelectedTransactionIds([]);
        fetchTransactions();
      } catch (err) {
        alert("Failed to delete transactions");
      }
    }
  };

  const handleDeleteSingle = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await axios.delete(`/transactions/${id}`);
        fetchTransactions();
      } catch (err) {
        alert("Failed to delete transaction");
      }
    }
  };

  const handleEditClick = (transaction) => {
    setEditingTransaction({
        ...transaction,
        categoryId: transaction.category ? transaction.category._id : ""
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    try {
      const originalCategoryId = transactions.find(t => t._id === editingTransaction._id)?.category?._id;

      await axios.put(`/transactions/${editingTransaction._id}`, {
        name: editingTransaction.name,
        merchant_name: editingTransaction.merchant_name,
        amount: editingTransaction.amount,
        date: editingTransaction.date,
        category: { _id: editingTransaction.categoryId } // send as object with _id
      });

      // Check if category changed
      if (editingTransaction.categoryId && editingTransaction.categoryId !== originalCategoryId) {
        setRulePromptData({
          merchantName: editingTransaction.merchant_name || editingTransaction.name,
          categoryId: editingTransaction.categoryId
        });
        setToastMessage("Category updated. Create a rule for similar transactions?");
        setToastOpen(true);
      }

      setEditDialogOpen(false);
      fetchTransactions();
    } catch (err) {
      alert("Failed to update transaction");
    }
  };

  const handleCreateRulePrompt = () => {
    setToastOpen(false);
    if (rulePromptData) {
      setRuleData({
        merchantName: rulePromptData.merchantName,
        matchType: "contains",
        categoryId: rulePromptData.categoryId
      });
      setRuleDialogOpen(true);
    }
  };

  const handleSaveRule = async () => {
    try {
      await axios.post("/category-rules", ruleData);
      setRuleDialogOpen(false);
      // Optionally apply to past txs automatically or prompt. For now, just save.
      alert("Rule created successfully!");
    } catch (err) {
      alert("Failed to create rule");
    }
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
              {selectedTransactionIds.length > 0 && (
                <Box p={2} display="flex" justifyContent="space-between" alignItems="center" bgcolor="primary.light" color="primary.contrastText">
                  <Typography variant="subtitle1">
                    {selectedTransactionIds.length} selected
                  </Typography>
                  <Button variant="contained" color="error" onClick={handleMassDelete}>
                    Delete Selected
                  </Button>
                </Box>
              )}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedTransactionIds.length > 0 && selectedTransactionIds.length < transactions.length}
                          checked={transactions.length > 0 && selectedTransactionIds.length === transactions.length}
                          onChange={handleSelectAllClick}
                        />
                      </TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const isItemSelected = isSelected(transaction._id);
                      return (
                        <TableRow
                          key={transaction._id}
                          hover
                          role="checkbox"
                          aria-checked={isItemSelected}
                          selected={isItemSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isItemSelected}
                              onChange={(event) => handleClick(event, transaction._id)}
                            />
                          </TableCell>
                          <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                          <TableCell>{transaction.name}</TableCell>
                          <TableCell>{transaction.category?.name || "Uncategorized"}</TableCell>
                          <TableCell align="right">${transaction.amount.toFixed(2)}</TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleEditClick(transaction)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteSingle(transaction._id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogContent>
              {editingTransaction && (
                <Box mt={2} display="flex" flexDirection="column" gap={2}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date"
                      value={new Date(editingTransaction.date)}
                      onChange={(value) => setEditingTransaction({...editingTransaction, date: value})}
                      TextField={(params) => <TextField {...params} />}
                    />
                  </LocalizationProvider>
                  <TextField
                    label="Name"
                    value={editingTransaction.name || ''}
                    onChange={(e) => setEditingTransaction({...editingTransaction, name: e.target.value})}
                  />
                  <TextField
                    label="Merchant Name"
                    value={editingTransaction.merchant_name || ''}
                    onChange={(e) => setEditingTransaction({...editingTransaction, merchant_name: e.target.value})}
                  />
                  <TextField
                    label="Amount"
                    type="number"
                    value={editingTransaction.amount || 0}
                    onChange={(e) => setEditingTransaction({...editingTransaction, amount: parseFloat(e.target.value)})}
                  />
                  <FormControl fullWidth>
                    <InputLabel id="edit-category-label">Category</InputLabel>
                    <Select
                      labelId="edit-category-label"
                      value={editingTransaction.categoryId}
                      label="Category"
                      onChange={(e) => setEditingTransaction({...editingTransaction, categoryId: e.target.value})}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSave} variant="contained" color="primary">Save</Button>
            </DialogActions>
          </Dialog>

          {/* Category Rule Toast */}
          <Snackbar
            open={toastOpen}
            autoHideDuration={6000}
            onClose={() => setToastOpen(false)}
            message={toastMessage}
            action={
              <Button color="secondary" size="small" onClick={handleCreateRulePrompt}>
                Create Rule
              </Button>
            }
          />

          {/* Create Rule Dialog */}
          <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)}>
            <DialogTitle>Create Category Rule</DialogTitle>
            <DialogContent>
              <Box mt={2} display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Merchant Name"
                  value={ruleData.merchantName}
                  onChange={(e) => setRuleData({ ...ruleData, merchantName: e.target.value })}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel id="rule-match-type">Match Type</InputLabel>
                  <Select
                    labelId="rule-match-type"
                    value={ruleData.matchType}
                    label="Match Type"
                    onChange={(e) => setRuleData({ ...ruleData, matchType: e.target.value })}
                  >
                    <MenuItem value="exact">Exact Match</MenuItem>
                    <MenuItem value="contains">Contains</MenuItem>
                    <MenuItem value="startsWith">Starts With</MenuItem>
                    <MenuItem value="endsWith">Ends With</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="rule-category">Category</InputLabel>
                  <Select
                    labelId="rule-category"
                    value={ruleData.categoryId}
                    label="Category"
                    onChange={(e) => setRuleData({ ...ruleData, categoryId: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveRule} variant="contained" color="primary">Save Rule</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Container>
  );
};

export default TransactionsPage;
