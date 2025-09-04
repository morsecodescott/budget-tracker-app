import React from "react";
import { Card, CardContent, Typography, Box, Divider } from "@mui/material";

const BudgetSummary = ({ title, income, expenses, remaining, isOver }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h3">{title}</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ marginBottom: 1 }} display="flex" justifyContent="space-between">
                    <Typography>Income:</Typography>
                    <Typography>${income}</Typography>
                </Box>
                <Box sx={{ marginBottom: 1 }} display="flex" justifyContent="space-between">
                    <Typography>Expenses:</Typography>
                    <Typography>${expenses}</Typography>
                </Box>
                <Divider />
                <Box sx={{ marginBottom: 1 }} display="flex" justifyContent="space-between">
                    <Typography>{isOver ? "Over:" : "Remaining:"}</Typography>
                    <Typography color={isOver ? "error" : "textPrimary"}>
                        ${Math.abs(remaining)}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default BudgetSummary;
