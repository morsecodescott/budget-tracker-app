import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Grid,
    Typography,
    Box,
    CardContent,
    Divider,
    Card,
    ListItem,
    List,
    TextField,
    Button,
    Autocomplete,
    CircularProgress
} from "@mui/material";
import Breadcrumbs from "./Breadcrumbs";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ChartOverTime from './charts/ChartOverTime';
import ChartByCategory from './charts/ChartByCategory';
import ChartByMerchant from './charts/ChartByMerchant';

const Trends = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 180)),
        endDate: new Date(),
    });
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [loading, setLoading] = useState(true); // Global loading state
    const [activeChart, setActiveChart] = useState('overTime');

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

    // Fetch transactions when filters change
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (dateRange.startDate && dateRange.endDate) {
                fetchTransactions();
            }
        }, 500); // Delay of 300ms
        return () => clearTimeout(timeout);
    }, [dateRange, selectedCategories]);

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
                console.error("Failed to fetch categories:", err);
            }
        };
        fetchCategories();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/plaid/transactions', {
                params: {
                    startDate: dateRange.startDate.toISOString(),
                    endDate: dateRange.endDate.toISOString(),
                    category: selectedCategories.length > 0 ? selectedCategories.map((c) => c._id) : undefined,
                    transactionType: 'Expense'
                }
            });
            setTransactions(response.data.transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (field, value) => {
        setDateRange((prev) => ({ ...prev, [field]: value }));
    };

    const handleCategoryChange = (newValue) => {
        setSelectedCategories(newValue);
    };

    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Dashboard", path: "/dashboard" },
        { label: "Trends", path: "" }
    ];

    const renderChart = () => {
        switch (activeChart) {
            case 'overTime':
                return <ChartOverTime transactions={transactions} />;
            case 'byCategory':
                return <ChartByCategory transactions={transactions} />;
            case 'byMerchant':
                return <ChartByMerchant transactions={transactions} />;
            default:
                return <Typography>No chart selected</Typography>;
        }
    };

    return (
        <Container maxWidth="lg">
            <Grid container direction="row" spacing={2} sx={{ justifyContent: "center", alignItems: "flex-start" }}>
                <Grid item xs={12} sm={12}>
                    <Box sx={{ p: 2 }}>
                        <Breadcrumbs items={breadcrumbs} />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Card>
                        <CardContent>
                            <Typography>Chart Types</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1-content"
                                    id="panel1-header"
                                >
                                    Spending
                                </AccordionSummary>
                                <AccordionDetails>
                                    <List>
                                        <ListItem button onClick={() => setActiveChart('overTime')}>Over Time</ListItem>
                                        <ListItem button onClick={() => setActiveChart('byCategory')}>By Category</ListItem>
                                        <ListItem button onClick={() => setActiveChart('byMerchant')}>By Merchant</ListItem>
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <Card>
                        <CardContent>
                            {loading ? (
                                <Box display="flex" justifyContent="center" mt={3}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <>
                                    <Typography>Trends</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    {console.log("Data: ", transactions)}
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
                                    </Grid>
                                    <Button variant="contained" onClick={fetchTransactions}>Filter</Button>
                                    {renderChart()}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Trends;
