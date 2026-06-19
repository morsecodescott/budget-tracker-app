import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,







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
  DialogContentText,
  Snackbar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Breadcrumbs from "./Breadcrumbs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Autocomplete } from "@mui/material";
import { DataGrid, getGridDateOperators } from "@mui/x-data-grid";
import { useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import axios from "axios";


const DateRangeFilterInput = (props) => {
  const { item, applyValue, focusElementRef } = props;

  const handleStartDateChange = (newValue) => {
    applyValue({ ...item, value: [newValue, item.value ? item.value[1] : null] });
  };

  const handleEndDateChange = (newValue) => {
    applyValue({ ...item, value: [item.value ? item.value[0] : null, newValue] });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 1 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Start Date"
          value={item.value ? item.value[0] : null}
          onChange={handleStartDateChange}
          inputRef={focusElementRef}
          slotProps={{ textField: { variant: 'standard' } }}
        />
        <DatePicker
          label="End Date"
          value={item.value ? item.value[1] : null}
          onChange={handleEndDateChange}
          slotProps={{ textField: { variant: 'standard' } }}
        />
      </LocalizationProvider>
    </Box>
  );
};

const customDateOperators = [
  ...getGridDateOperators(),
  {
    label: 'is between',
    value: 'isBetween',
    getApplyFilterFn: (filterItem) => {
      if (!Array.isArray(filterItem.value) || filterItem.value.length !== 2) {
        return null;
      }
      if (filterItem.value[0] == null || filterItem.value[1] == null) {
        return null;
      }
      return (params) => {
        if (!params.value) return false;
        const cellDate = new Date(params.value);
        const startDate = new Date(filterItem.value[0]);
        const endDate = new Date(filterItem.value[1]);
        endDate.setHours(23, 59, 59, 999);
        return cellDate >= startDate && cellDate <= endDate;
      };
    },
    InputComponent: DateRangeFilterInput,
  },
];

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

  const [sortModel, setSortModel] = useState([]);
  const [filterModel, setFilterModel] = useState({ items: [] });
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
    date: true,
    name: true,
    categoryName: true,
    amount: true,
    institutionName: false,
    accountName: false,
    merchant_name: false,
    merchant_city: false,
    merchant_state_or_province: false,
    merchant_country_code: false,
    actions: true,
  });
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Snackbar / Toast for Category Rules & General Notifications
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastAction, setToastAction] = useState(null); // allow optional action on toast
  const [rulePromptData, setRulePromptData] = useState(null);

  // Dialog for confirmations
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", content: "", onConfirm: null });

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
  const fetchTransactions = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    setError("");
    try {
      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        page,
        rowsPerPage,
        category: selectedCategories.length > 0 ? selectedCategories.map((c) => c._id) : undefined,
        budgetFilter, // Include budget filter in API call
        sortModel: JSON.stringify(sortModel),
        filterModel: JSON.stringify(filterModel),
      };
      const { data } = await axios.get("/transactions", { params });
      setTransactions(data.transactions);
      setTotalCount(data.total);

    } catch (err) {
      setError("Failed to fetch transactions.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
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
        // Prevent loading spinner logic from completely unmounting DataGrid during rapid filter typing
        fetchTransactions(transactions.length === 0);
      }
    }, 500); // Delay of 500ms
    return () => clearTimeout(timeout);
  }, [dateRange, page, rowsPerPage, selectedCategories, budgetFilter, sortModel, filterModel]);


  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (newValue) => {
    setSelectedCategories(newValue);
  };

  const handleBudgetFilterChange = (event) => {
    setBudgetFilter(event.target.value); // Update budget filter state
  };

  const showToast = (message, action = null) => {
    setToastMessage(message);
    // Wrap action in a factory function so React stores the function itself
    setToastAction(() => action ? () => action() : null);
    setToastOpen(true);
  };

  const handleMassDelete = () => {
    setConfirmDialog({
      open: true,
      title: "Delete Transactions",
      content: `Are you sure you want to delete ${selectedTransactionIds.length} transactions?`,
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, open: false });
        try {
          await axios.delete("/transactions", { data: { transactionIds: selectedTransactionIds } });
          setSelectedTransactionIds([]);
          showToast("Transactions deleted successfully");
          fetchTransactions(false);
        } catch (err) {
          showToast("Failed to delete transactions");
        }
      }
    });
  };

  const handleDeleteSingle = (id) => {
    setConfirmDialog({
      open: true,
      title: "Delete Transaction",
      content: "Are you sure you want to delete this transaction?",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, open: false });
        try {
          await axios.delete(`/transactions/${id}`);
          showToast("Transaction deleted successfully");
          fetchTransactions(false);
        } catch (err) {
          showToast("Failed to delete transaction");
        }
      }
    });
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
        const promptData = {
          merchantName: editingTransaction.merchant_name || editingTransaction.name,
          categoryId: editingTransaction.categoryId
        };
        setRulePromptData(promptData);

        // Pass the prompt data explicitly to avoid stale closures
        showToast("Category updated. Create a rule for similar transactions?", () => {
           setToastOpen(false);
           setRuleData({
             merchantName: promptData.merchantName,
             matchType: "contains",
             categoryId: promptData.categoryId
           });
           setRuleDialogOpen(true);
        });
      } else {
        showToast("Transaction updated successfully");
      }

      setEditDialogOpen(false);
      fetchTransactions(false);
    } catch (err) {
      showToast("Failed to update transaction");
    }
  };

  const handleSaveRule = async () => {
    try {
      await axios.post("/category-rules", ruleData);
      setRuleDialogOpen(false);
      showToast("Rule created successfully!");
    } catch (err) {
      showToast("Failed to create rule");
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
              <Box sx={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={transactions}
                  columns={[
                    { field: 'date', headerName: 'Date', width: 120, valueGetter: (value) => value ? new Date(value) : null, type: 'date', filterOperators: customDateOperators },
                    { field: 'name', headerName: 'Name', width: 200 },
                    { field: 'categoryName', headerName: 'Category', width: 150, type: 'singleSelect', valueOptions: [...categories.map(c => c.name), 'Uncategorized'], valueGetter: (value, row) => row.category?.name || 'Uncategorized' },
                    { field: 'amount', headerName: 'Amount', width: 120, type: 'number', valueFormatter: (value) => value ? `$${value.toFixed(2)}` : '$0.00' },
                    { field: 'institutionName', headerName: 'Institution', width: 150, valueGetter: (value, row) => row.accountId?.itemId?.institutionName || '' },
                    { field: 'accountName', headerName: 'Account', width: 150, valueGetter: (value, row) => row.accountId?.accountName || '' },
                    { field: 'merchant_name', headerName: 'Merchant Name', width: 150 },
                    { field: 'merchant_city', headerName: 'City', width: 120 },
                    { field: 'merchant_state_or_province', headerName: 'State', width: 100 },
                    { field: 'merchant_country_code', headerName: 'Country', width: 100 },
                    {
                      field: 'actions',
                      headerName: 'Actions',
                      width: 100,
                      sortable: false,
                      filterable: false,
                      renderCell: (params) => (
                        <Box>
                          <IconButton size="small" onClick={() => handleEditClick(params.row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteSingle(params.row._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ),
                    },
                  ]}
                  columnVisibilityModel={columnVisibilityModel}
                  onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                  pagination
                  paginationMode="server"
                  rowCount={totalCount}
                  paginationModel={{ page, pageSize: rowsPerPage }}
                  onPaginationModelChange={(model) => {
                    setPage(model.page);
                    setRowsPerPage(model.pageSize);
                  }}
                  pageSizeOptions={[25, 50, 100]}
                  sortingMode="server"
                  sortModel={sortModel}
                  onSortModelChange={setSortModel}
                  filterMode="server"
                  filterModel={filterModel}
                  onFilterModelChange={setFilterModel}
                  checkboxSelection
                  onRowSelectionModelChange={(newSelection) => {
                    setSelectedTransactionIds(newSelection);
                  }}
                  rowSelectionModel={selectedTransactionIds}
                  disableRowSelectionOnClick
                />
              </Box>
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

          {/* Confirmation Dialog */}
          <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogContent>
              <DialogContentText>{confirmDialog.content}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>Cancel</Button>
              <Button onClick={confirmDialog.onConfirm} color="error" variant="contained" autoFocus>Delete</Button>
            </DialogActions>
          </Dialog>

          {/* General Toast */}
          <Snackbar
            open={toastOpen}
            autoHideDuration={6000}
            onClose={() => setToastOpen(false)}
            message={toastMessage}
            action={
              toastAction ? (
                <Button color="secondary" size="small" onClick={toastAction}>
                  Create Rule
                </Button>
              ) : null
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
