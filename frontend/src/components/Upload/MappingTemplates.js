import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const MappingTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [open, setOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        mapping: { date: '', amount: '', merchant_name: '', name: '' }
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get('/transactions/templates', { withCredentials: true });
            setTemplates(response.data);
        } catch (error) {
            console.error("Error fetching templates", error);
        }
    };

    const handleSave = async () => {
        try {
            await axios.post('/transactions/templates', newTemplate, { withCredentials: true });
            setOpen(false);
            setNewTemplate({ name: '', mapping: { date: '', amount: '', merchant_name: '', name: '' } });
            fetchTemplates();
        } catch (error) {
            console.error("Error saving template", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/transactions/templates/${id}`, { withCredentials: true });
            fetchTemplates();
        } catch (error) {
            console.error("Error deleting template", error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>CSV Mapping Templates</Typography>
            <Button variant="contained" onClick={() => setOpen(true)} sx={{ mb: 2 }}>Create New Template</Button>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Template Name</TableCell>
                            <TableCell>Date Column</TableCell>
                            <TableCell>Amount Column</TableCell>
                            <TableCell>Merchant Column</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {templates.map((template) => (
                            <TableRow key={template._id}>
                                <TableCell>{template.name}</TableCell>
                                <TableCell>{template.mapping.date}</TableCell>
                                <TableCell>{template.mapping.amount}</TableCell>
                                <TableCell>{template.mapping.merchant_name}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleDelete(template._id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Create Mapping Template</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus margin="dense" label="Template Name (e.g. Chase CSV)" fullWidth
                        value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    />
                    <TextField
                        margin="dense" label="Date CSV Header" fullWidth
                        value={newTemplate.mapping.date} onChange={(e) => setNewTemplate({ ...newTemplate, mapping: { ...newTemplate.mapping, date: e.target.value } })}
                    />
                    <TextField
                        margin="dense" label="Amount CSV Header" fullWidth
                        value={newTemplate.mapping.amount} onChange={(e) => setNewTemplate({ ...newTemplate, mapping: { ...newTemplate.mapping, amount: e.target.value } })}
                    />
                    <TextField
                        margin="dense" label="Merchant CSV Header" fullWidth
                        value={newTemplate.mapping.merchant_name} onChange={(e) => setNewTemplate({ ...newTemplate, mapping: { ...newTemplate.mapping, merchant_name: e.target.value } })}
                    />
                     <TextField
                        margin="dense" label="Secondary Description CSV Header (Optional)" fullWidth
                        value={newTemplate.mapping.name} onChange={(e) => setNewTemplate({ ...newTemplate, mapping: { ...newTemplate.mapping, name: e.target.value } })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MappingTemplates;
