import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Breadcrumbs,
    Link,
    Container,
    IconButton,
    Skeleton,
} from '@mui/material';
import PlaidLinkButton from './PlaidLinkButton';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [collapsedInstitutions, setCollapsedInstitutions] = useState([]);
    const navigate = useNavigate();

    // Breadcrumbs array
    const breadcrumbs = [
        <Link key="home" underline="hover" color="inherit" onClick={() => navigate('/')} component="button"
            sx={{ cursor: 'pointer' }}>
            Home
        </Link>,
        <Link key="admin" underline="hover" color="inherit" onClick={() => navigate('/dashboard')} component="button"
            sx={{ cursor: 'pointer' }}>
            Dashboard
        </Link>,
        <Typography key="categories" color="text.primary">
            Accounts
        </Typography>,
    ];

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await axios.get('/plaid/accounts');
            setAccounts(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch accounts. Please try again later.');
            console.error('Error fetching accounts:', err);
        } finally {
            setLoading(false);
        }
    };

    // Group accounts by institution
    const groupedAccounts = accounts.reduce((groups, account) => {
        const group = groups[account.institutionName] || [];
        group.push(account);
        groups[account.institutionName] = group;
        return groups;
    }, {});

    // Toggle collapse for institution cards
    const toggleCollapse = (institutionName) => {
        if (collapsedInstitutions.includes(institutionName)) {
            setCollapsedInstitutions(collapsedInstitutions.filter(name => name !== institutionName));
        } else {
            setCollapsedInstitutions([...collapsedInstitutions, institutionName]);
        }
    };

    if (loading) {
        return (
            <Box p={3}>
                <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (accounts.length === 0) {
        return (
            <Box p={3} textAlign="center">
                <img src="/empty-state-illustration.svg" alt="No accounts" style={{ width: '200px', marginBottom: '16px' }} />
                <Typography variant="h6" gutterBottom>
                    No accounts linked yet
                </Typography>
                <PlaidLinkButton />
            </Box>
        );
    }

    return (
        <Container maxWidth="md">
            <Box p={3}>
                <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                    {breadcrumbs}
                </Breadcrumbs>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Linked Accounts
                </Typography>
                <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
                    {Object.entries(groupedAccounts).map(([institutionName, institutionAccounts]) => (
                        <Card key={institutionName} sx={{ mb: 2, boxShadow: 3, background: 'linear-gradient(45deg, #f5f5f5, #ffffff)', '&:hover': { boxShadow: 6 } }}>
                            <CardHeader
                                title={
                                    <Box display="flex" alignItems="center">
                                        <AccountBalanceIcon sx={{ mr: 1 }} />
                                        <Typography variant="h6">{institutionName}</Typography>
                                    </Box>
                                }
                                action={
                                    <IconButton onClick={() => toggleCollapse(institutionName)}>
                                        {collapsedInstitutions.includes(institutionName) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                                    </IconButton>
                                }
                            />
                            {!collapsedInstitutions.includes(institutionName) && (
                                <CardContent>
                                    <List>
                                        {institutionAccounts.map((account) => (
                                            <ListItem
                                                key={account._id}
                                                divider
                                                secondaryAction={
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        onClick={() => { }}
                                                    >
                                                        Unlink
                                                    </Button>
                                                }
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Typography>
                                                            {account.accountName} {account.mask && `(****${account.mask})`}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                color="text.secondary"
                                                                display="block"
                                                            >
                                                                {account.accountType} - {account.accountSubType}
                                                            </Typography>
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                sx={{
                                                                    color: account.availableBalance >= 0 ? 'success.main' : 'error.main',
                                                                    fontWeight: 'bold',
                                                                }}
                                                            >
                                                                ${(account.availableBalance || account.currentBalance || 0).toFixed(2)}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </Box>
            </Box>
        </Container>
    );
};

export default Accounts;