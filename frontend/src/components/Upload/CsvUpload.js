import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, TextField, CircularProgress, Alert, Divider
} from '@mui/material';

const CsvUpload = () => {
    const [templates, setTemplates] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // New manual account state
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [newAccountInfo, setNewAccountInfo] = useState({ institutionName: '', accountName: '' });

    useEffect(() => {
        fetchTemplates();
        fetchAccounts();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get('/transactions/templates', { withCredentials: true });
            setTemplates(response.data);
        } catch (error) {
            console.error("Error fetching templates", error);
        }
    };

    const fetchAccounts = async () => {
        try {
            // Reusing existing plaid item fetching to get accounts
            const response = await axios.get('/plaid/items', { withCredentials: true });
            const allAccounts = response.data.flatMap(item => item.accounts.map(acc => ({ ...acc, institutionName: item.institutionName })));
            setAccounts(allAccounts);
        } catch (error) {
            console.error("Error fetching accounts", error);
        }
    };

    const handleCreateAccount = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/transactions/manual-account', newAccountInfo, { withCredentials: true });
            setSuccess(`Created manual account: ${response.data.account.accountName}`);
            setIsCreatingAccount(false);
            setNewAccountInfo({ institutionName: '', accountName: '' });
            fetchAccounts(); // Refresh list
            setSelectedAccount(response.data.account._id);
        } catch (error) {
            setError('Failed to create account.');
            console.error("Error creating account", error);
        }
        setLoading(false);
    };

    const parseCsv = (text) => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];

        // Basic CSV parsing (handles quotes simply)
        for (let i = 1; i < lines.length; i++) {
            // Regex to split by comma, ignoring commas inside quotes
            const rowStr = lines[i];
            const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
            const rowValues = rowStr.split(regex).map(val => val.replace(/^"|"$/g, '').trim());

            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = rowValues[index];
            });
            data.push(rowData);
        }
        return data;
    };

    const handleUpload = async () => {
        if (!file || !selectedAccount || !selectedTemplate) {
            setError('Please select a file, account, and template.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target.result;
                const transactions = parseCsv(text);

                if (transactions.length === 0) {
                     setError('Failed to parse CSV or file is empty.');
                     setLoading(false);
                     return;
                }

                try {
                    const response = await axios.post('/transactions/upload', {
                        accountId: selectedAccount,
                        templateId: selectedTemplate,
                        transactions
                    }, { withCredentials: true });

                    setSuccess(`Upload complete! Successfully imported ${response.data.count} new transactions.`);
                    setFile(null);
                } catch (uploadError) {
                    setError('Failed to process upload on the server.');
                    console.error("Upload error", uploadError);
                }
                setLoading(false);
            };
            reader.readAsText(file);

        } catch (error) {
             setError('Failed to read file.');
             setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 600 }}>
            <Typography variant="h5" gutterBottom>Upload Transactions CSV</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {!isCreatingAccount ? (
                <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Select Account</InputLabel>
                        <Select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            label="Select Account"
                        >
                            {accounts.map(acc => (
                                <MenuItem key={acc._id} value={acc._id}>
                                    {acc.institutionName} - {acc.accountName} {acc.mask ? `(x${acc.mask})` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="text" onClick={() => setIsCreatingAccount(true)}>
                        Or Create New Manual Account
                    </Button>
                </Box>
            ) : (
                <Box sx={{ mb: 3, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
                    <Typography variant="subtitle1">Create Manual Account</Typography>
                    <TextField
                        fullWidth margin="dense" label="Institution / Bank Name"
                        value={newAccountInfo.institutionName}
                        onChange={(e) => setNewAccountInfo({...newAccountInfo, institutionName: e.target.value})}
                    />
                    <TextField
                        fullWidth margin="dense" label="Account Name (e.g. My Checking)"
                        value={newAccountInfo.accountName}
                        onChange={(e) => setNewAccountInfo({...newAccountInfo, accountName: e.target.value})}
                    />
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                         <Button variant="contained" onClick={handleCreateAccount} disabled={loading || !newAccountInfo.institutionName || !newAccountInfo.accountName}>
                             Create
                         </Button>
                         <Button variant="outlined" onClick={() => setIsCreatingAccount(false)}>Cancel</Button>
                    </Box>
                </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <FormControl fullWidth margin="normal">
                <InputLabel>Select Mapping Template</InputLabel>
                <Select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    label="Select Mapping Template"
                >
                    {templates.map(t => (
                        <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Box sx={{ my: 2 }}>
                <Button variant="outlined" component="label">
                    Choose CSV File
                    <input type="file" hidden accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
                </Button>
                {file && <Typography variant="body2" sx={{ mt: 1, ml: 2, display: 'inline' }}>Selected: {file.name}</Typography>}
            </Box>

            <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={loading || !file || !selectedAccount || !selectedTemplate}
            >
                {loading ? <CircularProgress size={24} /> : 'Upload Transactions'}
            </Button>
        </Box>
    );
};

export default CsvUpload;
