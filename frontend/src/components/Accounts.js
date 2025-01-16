import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosConfig';
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
    Container,
    IconButton,
    Skeleton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import Breadcrumbs from "./Breadcrumbs";
import PlaidLinkButton from './PlaidLinkButton';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unlinkingItemId, setUnlinkingItemId] = useState(null);
    const [collapsedInstitutions, setCollapsedInstitutions] = useState([]);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [itemToUnlink, setItemToUnlink] = useState(null);
    const [linkToken, setLinkToken] = useState(null);
    const [linkTokenError, setLinkTokenError] = useState(null);

    // Breadcrumbs array
    const breadcrumbs = [
        { label: "Home", path: "/" },
        { label: "Dashboard", path: "/dashboard" },
        { label: "Accounts", path: "" }
    ];

    useEffect(() => {
        fetchAccounts();
        fetchLinkToken();
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

    const fetchLinkToken = async () => {
        try {
            const response = await axios.post('/plaid/create_link_token');
            setLinkToken(response.data.link_token);
            setLinkTokenError(null);
        } catch (err) {
            console.error('Error fetching link token:', err);
            setLinkTokenError('Failed to initialize Plaid connection. Please try again later.');
        }
    };

    const handleUnlinkClick = (itemId) => {
        setItemToUnlink(itemId);
        setConfirmDialogOpen(true);
    };

    const handleUnlinkConfirm = async () => {
        try {
            setConfirmDialogOpen(false);
            setUnlinkingItemId(itemToUnlink);
            setError(null);

            await axios.delete(`/plaid/items/${itemToUnlink}`);

            // Refresh accounts after successful unlink
            await fetchAccounts();
        } catch (err) {
            console.error('Error unlinking account:', err);
            setError('Failed to unlink account. Please try again later.');
        } finally {
            setUnlinkingItemId(null);
            setItemToUnlink(null);
        }
    };

    const handleUnlinkCancel = () => {
        setConfirmDialogOpen(false);
        setItemToUnlink(null);
    };

    // Group accounts by itemId
    const groupedAccounts = accounts.reduce((groups, account) => {
        const group = groups[account.itemId] || [];
        group.push(account);
        groups[account.itemId] = group;
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
                <Typography variant="h6" gutterBottom>
                    No accounts linked yet
                </Typography>
                {linkTokenError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {linkTokenError}
                    </Alert>
                )}
                <PlaidLinkButton linkToken={linkToken} />
            </Box>
        );
    }

    return (
        <Container maxWidth="md">
            <Box p={3}>
                <Breadcrumbs items={breadcrumbs} />
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Linked Accounts
                </Typography>
                <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={2}>
                    {Object.entries(groupedAccounts).map(([itemId, itemAccounts]) => {
                        const institutionName = itemAccounts[0].institutionName;
                        return (
                            <Card key={itemId} sx={{ mb: 2, boxShadow: 3, background: 'linear-gradient(45deg, #f5f5f5, #ffffff)', '&:hover': { boxShadow: 6 } }}>
                                <CardHeader
                                    title={
                                        <Box display="flex" alignItems="center">
                                            <AccountBalanceIcon sx={{ mr: 1 }} />
                                            <Box>
                                                <Typography variant="h6">{institutionName}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Item ID: {itemId}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                    action={
                                        <Box>
                                            <IconButton onClick={() => toggleCollapse(itemId)}>
                                                {collapsedInstitutions.includes(itemId) ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                                            </IconButton>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => handleUnlinkClick(itemId)}
                                                disabled={unlinkingItemId === itemId}
                                                sx={{ ml: 1 }}
                                            >
                                                {unlinkingItemId === itemId ? (
                                                    <CircularProgress size={20} />
                                                ) : (
                                                    'Unlink'
                                                )}
                                            </Button>
                                        </Box>
                                    }
                                />
                                {!collapsedInstitutions.includes(itemId) && (
                                    <CardContent>
                                        <List>
                                            {itemAccounts.map((account) => (
                                                <ListItem
                                                    key={account._id}
                                                    divider
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
                                                                    color="text.secondary"
                                                                    display="block"
                                                                >
                                                                    Account ID: {account._id}
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
                        );
                    })}
                </Box>
            </Box>
            <Dialog
                open={confirmDialogOpen}
                onClose={handleUnlinkCancel}
                aria-labelledby="unlink-dialog-title"
            >
                <DialogTitle id="unlink-dialog-title">Unlink Accounts</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to unlink all accounts from this institution? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUnlinkCancel} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleUnlinkConfirm} color="error" autoFocus>
                        Unlink
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Accounts;
