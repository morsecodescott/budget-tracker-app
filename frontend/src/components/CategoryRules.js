import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import axios from "axios";
import Breadcrumbs from "./Breadcrumbs";

const CategoryRules = () => {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [ruleData, setRuleData] = useState({
    merchantName: "",
    matchType: "contains",
    categoryId: ""
  });

  const breadcrumbs = [
    { label: "Home", path: "/" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Category Rules", path: "" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const flattenCategories = (categories) => {
    const result = [];
    const traverse = (category, parentName = null) => {
      result.push({
        _id: category._id,
        name: category.name,
        parentCategory: parentName,
      });
      if(category.children) {
          category.children.forEach((child) => traverse(child, category.name));
      }
    };
    categories.forEach((category) => traverse(category));
    return result;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, catRes] = await Promise.all([
        axios.get("/category-rules"),
        axios.get("/categories")
      ]);
      setRules(rulesRes.data);
      setCategories(flattenCategories(catRes.data));
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setRuleData({
        merchantName: rule.merchantName,
        matchType: rule.matchType,
        categoryId: rule.categoryId._id || rule.categoryId
      });
    } else {
      setEditingRule(null);
      setRuleData({
        merchantName: "",
        matchType: "contains",
        categoryId: ""
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingRule) {
        await axios.put(`/category-rules/${editingRule._id}`, ruleData);
      } else {
        await axios.post("/category-rules", ruleData);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      alert("Failed to save rule");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this rule?")) {
      try {
        await axios.delete(`/category-rules/${id}`);
        fetchData();
      } catch (err) {
        alert("Failed to delete rule");
      }
    }
  };

  const handleApply = async (id) => {
    if (window.confirm("Are you sure you want to run this rule against all past transactions?")) {
        try {
            const res = await axios.post(`/category-rules/${id}/apply`);
            alert(res.data.message);
        } catch (err) {
            alert("Failed to apply rule to past transactions");
        }
    }
  }

  return (
    <Container maxWidth="md">
      <Box p={3}>
        <Breadcrumbs items={breadcrumbs} />
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} mb={3}>
          <Typography variant="h5">Category Rules</Typography>
          <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
            Create Rule
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Merchant Match</TableCell>
                    <TableCell>Match Type</TableCell>
                    <TableCell>Assigned Category</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No rules found</TableCell>
                    </TableRow>
                  ) : (
                    rules.map((rule) => (
                      <TableRow key={rule._id}>
                        <TableCell>{rule.merchantName}</TableCell>
                        <TableCell>{rule.matchType}</TableCell>
                        <TableCell>{rule.categoryId?.name}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="primary" onClick={() => handleApply(rule._id)} title="Run on past transactions">
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleOpenDialog(rule)} title="Edit">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(rule._id)} title="Delete">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editingRule ? "Edit Rule" : "Create Rule"}</DialogTitle>
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
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CategoryRules;